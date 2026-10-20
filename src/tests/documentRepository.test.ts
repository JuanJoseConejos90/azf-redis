import { DocumentRepository } from '@repositories/documentRepository';
import { NotFoundError, DeserializationError, ElectronicDocument } from '@models/document';

const mockDoc: ElectronicDocument = {
  accountId: 'tenant-01',
  docKey: 'INV-2024-001',
  documentType: 'INVOICE',
  issueDate: '2024-01-15',
  customerTaxId: '20123456789',
  totalAmount: 1500.00,
  currency: 'PEN',
  status: 'ISSUED',
  payload: { xml: '<Invoice/>' },
};

function makeRedisSpy(overrides: Record<string, jest.Mock> = {}) {
  return {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('DocumentRepository', () => {
  describe('save', () => {
    it('calls redis.set with serialized document', async () => {
      const redis = makeRedisSpy();
      const repo = new DocumentRepository(redis as never);
      await repo.save(mockDoc);
      expect(redis.set).toHaveBeenCalledTimes(1);
      const [key, value] = redis.set.mock.calls[0] as [string, string];
      expect(key).toBe('doc:tenant-01:INV-2024-001');
      const parsed = JSON.parse(value);
      expect(parsed.accountId).toBe('tenant-01');
      expect(parsed.createdAt).toBeDefined();
      expect(parsed.updatedAt).toBeDefined();
    });

    it('preserves existing createdAt on update', async () => {
      const redis = makeRedisSpy();
      const repo = new DocumentRepository(redis as never);
      await repo.save({ ...mockDoc, createdAt: '2024-01-01T00:00:00.000Z', totalAmount: 2000 });
      const [, value] = redis.set.mock.calls[0] as [string, string];
      const parsed = JSON.parse(value);
      expect(parsed.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed.totalAmount).toBe(2000);
    });

    it('calls redis.set with EX when TTL is configured', async () => {
      process.env.REDIS_TTL_SECONDS = '3600';
      const redis = makeRedisSpy();
      const repo = new DocumentRepository(redis as never);
      await repo.save(mockDoc);
      expect(redis.set).toHaveBeenCalledWith('doc:tenant-01:INV-2024-001', expect.any(String), 'EX', 3600);
      delete process.env.REDIS_TTL_SECONDS;
    });

    it('calls redis.set without EX when TTL is 0', async () => {
      const redis = makeRedisSpy();
      const repo = new DocumentRepository(redis as never);
      await repo.save(mockDoc);
      expect(redis.set).toHaveBeenCalledWith('doc:tenant-01:INV-2024-001', expect.any(String));
    });
  });

  describe('findByKey', () => {
    it('returns the document when key exists', async () => {
      const redis = makeRedisSpy({ get: jest.fn().mockResolvedValue(JSON.stringify(mockDoc)) });
      const repo = new DocumentRepository(redis as never);
      const result = await repo.findByKey('tenant-01', 'INV-2024-001');
      expect(result.accountId).toBe('tenant-01');
      expect(result.documentType).toBe('INVOICE');
    });

    it('throws NotFoundError when key does not exist', async () => {
      const redis = makeRedisSpy({ get: jest.fn().mockResolvedValue(null) });
      const repo = new DocumentRepository(redis as never);
      await expect(repo.findByKey('tenant-01', 'MISSING')).rejects.toThrow(NotFoundError);
    });

    it('throws DeserializationError on corrupted JSON', async () => {
      const redis = makeRedisSpy({ get: jest.fn().mockResolvedValue('not-valid-json') });
      const repo = new DocumentRepository(redis as never);
      await expect(repo.findByKey('tenant-01', 'CORRUPT')).rejects.toThrow(DeserializationError);
    });
  });

  describe('delete', () => {
    it('resolves when key is deleted successfully', async () => {
      const redis = makeRedisSpy({ del: jest.fn().mockResolvedValue(1) });
      const repo = new DocumentRepository(redis as never);
      await expect(repo.delete('tenant-01', 'INV-2024-001')).resolves.toBeUndefined();
      expect(redis.del).toHaveBeenCalledWith('doc:tenant-01:INV-2024-001');
    });

    it('throws NotFoundError when key does not exist', async () => {
      const redis = makeRedisSpy({ del: jest.fn().mockResolvedValue(0) });
      const repo = new DocumentRepository(redis as never);
      await expect(repo.delete('tenant-01', 'GHOST')).rejects.toThrow(NotFoundError);
    });
  });
});
