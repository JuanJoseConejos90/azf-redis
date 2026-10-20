export interface ElectronicDocument {
  accountId: string;
  docKey: string;
  documentType: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  issueDate: string;
  customerTaxId: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  payload: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export class NotFoundError extends Error {
  constructor(key: string) {
    super(`Comprobante no encontrado: ${key}`);
    this.name = 'NotFoundError';
  }
}

export class DeserializationError extends Error {
  constructor(key: string) {
    super(`Error al deserializar el comprobante: ${key}`);
    this.name = 'DeserializationError';
  }
}
