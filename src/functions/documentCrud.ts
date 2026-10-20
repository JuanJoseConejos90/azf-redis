import { app } from '@azure/functions';
import {
  getDocumentHandler,
  upsertDocumentHandler,
  deleteDocumentHandler,
} from './documentHandlers.js';

app.http('getDocument', {
  methods: ['GET'],
  route: 'documents/{accountId}/{docKey}',
  authLevel: 'function',
  handler: getDocumentHandler,
});

app.http('upsertDocument', {
  methods: ['POST', 'PUT'],
  route: 'documents',
  authLevel: 'function',
  handler: upsertDocumentHandler,
});

app.http('deleteDocument', {
  methods: ['DELETE'],
  route: 'documents/{accountId}/{docKey}',
  authLevel: 'function',
  handler: deleteDocumentHandler,
});
