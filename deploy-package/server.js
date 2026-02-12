// Root server.js - Entry point for deployment
// This file exists to satisfy deployment environments that expect server.js in the root
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the actual backend server
await import(join(__dirname, 'backend', 'server.js'));
