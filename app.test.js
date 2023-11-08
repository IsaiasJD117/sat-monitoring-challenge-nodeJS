const request = require('supertest');
const app = require('./app');

describe('Health Logic', () => {
  // Mock data for satelliteData
  const mockSatelliteData = [
    { last_updated: new Date(), altitude: 170 },
    { last_updated: new Date(), altitude: 150 },
    // Add more data points as needed
  ];

  beforeEach(() => {
    // Set the mock satellite data for testing
    app.setSatelliteData(mockSatelliteData);
  });


  it('should return "Altitude is A-OK" when altitude is above 160', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Altitude is A-OK');
  });

  it('should return "WARNING: RAPID ORBITAL DECAY IMMINENT" when altitude is below 160', async () => {
    // Modify the mock data to simulate low altitude
    mockSatelliteData[0].altitude = 150;

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("WARNING: RAPID ORBITAL DECAY IMMINENT");
  }, 10000);

  it('should return "Sustained Low Earth Orbit Resumed" after a low altitude event', async () => {
    // Modify the mock data to simulate a low altitude event followed by a recovery
    mockSatelliteData[0].altitude = 150;
    // Wait for the recovery message to be triggered
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Sustained Low Earth Orbit Resumed");
  }, 15000);
});