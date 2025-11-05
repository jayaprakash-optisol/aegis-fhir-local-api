import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Fhir } from 'fhir';
import { Resource, Bundle } from 'fhir/r4';

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);
  private readonly fhirClient: Fhir;
  private readonly axiosInstance: AxiosInstance;
  private readonly fhirBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fhirClient = new Fhir();
    this.fhirBaseUrl = this.configService.get<string>('FHIR_BASE_URL') ?? 'http://localhost:8080/fhir';
    this.axiosInstance = axios.create({
      baseURL: this.fhirBaseUrl,
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
    });
  }

  /**
   * Validates a FHIR resource
   */
  validate<T extends Resource>(resource: T): { valid: boolean; messages: unknown[] } {
    try {
      const validationResult = this.fhirClient.validate(resource);
      return validationResult;
    } catch (error) {
      this.logger.error('FHIR validation error', error);
      throw new BadRequestException('Invalid FHIR resource structure');
    }
  }

  /**
   * Creates a FHIR resource
   */
  async create<T extends Resource>(resource: T): Promise<T> {
    try {
      // Validate before creating
      const validationResult = this.validate(resource);
      if (!validationResult.valid) {
        this.logger.error('FHIR validation failed', validationResult.messages);
        throw new BadRequestException({
          message: 'FHIR resource validation failed',
          errors: validationResult.messages,
        });
      }

      const response = await this.axiosInstance.post<T>(`/${resource.resourceType}`, resource);
      this.logger.log(`Successfully created ${resource.resourceType} with id: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error creating ${resource.resourceType}`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(error.response?.data || `Failed to create ${resource.resourceType}`);
      }
      throw error;
    }
  }

  /**
   * Reads a FHIR resource by ID
   */
  async read<T extends Resource>(resourceType: string, id: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(`/${resourceType}/${id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error reading ${resourceType} with id ${id}`, error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new BadRequestException(`${resourceType} with id ${id} not found`);
        }
        throw new BadRequestException(error.response?.data || `Failed to read ${resourceType}`);
      }
      throw error;
    }
  }

  /**
   * Updates a FHIR resource
   */
  async update<T extends Resource>(resource: T, id: string): Promise<T> {
    try {
      const resourceWithId = { ...resource, id };
      const validationResult = this.validate(resourceWithId);
      if (!validationResult.valid) {
        this.logger.error('FHIR validation failed', validationResult.messages);
        throw new BadRequestException({
          message: 'FHIR resource validation failed',
          errors: validationResult.messages,
        });
      }

      const response = await this.axiosInstance.put<T>(`/${resource.resourceType}/${id}`, resourceWithId);
      this.logger.log(`Successfully updated ${resource.resourceType} with id: ${id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating ${resource.resourceType} with id ${id}`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(error.response?.data || `Failed to update ${resource.resourceType}`);
      }
      throw error;
    }
  }

  /**
   * Deletes a FHIR resource
   */
  async delete(resourceType: string, id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/${resourceType}/${id}`);
      this.logger.log(`Successfully deleted ${resourceType} with id: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting ${resourceType} with id ${id}`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(error.response?.data || `Failed to delete ${resourceType}`);
      }
      throw error;
    }
  }

  /**
   * Searches for FHIR resources
   */
  async search<T extends Resource>(resourceType: string, params?: Record<string, string>): Promise<Bundle<T>> {
    try {
      const response = await this.axiosInstance.get<Bundle<T>>(`/${resourceType}`, { params });
      return response.data;
    } catch (error) {
      this.logger.error(`Error searching ${resourceType}`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(error.response?.data || `Failed to search ${resourceType}`);
      }
      throw error;
    }
  }
}
