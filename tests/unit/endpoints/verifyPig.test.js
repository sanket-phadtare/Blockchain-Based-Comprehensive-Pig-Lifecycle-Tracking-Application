const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/verify/pig', () => {
  it('should verify pig data successfully', async () => {
    const qrCode = Buffer.from('1').toString('base64'); // Mock QR code

    const response = await request(app)
      .post('/api/verify/pig')
      .send({ p_qr_code: qrCode })
      .expect(200);

    expect(response.body.message).toBe('Pig Data is Authentic');
    expect(response.body.status).toBe('Verified');
  });

  it('should return 404 for invalid QR code', async () => {
    const invalidQrCode = Buffer.from('invalid').toString('base64');

    const response = await request(app)
      .post('/api/verify/pig')
      .send({ p_qr_code: invalidQrCode })
      .expect(404);

    expect(response.body.message).toBe('Product not found');
  });
});