import { IsString, IsOptional, IsEmail, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

export class AddressDto {
  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Street address line',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    example: 'Metropolis',
    description: 'City name',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'NY',
    description: 'State or province code',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: '10001',
    description: 'Postal/ZIP code',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'USA',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  country?: string;
}

export class TelecomDto {
  @ApiPropertyOptional({
    example: 'phone',
    enum: ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'],
    description: 'Telecom system type',
  })
  @IsOptional()
  @IsEnum(['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'])
  system?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Contact value (phone number, email, etc.)',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class IdentifierDto {
  @ApiPropertyOptional({
    example: 'MRN12345',
    description: 'Identifier value',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    example: 'Medical Record Number',
    description: 'Identifier type description',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'http://hospital.smarthealthit.org',
    description: 'Identifier system URL',
  })
  @IsOptional()
  @IsString()
  system?: string;
}

export class CreatePatientDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the patient',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the patient',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    example: 'Jane',
    description: 'Middle name of the patient',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({
    example: '1990-01-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    enum: Gender,
    description: 'Gender of the patient',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    type: AddressDto,
    description: 'Patient address',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    type: [IdentifierDto],
    description: 'Patient identifiers (MRN, SSN, etc.)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentifierDto)
  identifiers?: IdentifierDto[];
}
