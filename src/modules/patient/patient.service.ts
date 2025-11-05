import { Injectable, Logger } from '@nestjs/common';
import { FhirService } from '../../common/fhir/fhir.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient, HumanName, ContactPoint, Address, Identifier } from 'fhir/r4';

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
}
