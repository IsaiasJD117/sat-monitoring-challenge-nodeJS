const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

let satelliteData = [];

// Fetch satellite data every 10 seconds and store it
setInterval(async () => {
  try {
    const response = await axios.get('https://api.cfast.dev/satellite');
    const data = {
      last_updated: new Date(response.data.last_updated),
      altitude: parseFloat(response.data.altitude),
    };
    satelliteData.push(data);
  } catch (error) {
    console.error('Failed to fetch satellite data:', error.message);
  }
}, 10000);

// Middleware to calculate stats for the last 5 minutes
app.use((req, res, next) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  satelliteData = satelliteData.filter((data) => data.last_updated >= fiveMinutesAgo);
  next();
});

// Endpoint to get stats
app.get('/stats', (req, res) => {
  if (satelliteData.length === 0) {
    res.status(404).json({ error: 'No data available for the last 5 minutes' });
    return;
  }

  const altitudes = satelliteData.map((data) => data.altitude);
  const minAltitude = Math.min(...altitudes);
  const maxAltitude = Math.max(...altitudes);
  const averageAltitude = altitudes.reduce((sum, altitude) => sum + altitude, 0) / altitudes.length;

  res.json({ minAltitude, maxAltitude, averageAltitude });
});

// Health logic
let healthMessage = 'Altitude is A-OK';
let lowOrbitFlag = false;

setInterval(() => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const lastMinuteData = satelliteData.filter((data) => data.last_updated >= oneMinuteAgo);
  const averageAltitude = lastMinuteData.reduce((sum, data) => sum + data.altitude, 0) / lastMinuteData.length;

  if (averageAltitude < 160) {
    healthMessage = 'WARNING: RAPID ORBITAL DECAY IMMINENT';
    lowOrbitFlag = true;
  } else if (lowOrbitFlag) {
    lowOrbitFlag = false;
    healthMessage = 'Sustained Low Earth Orbit Resumed';
  } else {
    healthMessage = 'Altitude is A-OK';
  }
}, 10000);

// Endpoint to get health status
app.get('/health', (req, res) => {
  res.json({ message: healthMessage });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app; // Export the app for testing

// Function to set the health message for testing
app.setHealthMessage = (message) => {
    app.healthMessage = message;
};
// Function to set the satellite data for testing 
app.setSatelliteData = (data) => {
    app.satelliteData = data;
};
  