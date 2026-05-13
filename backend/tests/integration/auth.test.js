import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { pool } from '../../db.js';
import bcrypt from 'bcryptjs';

vi.mock('../../db.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        pool: {
            query: vi.fn()
        }
    }
});

describe('Auth API', () => {
  it('debe registrar un usuario correctamente', async () => {
    pool.query.mockResolvedValueOnce([[]]); 
    pool.query.mockResolvedValueOnce([[]]); 
    pool.query.mockResolvedValueOnce([{ insertId: 1 }]); 

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual('test@test.com');
  });

  it('no debe registrar con email existente', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); 

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Test2', email: 'existente@test.com', password: 'password123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toMatch(/correo ya está registrado/);
  });
});
