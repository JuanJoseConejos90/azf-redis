export const enum HttpMessages {
  // Success
  DOCUMENT_SAVED    = 'Comprobante guardado exitosamente.',
  DOCUMENT_DELETED  = 'Comprobante eliminado con éxito.',

  // 400
  MISSING_PARAMS_GET    = 'Faltan parámetros: accountId y docKey son obligatorios.',
  MISSING_PARAMS_DELETE = 'Faltan parámetros de ruta: accountId y docKey son obligatorios.',
  MISSING_FIELDS_UPSERT = 'Datos incompletos: accountId, docKey y totalAmount son obligatorios.',
  INVALID_JSON          = 'El cuerpo de la solicitud no es un JSON válido.',

  // 500
  INTERNAL_ERROR = 'Error interno del servidor.',
}

export const enum LogMessages {
  HANDLER_ERROR        = '[Handler Error]:',
  REDIS_CONNECT_ERROR  = '[Redis Connection Error]:',
}
