const PROVIDER_DEFAULTS = {
  anthropic: { model: 'claude-opus-4-6', label: 'Anthropic', placeholder: 'sk-ant-...' },
  openai: { model: 'gpt-4o', label: 'OpenAI', placeholder: 'sk-...' },
  gemini: { model: 'gemini-2.5-flash', label: 'Google Gemini', placeholder: 'AIza...' }
};

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

function formatProviderError(provider, error) {
  var status = error.status || error.statusCode || (error.response && error.response.status);
  var label = PROVIDER_DEFAULTS[provider] ? PROVIDER_DEFAULTS[provider].label : provider;

  if (status === 401 || status === 403) {
    return label + ': Invalid API key. Please check that your key is correct and active.';
  }

  if (status === 404) {
    var modelHint = error.message && error.message.match(/model/i) ? ' The model you selected may not be available on your account.' : '';
    return label + ': Resource not found.' + modelHint + ' Please verify the model name is correct.';
  }

  if (status === 429) {
    var msg = (error.message || '').toLowerCase();
    if (msg.indexOf('quota') !== -1 || msg.indexOf('limit: 0') !== -1 || msg.indexOf('billing') !== -1) {
      return label + ': Your API quota is exhausted or your plan does not include access to this model. Please check your billing settings and plan details at your provider\'s dashboard.';
    }
    return label + ': Rate limit exceeded. Please wait a moment and try again, or check your plan\'s rate limits.';
  }

  return label + ': ' + (error.message || 'An unexpected error occurred.');
}

async function callProvider({ provider, model, apiKey, systemPrompt, userMessage, maxTokens }) {
  try {
    if (provider === 'anthropic') {
      var Anthropic = require('@anthropic-ai/sdk');
      var client = new Anthropic({ apiKey: apiKey });
      var response = await client.messages.create({
        model: model,
        max_tokens: maxTokens,
        thinking: { type: 'adaptive' },
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });
      return response.content.filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('');
    } else if (provider === 'openai') {
      var OpenAI = require('openai');
      var client = new OpenAI({ apiKey: apiKey });
      var response = await client.chat.completions.create({
        model: model,
        max_completion_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });
      return response.choices[0].message.content;
    } else if (provider === 'gemini') {
      var GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      var ai = new GoogleGenerativeAI(apiKey);
      var genModel = ai.getGenerativeModel({ model: model, systemInstruction: systemPrompt });
      var result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      });
      return result.response.text();
    } else {
      throw new Error('Unknown provider: ' + provider);
    }
  } catch (error) {
    throw new Error(formatProviderError(provider, error));
  }
}

module.exports = { PROVIDER_DEFAULTS, ANALYSIS_SYSTEM_PROMPT, GENERATION_SYSTEM_PROMPT, callProvider };
