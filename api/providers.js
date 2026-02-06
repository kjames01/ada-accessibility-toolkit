const PROVIDER_DEFAULTS = {
  anthropic: { model: 'claude-opus-4-6', label: 'Anthropic', placeholder: 'sk-ant-...' },
  openai: { model: 'gpt-4o', label: 'OpenAI', placeholder: 'sk-...' },
  gemini: { model: 'gemini-2.0-flash', label: 'Google Gemini', placeholder: 'AIza...' }
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

async function callProvider({ provider, model, apiKey, systemPrompt, userMessage, maxTokens }) {
  if (provider === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: apiKey });
    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });
    return response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  } else if (provider === 'openai') {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: apiKey });
    const response = await client.chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });
    return response.choices[0].message.content;
  } else if (provider === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const ai = new GoogleGenerativeAI(apiKey);
    const genModel = ai.getGenerativeModel({ model: model, systemInstruction: systemPrompt });
    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens }
    });
    return result.response.text();
  } else {
    throw new Error('Unknown provider: ' + provider);
  }
}

module.exports = { PROVIDER_DEFAULTS, ANALYSIS_SYSTEM_PROMPT, GENERATION_SYSTEM_PROMPT, callProvider };
