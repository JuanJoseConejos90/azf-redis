import { app } from '@azure/functions';
import './functions/documentCrud.js';

app.setup({
  enableHttpStream: true,
});
