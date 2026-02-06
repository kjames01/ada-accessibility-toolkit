const providers = require('./providers');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, filename, apiKey, provider, model } = req.body;

    if (!apiKey) {
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

    var responseText = await providers.callProvider({
      provider: provider || 'anthropic',
      model: model || providers.PROVIDER_DEFAULTS[provider || 'anthropic'].model,
      apiKey: apiKey,
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
};
