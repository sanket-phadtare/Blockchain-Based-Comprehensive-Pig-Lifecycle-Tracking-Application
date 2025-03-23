import request from 'supertest';
import { app, pool } from '../../server'; 

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
        return {
            get: jest.fn(),
            set: jest.fn(),
        };
    });
});

describe('POST /api/pigs', () => {
    afterAll(async () => {
        await pool.end(); 
    });

    it('should successfully add a valid batch of pigs', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([
                {
                    pigId: 'PIG23',
                    birthDate: '2022-01-01',
                    soldAt: '2023-07-01',
                    breed: 'Duroc',
                    geneticLineage: 'Lineage A',
                    birthWeight: 25,
                    earTag: 'ET123',
                    sex: 'M',
                    status: 'Alive',
                    farmId: '1',
                },
            ]);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Batch data added successfully");
    });

    it('should return 400 for invalid input (empty array)', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([]);

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid input: Expected an array of pig details");
    });

    it('should return 400 for invalid input (non-array)', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send({ pigId: '23' }); 

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid input: Expected an array of pig details");
    });

    it('should return 400 for invalid pig details (missing required fields)', async () => {
        const response = await request(app)
            .post('/api/pigs')
            .send([
                {
                    pigId: '23',
                    birthDate: '2022-01-01',
                    
                },
            ]);

        expect(response.status).toBe(400); 
      
    });

  
});