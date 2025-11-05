import { Bundle, Patient } from 'fhir/r4';
import { Fhir } from 'fhir';
import axios from 'axios';

const fhir = new Fhir();
const fhirLocalUrl = 'http://localhost:8080/fhir';

const fetchMetadata = async () => {
  const response = await axios.get(`${fhirLocalUrl}/metadata`);
  console.log(response.data);
};

const createPatient = async () => {
  const patientData: Patient = {
    resourceType: 'Patient',
    name: [
      {
        given: ['Michael'],
        family: 'Scofield',
      },
    ],
    telecom: [
      {
        system: 'phone',
        value: '1234567890',
      },
    ],
  };

  try {
    const validationResult = fhir.validate(patientData);
    if (!validationResult.valid) {
      throw new Error(JSON.stringify(validationResult.messages, null, 2));
    }
    const response = await axios.post<Patient>(`${fhirLocalUrl}/Patient`, patientData);
    console.log(response.data);
  } catch (error) {
    console.error('Error creating patient:', error);
  }
};

const fetchAllPatients = async () => {
  const response = await axios.get<Bundle<Patient>>(`${fhirLocalUrl}/Patient`);
  const patient = response.data.entry?.[0]?.resource;
  console.log(JSON.stringify(patient, null, 2));
};

const fetchPatientById = async (id: string) => {
  const response = await axios.get<Patient>(`${fhirLocalUrl}/Patient/${id}`);
  console.log(JSON.stringify(response.data, null, 2));
};

const updatePatient = async (id: string) => {
  const response = await axios.put<Patient>(`${fhirLocalUrl}/Patient/${id}`, {
    resourceType: 'Patient',
    id: id,
    name: [{ given: ['Michael'], family: 'Scofield' }],
    telecom: [{ system: 'phone', value: '12345678911' }],
  });
  console.log(JSON.stringify(response.data, null, 2));
};

const deletePatient = async (id: string) => {
  const response = await axios.delete(`${fhirLocalUrl}/Patient/${id}`);
  console.log(JSON.stringify(response.data, null, 2));
};

// createPatient();
// fetchAllPatients();
// fetchPatientById("1");
// updatePatient("1");
// deletePatient("1");
