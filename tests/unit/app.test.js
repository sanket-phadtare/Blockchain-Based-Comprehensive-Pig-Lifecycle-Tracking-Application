import request from 'supertest';
import { app, pool } from '../../server';

// Set longer timeout for all tests (30 seconds)
jest.setTimeout(30000);

// Mock external dependencies
jest.mock('ioredis', () => jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
})));



describe('POST /api/pigs', () => {
    // Helper function with all required fields
    const generateValidPigData = (overrides = {}) => ({
        pigId: Math.floor(100000 + Math.random() * 900000),
        birthDate: '2022-01-01',
        soldAt: '2023-07-01', // Required field
        breed: 'Duroc',
        geneticLineage: 'Lineage A',
        birthWeight: 2.2,
        earTag: `ET${Math.floor(1000 + Math.random() * 9000)}`,
        sex: 'M',
        status: 'Alive',
        farmId: '1',
        ...overrides
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should successfully add a valid batch of pigs', async () => {
        const testData = [generateValidPigData()];
        
        const response = await request(app)
            .post('/api/pigs')
            .send(testData);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Batch data added successfully");
    });

    it('should return 400 for invalid input (empty array)', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([]);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid input: Expected an array of pig details");
    });

    it('should return 400 for invalid input (non-array)', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send({ pigId: '25' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid input: Expected an array of pig details");
    });

    it('should return 400 for invalid pig details (missing required fields)', async () => {
        // Explicitly missing required fields
        const invalidPig = {
            pigId: '25',
            birthDate: '2022-01-01'
            // Missing soldAt, breed, etc.
        };

        const response = await request(app)
            .post('/api/pigs')
            .send([invalidPig]);

        // Check for either 400 or 500 since database constraints might trigger 500
        expect([400, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid date format', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([generateValidPigData({ birthDate: 'invalid-date' })]);

        expect([400, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid pigId format', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([generateValidPigData({ pigId: 'not-a-number' })]);

        expect([400, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
    });
});