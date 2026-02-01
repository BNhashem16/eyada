import {
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

export interface BilingualMessage {
  en: string;
  ar: string;
}

export class BilingualHttpException extends HttpException {
  constructor(
    message: BilingualMessage,
    status: HttpStatus,
    errorCode?: string,
  ) {
    super(
      {
        message,
        error: errorCode || HttpStatus[status],
        statusCode: status,
      },
      status,
    );
  }
}

export class BilingualBadRequestException extends HttpException {
  constructor(message: BilingualMessage, errorCode?: string) {
    super(
      {
        message,
        error: errorCode || 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BilingualUnauthorizedException extends HttpException {
  constructor(message: BilingualMessage, errorCode?: string) {
    super(
      {
        message,
        error: errorCode || 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class BilingualForbiddenException extends HttpException {
  constructor(message: BilingualMessage, errorCode?: string) {
    super(
      {
        message,
        error: errorCode || 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class BilingualNotFoundException extends HttpException {
  constructor(message: BilingualMessage, errorCode?: string) {
    super(
      {
        message,
        error: errorCode || 'Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class BilingualConflictException extends HttpException {
  constructor(message: BilingualMessage, errorCode?: string) {
    super(
      {
        message,
        error: errorCode || 'Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}
