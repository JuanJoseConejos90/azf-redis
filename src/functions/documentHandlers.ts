import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { RedisClientFactory } from '@factories/redisClientFactory.js';
import { DocumentRepository } from '@repositories/documentRepository.js';
import { ElectronicDocument } from '@models/document.js';
import { mapError } from '@utils/errorMapper.js';
import { HttpMessages } from '@utils/messages.js';

export const repo = new DocumentRepository(RedisClientFactory.getInstance());

export async function getDocumentHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const { accountId, docKey } = req.params;
  if (!accountId || !docKey) {
    return { status: 400, jsonBody: { error: HttpMessages.MISSING_PARAMS_GET } };
  }
  try {
    const document = await repo.findByKey(accountId, docKey);
    return { status: 200, jsonBody: document };
  } catch (err) {
    return mapError(err);
  }
}

export async function upsertDocumentHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const payload = (await req.json()) as Partial<ElectronicDocument>;
    if (!payload?.accountId || !payload?.docKey || !payload?.totalAmount) {
      return { status: 400, jsonBody: { error: HttpMessages.MISSING_FIELDS_UPSERT } };
    }
    await repo.save(payload as ElectronicDocument);
    return { status: 201, jsonBody: { message: HttpMessages.DOCUMENT_SAVED } };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteDocumentHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const { accountId, docKey } = req.params;
  if (!accountId || !docKey) {
    return { status: 400, jsonBody: { error: HttpMessages.MISSING_PARAMS_DELETE } };
  }
  try {
    await repo.delete(accountId, docKey);
    return { status: 200, jsonBody: { message: HttpMessages.DOCUMENT_DELETED } };
  } catch (err) {
    return mapError(err);
  }
}
