const Anthropic = require('@anthropic-ai/sdk');

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

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, issues, filename, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key is required. Please enter your Anthropic API key.' });
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for generation.' });
    }

    const client = new Anthropic({ apiKey: apiKey });

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
};
