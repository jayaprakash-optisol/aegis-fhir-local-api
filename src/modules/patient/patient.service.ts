import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FhirService } from '../../common/fhir/fhir.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateMedicationStatementDto } from './dto/create-medication-statement.dto';
import {
  Patient,
  HumanName,
  ContactPoint,
  Address,
  Identifier,
  MedicationStatement,
  CodeableConcept,
  Dosage,
  Timing,
  Resource,
} from 'fhir/r4';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private readonly fhirService: FhirService) {}

  /**
   * Converts incoming patient data (normal JSON) to FHIR Patient resource format
   */
  convertToFhirPatient(createPatientDto: CreatePatientDto): Patient {
    const patient: Patient = {
      resourceType: 'Patient',
    };

    // Convert name
    const name: HumanName = {
      family: createPatientDto.lastName,
      given: createPatientDto.middleName
        ? [createPatientDto.firstName, createPatientDto.middleName]
        : [createPatientDto.firstName],
    };
    patient.name = [name];

    // Convert date of birth
    if (createPatientDto.dateOfBirth) {
      patient.birthDate = createPatientDto.dateOfBirth;
    }

    // Convert gender
    if (createPatientDto.gender) {
      patient.gender = createPatientDto.gender;
    }

    // Convert telecom (phone and email)
    const telecom: ContactPoint[] = [];
    if (createPatientDto.phone) {
      telecom.push({
        system: 'phone',
        value: createPatientDto.phone,
      });
    }
    if (createPatientDto.email) {
      telecom.push({
        system: 'email',
        value: createPatientDto.email,
      });
    }
    if (telecom.length > 0) {
      patient.telecom = telecom;
    }

    // Convert address
    if (createPatientDto.address) {
      const address: Address = {};
      if (createPatientDto.address.street) {
        address.line = [createPatientDto.address.street];
      }
      if (createPatientDto.address.city) {
        address.city = createPatientDto.address.city;
      }
      if (createPatientDto.address.state) {
        address.state = createPatientDto.address.state;
      }
      if (createPatientDto.address.postalCode) {
        address.postalCode = createPatientDto.address.postalCode;
      }
      if (createPatientDto.address.country) {
        address.country = createPatientDto.address.country;
      }
      patient.address = [address];
    }

    // Convert identifiers
    if (createPatientDto.identifiers && createPatientDto.identifiers.length > 0) {
      const identifiers: Identifier[] = createPatientDto.identifiers.map((id) => {
        const identifier: Identifier = {
          value: id.value,
        };

        if (id.system) {
          identifier.system = id.system;
        }

        if (id.type) {
          identifier.type = {
            text: id.type,
          };
        }

        return identifier;
      });
      patient.identifier = identifiers;
    }

    return patient;
  }

  /**
   * Creates a patient in the FHIR store
   */
  async createPatient(createPatientDto: CreatePatientDto): Promise<Patient> {
    this.logger.log('Converting patient data to FHIR format');
    const fhirPatient = this.convertToFhirPatient(createPatientDto);

    this.logger.log('Storing patient in FHIR store');
    const createdPatient = await this.fhirService.create<Patient>(fhirPatient);

    return createdPatient;
  }

  /**
   * Retrieves a patient by ID from the FHIR store
   */
  async getPatientById(id: string): Promise<Patient> {
    return await this.fhirService.read<Patient>('Patient', id);
  }

  /**
   * Searches for patients
   */
  async searchPatients(params?: Record<string, string>): Promise<Patient[]> {
    const bundle = await this.fhirService.search<Patient>('Patient', params);
    return bundle.entry?.map((entry) => entry.resource as Patient).filter(Boolean) || [];
  }

  /**
   * Converts incoming medication data to FHIR MedicationStatement resource format
   */
  convertToFhirMedicationStatement(
    createMedicationDto: CreateMedicationStatementDto,
  ): MedicationStatement {
    if (!createMedicationDto.patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    const medicationStatement: MedicationStatement = {
      resourceType: 'MedicationStatement',
      status: createMedicationDto.status,
      subject: {
        reference: `Patient/${createMedicationDto.patientId}`,
      },
    };

    // Convert medication
    const medication: CodeableConcept = {
      text: createMedicationDto.medicationName,
    };

    if (createMedicationDto.medicationCode || createMedicationDto.medicationSystem) {
      medication.coding = [
        {
          ...(createMedicationDto.medicationSystem && {
            system: createMedicationDto.medicationSystem,
          }),
          ...(createMedicationDto.medicationCode && { code: createMedicationDto.medicationCode }),
          display: createMedicationDto.medicationName,
        },
      ];
    }

    medicationStatement.medicationCodeableConcept = medication;

    // Convert dosage
    if (createMedicationDto.dosage) {
      const dosage: Dosage = {};

      if (createMedicationDto.dosage.quantityValue || createMedicationDto.dosage.quantityUnit) {
        dosage.doseAndRate = [
          {
            doseQuantity: {
              ...(createMedicationDto.dosage.quantityValue && {
                value: parseFloat(createMedicationDto.dosage.quantityValue),
              }),
              ...(createMedicationDto.dosage.quantityUnit && {
                unit: createMedicationDto.dosage.quantityUnit,
              }),
            },
          },
        ];
      }

      if (createMedicationDto.dosage.frequency) {
        const timing: Timing = {
          repeat: {
            frequency: 1,
            period: 6,
            periodUnit: 'h',
          },
        };

        // Parse frequency string (e.g., "every 6 hours" -> period: 6, periodUnit: 'h')
        const frequencyMatch = createMedicationDto.dosage.frequency.match(
          /every\s+(\d+)\s+(hour|hours|day|days|week|weeks)/i,
        );
        if (frequencyMatch) {
          const period = parseInt(frequencyMatch[1], 10);
          const unit = frequencyMatch[2].toLowerCase().replace(/s$/, ''); // Remove plural
          timing.repeat = {
            frequency: 1,
            period,
            periodUnit: unit === 'hour' ? 'h' : unit === 'day' ? 'd' : unit === 'week' ? 'wk' : 'h',
          };
        } else {
          // Fallback: try to extract number and assume hours
          const numberMatch = createMedicationDto.dosage.frequency.match(/(\d+)/);
          if (numberMatch) {
            timing.repeat = {
              frequency: 1,
              period: parseInt(numberMatch[1], 10),
              periodUnit: 'h',
            };
          }
        }

        dosage.timing = timing;
      }

      if (createMedicationDto.dosage.asNeededReason) {
        dosage.asNeededBoolean = true;
        medicationStatement.reasonCode = [
          {
            text: createMedicationDto.dosage.asNeededReason,
          },
        ];
      }

      medicationStatement.dosage = [dosage];
    }

    // Add reason if provided
    if (createMedicationDto.reason) {
      medicationStatement.reasonCode = [
        {
          text: createMedicationDto.reason,
        },
      ];
    }

    // Add dates
    if (createMedicationDto.startDate) {
      medicationStatement.effectivePeriod = {
        start: createMedicationDto.startDate,
      };
      if (createMedicationDto.endDate) {
        medicationStatement.effectivePeriod.end = createMedicationDto.endDate;
      }
    }

    return medicationStatement;
  }

  /**
   * Creates a MedicationStatement in the FHIR store
   */
  async createMedicationStatement(
    createMedicationDto: CreateMedicationStatementDto,
  ): Promise<MedicationStatement> {
    this.logger.log('Converting medication data to FHIR format');
    const fhirMedicationStatement = this.convertToFhirMedicationStatement(createMedicationDto);

    this.logger.log('Storing MedicationStatement in FHIR store');
    const createdMedicationStatement =
      await this.fhirService.create<MedicationStatement>(fhirMedicationStatement);

    return createdMedicationStatement;
  }

  /**
   * Retrieves a patient with all related resources (medications, allergies, conditions, etc.)
   */
  async getPatientWithHistory(patientId: string): Promise<{
    patient: Patient;
    medications: MedicationStatement[];
    otherResources: Resource[];
  }> {
    // Get the patient
    const patient = await this.getPatientById(patientId);

    // Get all MedicationStatements for this patient
    const medicationBundle = await this.fhirService.search<MedicationStatement>(
      'MedicationStatement',
      { subject: `Patient/${patientId}` },
    );
    const medications =
      medicationBundle.entry?.map((entry) => entry.resource as MedicationStatement).filter(Boolean) ||
      [];

    // Get other related resources (AllergyIntolerance, Condition, Observation, etc.)
    const otherResources: Resource[] = [];

    // Get AllergyIntolerance resources
    try {
      const allergyBundle = await this.fhirService.search<Resource>('AllergyIntolerance', {
        patient: `Patient/${patientId}`,
      });
      const allergies =
        allergyBundle.entry?.map((entry) => entry.resource as Resource).filter(Boolean) || [];
      otherResources.push(...allergies);
    } catch (error) {
      this.logger.warn('Error fetching AllergyIntolerance resources', error);
    }

    // Get Condition resources
    try {
      const conditionBundle = await this.fhirService.search<Resource>('Condition', {
        subject: `Patient/${patientId}`,
      });
      const conditions =
        conditionBundle.entry?.map((entry) => entry.resource as Resource).filter(Boolean) || [];
      otherResources.push(...conditions);
    } catch (error) {
      this.logger.warn('Error fetching Condition resources', error);
    }

    // Get Observation resources
    try {
      const observationBundle = await this.fhirService.search<Resource>('Observation', {
        subject: `Patient/${patientId}`,
      });
      const observations =
        observationBundle.entry?.map((entry) => entry.resource as Resource).filter(Boolean) || [];
      otherResources.push(...observations);
    } catch (error) {
      this.logger.warn('Error fetching Observation resources', error);
    }

    return {
      patient,
      medications,
      otherResources,
    };
  }
}
