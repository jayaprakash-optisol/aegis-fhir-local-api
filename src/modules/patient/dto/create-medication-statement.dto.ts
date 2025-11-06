import { IsString, IsOptional, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MedicationStatementStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  INTENDED = 'intended',
  STOPPED = 'stopped',
  ON_HOLD = 'on-hold',
  UNKNOWN = 'unknown',
  NOT_TAKEN = 'not-taken',
}

export class DosageDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'Dosage quantity value',
  })
  @IsOptional()
  @IsString()
  quantityValue?: string;

  @ApiPropertyOptional({
    example: 'Tablet',
    description: 'Dosage quantity unit (e.g., Tablet, mg, ml)',
  })
  @IsOptional()
  @IsString()
  quantityUnit?: string;

  @ApiPropertyOptional({
    example: 'every 6 hours',
    description: 'Frequency of administration (e.g., "every 6 hours", "twice daily")',
  })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({
    example: 'as needed',
    description: 'Additional instructions (e.g., "as needed", "with food")',
  })
  @IsOptional()
  @IsString()
  asNeededReason?: string;
}

export class CreateMedicationStatementDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'Patient ID (optional - will be taken from URL path if not provided)',
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({
    example: 'Paracetamol',
    description: 'Name of the medication',
  })
  @IsString()
  medicationName: string;

  @ApiPropertyOptional({
    example: 'http://www.nlm.nih.gov/research/umls/rxnorm',
    description: 'Medication coding system (optional)',
  })
  @IsOptional()
  @IsString()
  medicationSystem?: string;

  @ApiPropertyOptional({
    example: '161',
    description: 'Medication code (e.g., RxNorm code)',
  })
  @IsOptional()
  @IsString()
  medicationCode?: string;

  @ApiProperty({
    example: MedicationStatementStatus.ACTIVE,
    enum: MedicationStatementStatus,
    description: 'Status of the medication statement',
  })
  @IsEnum(MedicationStatementStatus)
  status: MedicationStatementStatus;

  @ApiPropertyOptional({
    type: DosageDto,
    description: 'Dosage information',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DosageDto)
  dosage?: DosageDto;

  @ApiPropertyOptional({
    example: 'for the pain',
    description: 'Reason for taking the medication',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Date when medication was started',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-20',
    description: 'Date when medication was ended (if applicable)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

