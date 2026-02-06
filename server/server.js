const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// --- Analysis system prompt ---
const ANALYSIS_SYSTEM_PROMPT = `You are an expert ADA compliance and WCAG 2.1 accessibility auditor. Analyze the provided document text for accessibility issues.

Return your analysis as valid JSON with this exact structure:
{
  "summary": {
    "errorCount": <number>,
    "warningCount": <number>,
    "infoCount": <number>,
    "overallScore": <number 0-100>
  },
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "wcagCriteria": "<WCAG criterion, e.g. 1.1.1>",
      "title": "<short title>",
      "description": "<detailed description of the issue>",
      "location": "<where in the document the issue occurs>",
      "recommendation": "<specific recommendation to fix the issue>"
    }
  ]
}

Be thorough and identify all accessibility issues related to:
- Text alternatives for non-text content
- Adaptable content and meaningful sequence
- Distinguishable content (contrast, text sizing)
- Keyboard accessibility
- Timing and seizure risks
- Navigable structure (headings, labels, focus)
- Readable and predictable content
- Input assistance and error handling
- Compatible markup

Return ONLY the JSON object, no additional text or markdown formatting.`;

// --- Generation system prompt ---
const GENERATION_SYSTEM_PROMPT = `You are an expert in creating accessible HTML5 documents that comply with ADA requirements and WCAG 2.1 AA standards.

Given the original document text and a list of accessibility issues found, produce a complete, valid, accessible HTML5 document that resolves all identified issues.

Requirements for the output HTML:
- Complete valid HTML5 document with proper DOCTYPE, lang attribute, and meta charset
- Semantic HTML elements (header, nav, main, section, article, aside, footer)
- Proper heading hierarchy (h1 through h6, no skipped levels)
- Skip navigation link at the top of the page
- ARIA landmarks and roles where appropriate
- Alt text for any images or descriptive text for non-text content
- Sufficient color contrast (at least 4.5:1 for normal text)
- Embedded CSS within a <style> tag in the <head>
- Responsive layout using modern CSS (flexbox/grid)
- Focus indicators for interactive elements
- Proper form labels and associations if forms are present
- Meaningful link text
- Proper list markup for list content
- Data table accessibility (scope, caption, headers) if tables are present

Return ONLY the complete HTML document, no additional explanation or markdown formatting.`;

// --- POST /api/analyze ---
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, filename } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for analysis.' });
    }

    // Cap input at 100K characters
    const cappedText = text.substring(0, 100000);

    const userMessage = `Analyze the following document for ADA and WCAG 2.1 accessibility compliance.

Filename: ${filename || 'Unknown'}

Document text:
${cappedText}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    // Extract text from content blocks
    const textBlocks = response.content.filter(block => block.type === 'text');
    const responseText = textBlocks.map(block => block.text).join('');

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
    const { text, issues, filename } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for generation.' });
    }

    const userMessage = `Convert the following document into an accessible HTML5 document, addressing the accessibility issues listed below.

Filename: ${filename || 'Unknown'}

Original document text:
${text.substring(0, 100000)}

Accessibility issues to address:
${JSON.stringify(issues, null, 2)}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16384,
      thinking: { type: 'adaptive' },
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    // Extract text from content blocks
    const textBlocks = response.content.filter(block => block.type === 'text');
    let html = textBlocks.map(block => block.text).join('');

    // Strip markdown code fences if present
    html = html.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

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
