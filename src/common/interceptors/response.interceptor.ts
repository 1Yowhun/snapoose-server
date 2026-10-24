import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../dto/apiResponse.dto.js';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/metadata.decorator.js';
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, ctx.getHandler()) ??
      'Request completed successfully';
    const statusCode = ctx.switchToHttp().getResponse().statusCode;
    return next
      .handle()
      .pipe(map((data) => new ApiResponse(message, statusCode, data)));
  }
}
