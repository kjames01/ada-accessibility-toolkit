const Anthropic = require('@anthropic-ai/sdk');

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

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, filename, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key is required. Please enter your Anthropic API key.' });
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided for analysis.' });
    }

    const client = new Anthropic({ apiKey: apiKey });

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
};
