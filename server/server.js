const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const providers = require('../api/providers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve frontend static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// --- In-memory rate limiter (10 requests/min per IP) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again in a minute.'
    });
  }

  timestamps.push(now);
  next();
}

// Apply rate limiter to API routes
app.use('/api/', rateLimit);

// --- POST /api/analyze ---
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, filename, apiKey, provider, model } = req.body;
    const key = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!key) {
      return res.status(400).json({ success: false, error: 'API key is required. Please enter your API key.' });
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for analysis.' });
    }

    // Cap input at 100K characters
    const cappedText = text.substring(0, 100000);

    const userMessage = `Analyze the following document for ADA and WCAG 2.1 accessibility compliance.

Filename: ${filename || 'Unknown'}

Document text:
${cappedText}`;

    const responseText = await providers.callProvider({
      provider: provider || 'anthropic',
      model: model || providers.PROVIDER_DEFAULTS[provider || 'anthropic'].model,
      apiKey: key,
      systemPrompt: providers.ANALYSIS_SYSTEM_PROMPT,
      userMessage: userMessage,
      maxTokens: 8192
    });

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it contains extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse analysis response as JSON.');
      }
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during analysis.'
    });
  }
});

// --- POST /api/generate ---
app.post('/api/generate', async (req, res) => {
  try {
    const { text, issues, filename, apiKey, provider, model } = req.body;
    const key = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!key) {
      return res.status(400).json({ success: false, error: 'API key is required. Please enter your API key.' });
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for generation.' });
    }

    const userMessage = `Convert the following document into an accessible HTML5 document, addressing the accessibility issues listed below.

Filename: ${filename || 'Unknown'}

Original document text:
${text.substring(0, 100000)}

Accessibility issues to address:
${JSON.stringify(issues, null, 2)}`;

    const responseText = await providers.callProvider({
      provider: provider || 'anthropic',
      model: model || providers.PROVIDER_DEFAULTS[provider || 'anthropic'].model,
      apiKey: key,
      systemPrompt: providers.GENERATION_SYSTEM_PROMPT,
      userMessage: userMessage,
      maxTokens: 16384
    });

    // Strip markdown code fences if present
    let html = responseText.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    res.json({ success: true, html });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during HTML generation.'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ADA Accessibility Toolkit server running on http://localhost:${PORT}`);
});
