# Patient Onboarding Flow - FHIR Store Integration

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Flow Diagram](#flow-diagram)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Conversion Process](#data-conversion-process)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)

---

## Overview

The Patient Onboarding flow enables the conversion of incoming patient data (normal JSON format) into FHIR-compliant Patient resources and stores them in a local FHIR server. This system provides:

- **Type-safe FHIR resource handling** using FHIR R4 types
- **Automatic data conversion** from business JSON to FHIR format
- **Resource validation** before storage
- **Role-based access control** for patient onboarding
- **Comprehensive error handling** and logging

---

## Architecture

### Components

```
┌─────────────────┐
│  Client/API     │
│   Request       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PatientController                       │
│  - POST /patient/onboard                 │
│  - GET /patient/:id                      │
│  - GET /patient                          │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  JwtAuthGuard + RolesGuard              │
│  - Validates JWT token                  │
│  - Checks DATA_SCIENTIST role           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PatientService                         │
│  - convertToFhirPatient()              │
│  - createPatient()                     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  FhirService                            │
│  - validate()                           │
│  - create()                             │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Local FHIR Server                      │
│  (http://localhost:8080/fhir)          │
└─────────────────────────────────────────┘
```

### Module Structure

- **`PatientModule`**: Handles patient-specific business logic
  - `PatientController`: REST API endpoints
  - `PatientService`: Business logic and FHIR conversion
  - `CreatePatientDto`: Input validation DTO

- **`FhirModule`**: Generic FHIR operations (Global module)
  - `FhirService`: CRUD operations for any FHIR resource type

---

## Flow Diagram

### Patient Onboarding Flow

```
1. Client sends POST /patient/onboard with JSON payload
   │
   ├─► JwtAuthGuard validates JWT token
   │
   ├─► RolesGuard checks for DATA_SCIENTIST role
   │
   ├─► PatientController receives CreatePatientDto
   │
   ├─► PatientService.convertToFhirPatient()
   │   └─► Converts JSON → FHIR Patient resource
   │       ├─► Name (firstName, lastName, middleName) → HumanName
   │       ├─► dateOfBirth → birthDate
   │       ├─► gender → gender
   │       ├─► email, phone → telecom[]
   │       ├─► address → address[]
   │       └─► identifiers → identifier[]
   │
   ├─► FhirService.create()
   │   ├─► Validates FHIR resource structure
   │   ├─► POST to FHIR server
   │   └─► Returns created Patient resource
   │
   └─► Response with FHIR Patient resource
```

---

## API Endpoints

### 1. Onboard Patient

**Endpoint:** `POST /patient/onboard`

**Description:** Converts incoming patient data to FHIR format and stores it in the FHIR store.

**Authentication:** Required (JWT Bearer Token)

**Authorization:** Requires `DATA_SCIENTIST` role

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:** `CreatePatientDto`

**Response:** `201 Created`

```json
{
  "patient": {
    "resourceType": "Patient",
    "id": "1",
    "name": [...],
    "birthDate": "1990-01-15",
    ...
  }
}
```

---

### 2. Get Patient by ID

**Endpoint:** `GET /patient/:id`

**Description:** Retrieves a patient from the FHIR store by ID.

**Authentication:** Required (JWT Bearer Token)

**Path Parameters:**

- `id` (string): FHIR Patient resource ID

**Response:** `200 OK`

```json
{
  "patient": {
    "resourceType": "Patient",
    "id": "1",
    ...
  }
}
```

---

### 3. Search Patients

**Endpoint:** `GET /patient`

**Description:** Searches for patients in the FHIR store.

**Authentication:** Required (JWT Bearer Token)

**Query Parameters:**

- `name` (optional): Search by patient name
- `birthdate` (optional): Search by birth date (YYYY-MM-DD)

**Response:** `200 OK`

```json
{
  "patients": [
    {
      "resourceType": "Patient",
      "id": "1",
      ...
    }
  ]
}
```

---

## Authentication & Authorization

### Authentication

All patient endpoints require JWT authentication:

1. **Obtain JWT Token**: Login via `POST /auth/login`
2. **Include Token**: Add `Authorization: Bearer <token>` header to requests

### Authorization

The patient onboarding endpoint (`POST /patient/onboard`) requires the `DATA_SCIENTIST` role:

- ✅ Users with `DATA_SCIENTIST` role can onboard patients
- ❌ Other roles (ADMIN, CLINICIAN, PATIENT) are denied access

**Guards Applied:**

- `JwtAuthGuard`: Validates JWT token
- `RolesGuard`: Checks user role against required roles

---

## Data Conversion Process

### Input Format (CreatePatientDto)

```typescript
{
  firstName: string;           // Required
  lastName: string;             // Required
  middleName?: string;          // Optional
  dateOfBirth?: string;        // Optional (YYYY-MM-DD)
  gender?: Gender;              // Optional (male|female|other|unknown)
  email?: string;               // Optional
  phone?: string;               // Optional
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  identifiers?: [{
    value?: string;
    type?: string;
    system?: string;
  }];
}
```

### FHIR Patient Resource Mapping

| Input Field            | FHIR Path                | Type         | Notes                        |
| ---------------------- | ------------------------ | ------------ | ---------------------------- |
| `firstName`            | `name[0].given[0]`       | string       | First name                   |
| `middleName`           | `name[0].given[1]`       | string       | Middle name (if provided)    |
| `lastName`             | `name[0].family`         | string       | Last name                    |
| `dateOfBirth`          | `birthDate`              | date         | YYYY-MM-DD format            |
| `gender`               | `gender`                 | code         | male\|female\|other\|unknown |
| `email`                | `telecom[].value`        | ContactPoint | system: "email"              |
| `phone`                | `telecom[].value`        | ContactPoint | system: "phone"              |
| `address.street`       | `address[0].line[0]`     | string       | Street address               |
| `address.city`         | `address[0].city`        | string       | City                         |
| `address.state`        | `address[0].state`       | string       | State/Province               |
| `address.postalCode`   | `address[0].postalCode`  | string       | ZIP/Postal code              |
| `address.country`      | `address[0].country`     | string       | Country                      |
| `identifiers[].value`  | `identifier[].value`     | string       | Identifier value             |
| `identifiers[].system` | `identifier[].system`    | uri          | Identifier system            |
| `identifiers[].type`   | `identifier[].type.text` | string       | Identifier type              |

### Conversion Logic

The `PatientService.convertToFhirPatient()` method performs the following conversions:

1. **Name Conversion**:

   ```typescript
   name: {
     family: lastName,
     given: middleName ? [firstName, middleName] : [firstName]
   }
   ```

2. **Telecom Conversion**:

   ```typescript
   telecom: [
     { system: 'phone', value: phone },
     { system: 'email', value: email },
   ];
   ```

3. **Address Conversion**:

   ```typescript
   address: [
     {
       line: [street],
       city: city,
       state: state,
       postalCode: postalCode,
       country: country,
     },
   ];
   ```

4. **Identifier Conversion**:
   ```typescript
   identifier: [
     {
       value: identifier.value,
       system: identifier.system,
       type: { text: identifier.type },
     },
   ];
   ```

---

## Request/Response Examples

### Example 1: Basic Patient Onboarding

**Request:**

```bash
curl -X POST http://localhost:3000/patient/onboard \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "email": "john.doe@example.com",
    "phone": "1234567890"
  }'
```

**Response:**

```json
{
  "patient": {
    "resourceType": "Patient",
    "id": "1",
    "name": [
      {
        "family": "Doe",
        "given": ["John"]
      }
    ],
    "birthDate": "1990-01-15",
    "gender": "male",
    "telecom": [
      {
        "system": "phone",
        "value": "1234567890"
      },
      {
        "system": "email",
        "value": "john.doe@example.com"
      }
    ]
  }
}
```

### Example 2: Complete Patient Onboarding with Address and Identifiers

**Request:**

```bash
curl -X POST http://localhost:3000/patient/onboard \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "middleName": "Marie",
    "dateOfBirth": "1985-05-20",
    "gender": "female",
    "email": "jane.smith@example.com",
    "phone": "9876543210",
    "address": {
      "street": "123 Main Street",
      "city": "Metropolis",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "identifiers": [
      {
        "value": "MRN12345",
        "type": "Medical Record Number",
        "system": "http://hospital.smarthealthit.org"
      }
    ]
  }'
```

**Response:**

```json
{
  "patient": {
    "resourceType": "Patient",
    "id": "2",
    "name": [
      {
        "family": "Smith",
        "given": ["Jane", "Marie"]
      }
    ],
    "birthDate": "1985-05-20",
    "gender": "female",
    "telecom": [
      {
        "system": "phone",
        "value": "9876543210"
      },
      {
        "system": "email",
        "value": "jane.smith@example.com"
      }
    ],
    "address": [
      {
        "line": ["123 Main Street"],
        "city": "Metropolis",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA"
      }
    ],
    "identifier": [
      {
        "value": "MRN12345",
        "system": "http://hospital.smarthealthit.org",
        "type": {
          "text": "Medical Record Number"
        }
      }
    ]
  }
}
```

### Example 3: Get Patient by ID

**Request:**

```bash
curl -X GET http://localhost:3000/patient/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response:**

```json
{
  "patient": {
    "resourceType": "Patient",
    "id": "1",
    "name": [
      {
        "family": "Doe",
        "given": ["John"]
      }
    ],
    "birthDate": "1990-01-15",
    "gender": "male",
    "telecom": [
      {
        "system": "phone",
        "value": "1234567890"
      },
      {
        "system": "email",
        "value": "john.doe@example.com"
      }
    ]
  }
}
```

### Example 4: Search Patients

**Request:**

```bash
curl -X GET "http://localhost:3000/patient?name=John" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response:**

```json
{
  "patients": [
    {
      "resourceType": "Patient",
      "id": "1",
      "name": [
        {
          "family": "Doe",
          "given": ["John"]
        }
      ],
      ...
    }
  ]
}
```

---

## Error Handling

### Validation Errors

**Status:** `400 Bad Request`

**Example - Missing Required Fields:**

```json
{
  "statusCode": 400,
  "message": ["firstName should not be empty", "lastName should not be empty"],
  "error": "Bad Request"
}
```

**Example - Invalid Email:**

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### FHIR Validation Errors

**Status:** `400 Bad Request`

**Example:**

```json
{
  "statusCode": 400,
  "message": "FHIR resource validation failed",
  "errors": [
    {
      "level": "error",
      "message": "Invalid FHIR structure..."
    }
  ]
}
```

### Authentication Errors

**Status:** `401 Unauthorized`

**Example:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Authorization Errors

**Status:** `403 Forbidden`

**Example:**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### Resource Not Found

**Status:** `400 Bad Request`

**Example:**

```json
{
  "statusCode": 400,
  "message": "Patient with id 999 not found"
}
```

### FHIR Server Errors

**Status:** `400 Bad Request`

**Example:**

```json
{
  "statusCode": 400,
  "message": "Failed to create Patient",
  "details": "..."
}
```

---

## Configuration

### Environment Variables

The FHIR service can be configured using environment variables:

**`.env` file:**

```env
# FHIR Server Configuration
FHIR_BASE_URL=http://localhost:8080/fhir

# JWT Configuration (for authentication)
JWT_SECRET=your-secret-key
```

**Default Values:**

- `FHIR_BASE_URL`: `http://localhost:8080/fhir` (if not set)

### FHIR Server Requirements

Ensure the local FHIR server is running and accessible at the configured `FHIR_BASE_URL`.

---

## Usage Examples

### Node.js/TypeScript Example

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = 'your-jwt-token';

// Onboard a patient
async function onboardPatient() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/patient/onboard`,
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        email: 'john.doe@example.com',
        phone: '1234567890',
        address: {
          street: '123 Main Street',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Patient onboarded:', response.data.patient);
  } catch (error) {
    console.error('Error onboarding patient:', error.response?.data);
  }
}

// Get patient by ID
async function getPatient(id: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/patient/${id}`, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });

    console.log('Patient:', response.data.patient);
  } catch (error) {
    console.error('Error fetching patient:', error.response?.data);
  }
}

