import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const appLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp }: { level: string; message: string; timestamp: string }) => {
            return `[${timestamp}] ${level}: ${message}`;
          },
        ),
      ),
    }),

    // File Transport for info logs
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),

    // File Transport for error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});
