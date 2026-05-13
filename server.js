
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await import(pathToFileURL(join(__dirname, 'backend', 'server.js')).href);
