import { Module } from '@nestjs/common';
import { DataScientistController } from './data-scientist.controller';

@Module({
  controllers: [DataScientistController],
})
export class DataScientistModule {}

