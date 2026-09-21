import { AppLogger } from '../logger.service.js';

export function logError(
  logger: AppLogger,
  message: string,
  error: unknown,
  context: string,
): void {
  if (error instanceof Error) {
    logger.error(message, error.stack, context);
  } else {
    logger.error(`${message}: ${String(error)}`, undefined, context);
  }
}
