const express = require('express');
const path = require('path');
const app = express();
const port = 8000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes for all pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/alerts', (req, res) => {
  res.sendFile(path.join(__dirname, 'alerts.html'));
});

app.get('/aid-request', (req, res) => {
  res.sendFile(path.join(__dirname, 'aid-request.html'));
});

app.get('/volunteer', (req, res) => {
  res.sendFile(path.join(__dirname, 'volunteer.html'));
});

app.get('/mental-health', (req, res) => {
  res.sendFile(path.join(__dirname, 'mental-health.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// Start server
app.listen(port, () => {
  console.log(`SafeNet app running at http://localhost:${port}`);
  console.log('Available pages:');
  console.log(`- Home: http://localhost:${port}/`);
  console.log(`- Alerts: http://localhost:${port}/alerts`);
  console.log(`- Aid Request: http://localhost:${port}/aid-request`);
  console.log(`- Volunteer: http://localhost:${port}/volunteer`);
  console.log(`- Mental Health: http://localhost:${port}/mental-health`);
  console.log(`- About: http://localhost:${port}/about`);
});