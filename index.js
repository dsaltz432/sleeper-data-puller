const express = require('express');
const cors = require('cors');
const { fetchAndFormatData } = require('./src/main');

const app = express();
app.use(cors());

app.get('/api/v1/report', async(req, res) => {
  try {
    const results = await fetchAndFormatData();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching data from sleeper.' });
  }
});

// Export the Express app for Google Cloud Function
exports.api = app;

// Run the server locally if not on Cloud Functions
if (require.main === module) {
  const PORT = process.env.PORT || 3001; // Use 3001 locally or any assigned port in production
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
