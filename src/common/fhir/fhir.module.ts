import { Module, Global } from '@nestjs/common';
import { FhirService } from './fhir.service';

@Global()
@Module({
  providers: [FhirService],
  exports: [FhirService],
})
export class FhirModule {}

