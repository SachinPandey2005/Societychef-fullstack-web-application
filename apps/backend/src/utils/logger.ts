import { createLogger, format, transports } from 'winston';
import { traceStorage } from '../telemetry/telemetry.provider';

const traceIdFormat = format((info) => {
  const traceId = traceStorage.getStore();
  if (traceId) {
    info.traceId = traceId;
  }
  return info;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    traceIdFormat(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'backend' },
  transports: [
    new transports.Console({
      format: format.simple(),
    }),
  ],
});
