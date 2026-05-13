import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Health Endpoint', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});
