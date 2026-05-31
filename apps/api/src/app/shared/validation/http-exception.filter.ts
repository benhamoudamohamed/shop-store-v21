import { Catch, HttpException, InternalServerErrorException, Logger, ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { ZodSerializationException } from "nestjs-zod";
import { ZodError } from "zod";

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof ZodSerializationException) {
            const zodError = exception.getZodError();
            if (zodError instanceof ZodError) {
                this.logger.error(`ZodSerializationException: ${zodError.message}`);
            }
        }

        if (exception instanceof HttpException) {
            super.catch(exception, host);
            return;
        }

        this.logger.error('Unhandled exception caught by global filter', exception as Error);
        super.catch(new InternalServerErrorException(), host);
    }
}