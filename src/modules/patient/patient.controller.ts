import { Controller, Post, Get, Body, Param, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateMedicationStatementDto } from './dto/create-medication-statement.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { PatientWithHistoryResponseDto } from './dto/patient-with-history-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import type { MedicationStatement } from 'fhir/r4';

@ApiTags('Patient')
@ApiBearerAuth()
@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('onboard')
  @Roles(Role.DATA_SCIENTIST)
  @ApiOperation({
    summary: 'Onboard a new patient',
    description:
      'Converts incoming patient data to FHIR format and stores it in the FHIR store. Requires authentication.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Patient successfully onboarded and stored in FHIR store',
    type: PatientResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async onboardPatient(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.patientService.createPatient(createPatientDto);
    return { patient };
  }

  @Get()
  @ApiOperation({
    summary: 'Search patients',
    description: 'Searches for patients in the FHIR store. Requires authentication.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Search by patient name',
    example: 'John',
  })
  @ApiQuery({
    name: 'birthdate',
    required: false,
    description: 'Search by birth date',
    example: '1990-01-15',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patients successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async searchPatients(@Query() query: Record<string, string>) {
    const patients = await this.patientService.searchPatients(query);
    return { patients };
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get patient with complete history',
    description:
      'Retrieves a patient along with all related resources including medications, allergies, conditions, and observations. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'FHIR Patient resource ID',
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient with complete history successfully retrieved',
    type: PatientWithHistoryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getPatientWithHistory(@Param('id') id: string): Promise<PatientWithHistoryResponseDto> {
    const result = await this.patientService.getPatientWithHistory(id);
    return result;
  }

  @Post(':id/medication')
  @Roles(Role.DATA_SCIENTIST)
  @ApiOperation({
    summary: 'Add medication statement for a patient',
    description:
      'Creates a MedicationStatement resource for a patient. Example: "Patient John Doe, takes 1 Tablet every 6 hours as needed for the pain". Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'FHIR Patient resource ID',
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'MedicationStatement successfully created',
    schema: {
      type: 'object',
      properties: {
        medicationStatement: {
          type: 'object',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async addMedicationStatement(
    @Param('id') id: string,
    @Body() createMedicationDto: CreateMedicationStatementDto,
  ): Promise<{ medicationStatement: MedicationStatement }> {
    // Override patientId from path parameter
    createMedicationDto.patientId = id;
    const medicationStatement = await this.patientService.createMedicationStatement(createMedicationDto);
    return { medicationStatement };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get patient by ID',
    description: 'Retrieves a patient from the FHIR store by ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'FHIR Patient resource ID',
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient successfully retrieved',
    type: PatientResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getPatient(@Param('id') id: string): Promise<PatientResponseDto> {
    const patient = await this.patientService.getPatientById(id);
    return { patient };
  }
}
