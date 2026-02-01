import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

type Language = 'en' | 'ar';

interface BilingualMessage {
  en: string;
  ar: string;
}

function isBilingualMessage(obj: unknown): obj is BilingualMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'en' in obj &&
    'ar' in obj &&
    typeof (obj as BilingualMessage).en === 'string' &&
    typeof (obj as BilingualMessage).ar === 'string'
  );
}

function getLanguageFromRequest(request: Request): Language {
  // Check custom header first (x-lang or x-language)
  const customLang = request.headers['x-lang'] || request.headers['x-language'];
  if (customLang === 'ar' || customLang === 'en') {
    return customLang;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers['accept-language'];
  if (acceptLanguage) {
    if (acceptLanguage.toLowerCase().startsWith('ar')) {
      return 'ar';
    }
  }

  // Default to English
  return 'en';
}

function extractMessage(message: unknown, lang: Language): string {
  if (isBilingualMessage(message)) {
    return message[lang];
  }
  if (typeof message === 'string') {
    // Try to parse as JSON (for validation messages)
    try {
      const parsed = JSON.parse(message);
      if (isBilingualMessage(parsed)) {
        return parsed[lang];
      }
    } catch {
      // Not JSON, return as is
    }
    return message;
  }
  return String(message);
}

function processMessages(messages: unknown, lang: Language): string[] {
  if (Array.isArray(messages)) {
    return messages.map((msg) => extractMessage(msg, lang));
  }
  return [extractMessage(messages, lang)];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = getLanguageFromRequest(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string[] = ['Internal server error'];
    let error = 'Internal Server Error';
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = processMessages(responseObj.message || exception.message, lang);
        error = String(responseObj.error || 'Error');
        errorCode = responseObj.errorCode as string | undefined;
      } else {
        message = processMessages(exception.message, lang);
      }
    } else if (exception instanceof Error) {
      message = [exception.message];
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    if (errorCode) {
      errorResponse.errorCode = errorCode;
    }

    response.status(status).json(errorResponse);
  }
}
