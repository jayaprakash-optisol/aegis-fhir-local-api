import { ApiProperty } from '@nestjs/swagger';
import type { Patient, MedicationStatement, Resource } from 'fhir/r4';

export class PatientWithHistoryResponseDto {
  @ApiProperty({
    description: 'FHIR Patient resource',
    type: Object,
  })
  patient: Patient;

  @ApiProperty({
    description: 'List of MedicationStatement resources for the patient',
    type: [Object],
  })
  medications: MedicationStatement[];

  @ApiProperty({
    description: 'Other related resources (AllergyIntolerance, Condition, etc.)',
    type: [Object],
  })
  otherResources: Resource[];
}

