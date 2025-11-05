import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - Register credentials
   * @returns User data
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, name, password, role } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: { email, name, password: hashedPassword, role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns User if credentials are valid, false otherwise
   */
  async validateUser(email: string, password: string): Promise<false | Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Login user
   * @param loginDto - Login credentials
   * @returns Access token, refresh token and user data
   */
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = loginDto;

    const validatedUser = await this.validateUser(email, password);

    if (!validatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: validatedUser.id, email: validatedUser.email, role: validatedUser.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validate refresh token and generate new tokens
   * @param refreshToken - Refresh token
   * @returns New access token and refresh token
   */
  async validateRefreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify the refresh token
      const decoded = await this.jwtService.verify(refreshToken);

      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token');
      }

      // Verify the user still exists
      const user = await this.findUserById(decoded.sub);

      // Generate new tokens with the user's current information
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '1h',
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      // Handle specific JWT errors for better error messages
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

