import { HttpResponseInit } from '@azure/functions';
import { NotFoundError, DeserializationError } from '@models/document.js';
import { HttpMessages, LogMessages } from '@utils/messages.js';

export function mapError(err: unknown): HttpResponseInit {
  if (err instanceof NotFoundError) {
    return { status: 404, jsonBody: { error: err.message } };
  }
  if (err instanceof DeserializationError) {
    return { status: 422, jsonBody: { error: err.message } };
  }
  if (err instanceof SyntaxError) {
    return { status: 400, jsonBody: { error: HttpMessages.INVALID_JSON } };
  }
  const message = err instanceof Error ? err.message : HttpMessages.INTERNAL_ERROR;
  console.error(LogMessages.HANDLER_ERROR, message);
  return { status: 500, jsonBody: { error: HttpMessages.INTERNAL_ERROR } };
}
