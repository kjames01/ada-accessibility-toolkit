const providers = require('./providers');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, issues, filename, apiKey, provider, model } = req.body;

    if (!apiKey) {
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

    var responseText = await providers.callProvider({
      provider: provider || 'anthropic',
      model: model || providers.PROVIDER_DEFAULTS[provider || 'anthropic'].model,
      apiKey: apiKey,
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
};
