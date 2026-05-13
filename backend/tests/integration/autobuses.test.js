import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { pool } from '../../db.js';

vi.mock('../../db.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        pool: {
            query: vi.fn()
        }
    }
});

describe('Autobuses API', () => {
  it('debe obtener la lista de autobuses', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, matricula: '1234ABC' }]]);

    const res = await request(app).get('/api/autobuses');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].matricula).toBe('1234ABC');
  });

  it('debe crear un nuevo autobus', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 2 }]);

    const res = await request(app)
      .post('/api/autobuses')
      .send({ matricula: '9999XYZ', modelo: 'Volvo', capacidad: 50 });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Autobús registrado con éxito');
  });
});
