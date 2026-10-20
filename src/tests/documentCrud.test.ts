import type { HttpRequest, InvocationContext } from '@azure/functions';
import { NotFoundError, DeserializationError, ElectronicDocument } from '@models/document';

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => jest.restoreAllMocks());

jest.mock('@factories/redisClientFactory', () => ({
  RedisClientFactory: { getInstance: jest.fn(() => ({})) },
}));

const mockSave = jest.fn();
const mockFindByKey = jest.fn();
const mockDelete = jest.fn();

jest.mock('@repositories/documentRepository', () => ({
  DocumentRepository: jest.fn().mockImplementation(() => ({
    save: mockSave,
    findByKey: mockFindByKey,
    delete: mockDelete,
  })),
}));

import {
  getDocumentHandler,
  upsertDocumentHandler,
  deleteDocumentHandler,
} from '@functions/documentHandlers';

const ctx = {} as InvocationContext;

function makeGetReq(params: Record<string, string>): HttpRequest {
  return { params } as unknown as HttpRequest;
}

function makeBodyReq(body: unknown): HttpRequest {
  return { params: {}, json: jest.fn().mockResolvedValue(body) } as unknown as HttpRequest;
}

const mockDoc: ElectronicDocument = {
  accountId: 'tenant-01',
  docKey: 'INV-001',
  documentType: 'INVOICE',
  issueDate: '2024-01-15',
  customerTaxId: '20123456789',
  totalAmount: 1500,
  currency: 'PEN',
  status: 'ISSUED',
  payload: {},
};

describe('getDocumentHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when params are missing', async () => {
    const res = await getDocumentHandler(makeGetReq({}), ctx);
    expect(res.status).toBe(400);
  });

  it('returns 200 with document when found', async () => {
    mockFindByKey.mockResolvedValue(mockDoc);
    const res = await getDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual(mockDoc);
  });

  it('returns 404 on NotFoundError', async () => {
    mockFindByKey.mockRejectedValue(new NotFoundError('doc:tenant-01:INV-001'));
    const res = await getDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 422 on DeserializationError', async () => {
    mockFindByKey.mockRejectedValue(new DeserializationError('doc:tenant-01:INV-001'));
    const res = await getDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(422);
  });

  it('returns 500 on unexpected error', async () => {
    mockFindByKey.mockRejectedValue(new Error('Redis timeout'));
    const res = await getDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith('[Handler Error]:', 'Redis timeout');
  });
});

describe('upsertDocumentHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const res = await upsertDocumentHandler(makeBodyReq({ accountId: 'tenant-01' }), ctx);
    expect(res.status).toBe(400);
  });

  it('returns 201 on successful save', async () => {
    mockSave.mockResolvedValue(undefined);
    const res = await upsertDocumentHandler(makeBodyReq(mockDoc), ctx);
    expect(res.status).toBe(201);
    expect(mockSave).toHaveBeenCalledWith(mockDoc);
  });

  it('returns 400 on invalid JSON body', async () => {
    const req = {
      params: {},
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as HttpRequest;
    const res = await upsertDocumentHandler(req, ctx);
    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected save error', async () => {
    mockSave.mockRejectedValue(new Error('Connection lost'));
    const res = await upsertDocumentHandler(makeBodyReq(mockDoc), ctx);
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith('[Handler Error]:', 'Connection lost');
  });
});

describe('deleteDocumentHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when params are missing', async () => {
    const res = await deleteDocumentHandler(makeGetReq({}), ctx);
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful delete', async () => {
    mockDelete.mockResolvedValue(undefined);
    const res = await deleteDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(200);
  });

  it('returns 404 when document does not exist', async () => {
    mockDelete.mockRejectedValue(new NotFoundError('doc:tenant-01:INV-001'));
    const res = await deleteDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 500 on unexpected delete error', async () => {
    mockDelete.mockRejectedValue(new Error('Redis unavailable'));
    const res = await deleteDocumentHandler(makeGetReq({ accountId: 'tenant-01', docKey: 'INV-001' }), ctx);
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith('[Handler Error]:', 'Redis unavailable');
  });
});
