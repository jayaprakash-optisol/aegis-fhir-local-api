import { ApiProperty } from '@nestjs/swagger';
import type { Patient } from 'fhir/r4';

export class PatientResponseDto {
  @ApiProperty({
    description: 'FHIR Patient resource',
    type: Object,
  })
  patient: Patient;
}

