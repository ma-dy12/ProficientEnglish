require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Azure client
const client = new TextAnalyticsClient(
  process.env.AZURE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_API_KEY)
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required'
      });
    }

    // Analysis logic here
    const analysis = {
      fluency: 'Good',
      vocabulary: 'Advanced',
      pronunciation: 'Clear',
      grammar: 'Correct',
      score: '85'
    };

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
