import winston from 'winston';
import LokiTransport from 'winston-loki';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { 
    service: 'light-server',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    })
  ]
});

// Add Loki transport if configured
if (process.env.LOKI_HOST) {
  const lokiTransport = new LokiTransport({
    host: process.env.LOKI_HOST,
    labels: { 
      app: 'light-server',
      environment: process.env.NODE_ENV || 'development'
    },
    json: true,
    format: json(),
    replaceTimestamp: true,
    onConnectionError: (err) => console.error('Loki connection error:', err)
  });

  logger.add(lokiTransport);
  logger.info('Loki transport configured', { host: process.env.LOKI_HOST });
}

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

export default logger;
