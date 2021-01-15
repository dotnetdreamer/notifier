import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
// import { config } from '../config';
import * as path from 'path';

export class AppLogger implements LoggerService {
  private logger: winston.Logger;
  constructor(label?: string) {
    this.initializeLogger(label);
  }
  initializeLogger(label?: string) {
    this.logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
            new winston.transports.File({ dirname: path.join(__dirname, './_logs/debug/'), filename: 'debug.log', level: 'debug' }),
            new winston.transports.File({ dirname: path.join(__dirname, './_logs/error/'), filename: 'error.log', level: 'error' }),
            new winston.transports.File({ dirname: path.join(__dirname, './_logs/info/'), filename: 'info.log', level: 'info' })
        ],
    });
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      );
    }
  }

  error(message: string, trace: string) {
    this.logger.log("error", "AppLogger error - " + message);
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.log("warn", "AppLogger warn - " + message);
    //this.logger.warn('warn', message);
  }

  log(message: string) {
    this.logger.log("info", "AppLogger info - " + message);
    // this.logger.log('info', message);
  }
}