// Search patients
async function searchPatients(name?: string) {
  try {
    const params = name ? { name } : {};
    const response = await axios.get(`${API_BASE_URL}/patient`, {
      params,
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });

    console.log('Patients:', response.data.patients);
  } catch (error) {
    console.error('Error searching patients:', error.response?.data);
  }
}
```

### Python Example

```python
import requests

API_BASE_URL = 'http://localhost:3000'
JWT_TOKEN = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Onboard a patient
def onboard_patient():
    data = {
        'firstName': 'John',
        'lastName': 'Doe',
        'dateOfBirth': '1990-01-15',
        'gender': 'male',
        'email': 'john.doe@example.com',
        'phone': '1234567890'
    }

    response = requests.post(
        f'{API_BASE_URL}/patient/onboard',
        json=data,
        headers=headers
    )

    if response.status_code == 201:
        print('Patient onboarded:', response.json()['patient'])
    else:
        print('Error:', response.json())

# Get patient by ID
def get_patient(patient_id):
    response = requests.get(
        f'{API_BASE_URL}/patient/{patient_id}',
        headers=headers
    )

    if response.status_code == 200:
        print('Patient:', response.json()['patient'])
    else:
        print('Error:', response.json())
```

---

## Type Safety

The implementation uses FHIR R4 types from `fhir/r4` for type safety:

- `Patient`: FHIR Patient resource type
- `HumanName`: Patient name structure
- `ContactPoint`: Telecom information
- `Address`: Address structure
- `Identifier`: Patient identifiers

All conversions are type-checked at compile time, ensuring compatibility with FHIR standards.

---

## Best Practices

1. **Always validate input data** before sending to the API
2. **Handle errors gracefully** - check response status codes
3. **Store JWT tokens securely** - never expose in client-side code
4. **Use HTTPS in production** - protect sensitive patient data
5. **Log all patient operations** - maintain audit trail
6. **Implement retry logic** - handle transient FHIR server errors
7. **Validate FHIR responses** - ensure data integrity

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT token is valid and not expired
   - Verify token is included in Authorization header

2. **403 Forbidden**
   - Ensure user has `DATA_SCIENTIST` role
   - Verify RolesGuard is properly configured

3. **400 Bad Request - Validation Failed**
   - Check all required fields are provided
   - Verify date format is YYYY-MM-DD
   - Ensure email format is valid

4. **FHIR Server Connection Error**
   - Verify FHIR server is running
   - Check `FHIR_BASE_URL` configuration
   - Test FHIR server endpoint directly

5. **Resource Not Found**
   - Verify patient ID exists in FHIR store
   - Check ID format matches FHIR server expectations

---

## Related Documentation

- [FHIR R4 Specification](https://www.hl7.org/fhir/R4/patient.html)
- [Architecture Documentation](../ARCHITECTURE.md)

---

## Support

For issues or questions:

1. Check the logs: `logs/app.log` and `logs/error.log`
2. Review FHIR server logs
3. Verify environment configuration
4. Check API Swagger documentation at `/api` endpoint
