import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExceptionHelperService {
  private readonly logger = new Logger('⚙️ ExceptionHelperService ⚙️');

  handleError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    this.logger.error('Unhandled service exception', error as Error);
    throw new HttpException(
      { status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  createHttpError(status: HttpStatus, message: string | Record<string, unknown>): HttpException {
    return new HttpException(
      typeof message === 'string'
        ? { status, error: message }
        : { ...message, status },
      status,
    );
  }
}
