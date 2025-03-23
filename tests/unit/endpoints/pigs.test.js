const request = require('supertest');
const app = require('../../../server'); // Correct path

describe('POST /api/pigs', () => {
  it('should add pig data successfully', async () => {
    const pigData = [
      {
        pigId: 1,
        birthDate: '2023-01-01',
        soldAt: '2023-10-01',
        breed: 'Yorkshire',
        geneticLineage: 'ABC123',
        birthWeight: 1.5,
        earTag: 'ET123',
        sex: 'Male',
        status: 'Healthy',
        farmId: 1,
      },
    ];

    const response = await request(app)
      .post('/api/pigs')
      .send(pigData)
      .expect(200);

    expect(response.text).toBe('Batch data added successfully');
  });

  it('should return 400 for invalid input', async () => {
    const invalidPigData = {}; // Missing required fields

    const response = await request(app)
      .post('/api/pigs')
      .send(invalidPigData)
      .expect(400);

    expect(response.text).toBe('Invalid input: Expected an array of pig details');
  });
});