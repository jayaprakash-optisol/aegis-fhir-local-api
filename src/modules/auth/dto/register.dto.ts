import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: Role.CLINICIAN,
    enum: Role,
    description: 'User role in the system',
    default: Role.CLINICIAN,
  })
  @IsNotEmpty({ each: true })
  @IsEnum(Role)
  role?: Role = Role.CLINICIAN;
}

