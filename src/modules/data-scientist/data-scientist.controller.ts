import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Data Scientist')
@ApiBearerAuth()
@Controller('data-scientist')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataScientistController {
  @Get('fhir-data')
  @Roles(Role.DATA_SCIENTIST)
  @ApiOperation({
    summary: 'Get all patient FHIR data',
    description: 'Retrieves FHIR-compliant patient data. Requires DATA_SCIENTIST role.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved patient FHIR data',
    schema: {
      example: {
        patients: [
          {
            resourceType: 'Patient',
            id: '1',
            name: [
              {
                use: 'official',
                family: 'Michael',
                given: ['Scofield'],
              },
            ],
            gender: 'male',
            birthDate: '1985-03-15',
            address: [
              {
                use: 'home',
                line: ['123 Main Street'],
                city: 'Metropolis',
                state: 'NY',
                postalCode: '10001',
                country: 'USA',
              },
            ],
            identifier: [
              {
                use: 'usual',
                type: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                      code: 'MR',
                    },
                  ],
                  text: 'Medical Record Number',
                },
                system: 'http://hospital.smarthealthit.org',
                value: 'MRN12345',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have DATA_SCIENTIST role',
  })
  getAllPatientFhirData() {
    return {
      patients: [
        {
          resourceType: 'Patient',
          id: '1',
          name: [
            {
              use: 'official',
              family: 'Michael',
              given: ['Scofield'],
            },
          ],
          gender: 'male',
          birthDate: '1985-03-15',
          address: [
            {
              use: 'home',
              line: ['123 Main Street'],
              city: 'Metropolis',
              state: 'NY',
              postalCode: '10001',
              country: 'USA',
            },
          ],
          identifier: [
            {
              use: 'usual',
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    code: 'MR',
                  },
                ],
                text: 'Medical Record Number',
              },
              system: 'http://hospital.smarthealthit.org',
              value: 'MRN12345',
            },
          ],
        },
        {
          resourceType: 'Patient',
          id: '2',
          name: [
            {
              use: 'official',
              family: 'Lincoln',
              given: ['Burrows'],
            },
          ],
          gender: 'male',
          birthDate: '1992-08-30',
          address: [
            {
              use: 'home',
              line: ['456 Oak Avenue'],
              city: 'Gotham',
              state: 'CA',
              postalCode: '94107',
              country: 'USA',
            },
          ],
          identifier: [
            {
              use: 'usual',
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    code: 'MR',
                  },
                ],
                text: 'Medical Record Number',
              },
              system: 'http://hospital.smarthealthit.org',
              value: 'MRN67890',
            },
          ],
        },
      ],
    };
  }
}
