import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Custom ValidationPipe that skips validation for webhook endpoints
 * Webhooks from Paymongo have their own structure and shouldn't be validated
 */
@Injectable()
export class WebhookValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Skip validation for webhook endpoints - return body as-is
    // This is safe because webhook signature verification happens in the controller
    return value;
  }
}

