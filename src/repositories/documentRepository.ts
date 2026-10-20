import { Redis } from 'ioredis';
import { ElectronicDocument, NotFoundError, DeserializationError } from '@models/document.js';

export class DocumentRepository {
  private readonly defaultTtl: number;

  constructor(private readonly redis: Redis) {
    this.defaultTtl = Number(process.env.REDIS_TTL_SECONDS) || 0;
  }

  private buildKey(accountId: string, docKey: string): string {
    return `doc:${accountId}:${docKey}`;
  }

  public async save(document: ElectronicDocument): Promise<void> {
    const key = this.buildKey(document.accountId, document.docKey);
    const now = new Date().toISOString();
    const docToSave = { ...document, updatedAt: now, createdAt: document.createdAt ?? now };
    const serialized = JSON.stringify(docToSave);

    if (this.defaultTtl > 0) {
      await this.redis.set(key, serialized, 'EX', this.defaultTtl);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  public async findByKey(accountId: string, docKey: string): Promise<ElectronicDocument> {
    const key = this.buildKey(accountId, docKey);
    const data = await this.redis.get(key);

    if (!data) throw new NotFoundError(key);

    try {
      return JSON.parse(data) as ElectronicDocument;
    } catch {
      throw new DeserializationError(key);
    }
  }

  public async delete(accountId: string, docKey: string): Promise<void> {
    const key = this.buildKey(accountId, docKey);
    const result = await this.redis.del(key);
    if (result === 0) throw new NotFoundError(key);
  }
}
