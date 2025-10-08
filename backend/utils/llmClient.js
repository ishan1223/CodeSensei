const axios = require('axios');

class LLMClient {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'gemini';
    this.maxHints = parseInt(process.env.MAX_HINTS_PER_PROBLEM) || 3;
    this.maxDebugTips = parseInt(process.env.MAX_DEBUG_TIPS) || 5;
  }

  /**
   * Generate hints for a coding problem
   * @param {Object} problem - Problem data object
   * @param {string} provider - LLM provider ('gemini' or 'openai')
   * @returns {Promise<Object>} Generated hints and analysis
   */
  async generateHints(problem, provider = this.defaultProvider) {
    try {
      const prompt = this.buildHintsPrompt(problem);
      
      let response;
      if (provider === 'gemini') {
        response = await this.callGeminiAPI(prompt);
      } else if (provider === 'openai') {
        response = await this.callOpenAIAPI(prompt);
      } else {
        throw new Error(`Unsupported LLM provider: ${provider}`);
      }

      return this.parseHintsResponse(response);
    } catch (error) {
      console.error('Error generating hints:', error);
      throw new Error(`Failed to generate hints: ${error.message}`);
    }
  }

  /**
   * Generate debug feedback for user code
   * @param {Object} problem - Problem data object
   * @param {string} code - User's code
   * @param {string} provider - LLM provider ('gemini' or 'openai')
   * @returns {Promise<Object>} Debug feedback and tips
   */
  async generateDebugFeedback(problem, code, provider = this.defaultProvider) {
    try {
      const prompt = this.buildDebugPrompt(problem, code);
      
      let response;
      if (provider === 'gemini') {
        response = await this.callGeminiAPI(prompt);
      } else if (provider === 'openai') {
        response = await this.callOpenAIAPI(prompt);
      } else {
        throw new Error(`Unsupported LLM provider: ${provider}`);
      }

      return this.parseDebugResponse(response);
    } catch (error) {
      console.error('Error generating debug feedback:', error);
      throw new Error(`Failed to generate debug feedback: ${error.message}`);
    }
  }

  /**
   * Build prompt for hints generation
   */
  buildHintsPrompt(problem) {
    return `You are CodeSensei, an AI mentor who guides users through coding problems step by step without revealing direct answers.

Given the following problem:
Title: ${problem.title}
Platform: ${problem.platform}
Difficulty: ${problem.difficulty}
Description: ${problem.description?.substring(0, 1000) || 'No description available'}
Tags: ${problem.tags?.join(', ') || 'None'}

Generate output in JSON format:
{
  "category": "<algorithm/data structure category>",
  "summary": "<brief 2-3 sentence summary of the problem approach>",
  "hints": [
    "<conceptual hint 1 - focus on problem understanding>",
    "<conceptual hint 2 - focus on approach/strategy>",
    "<conceptual hint 3 - focus on implementation details>"
  ]
}

Rules:
- Never provide the full code or solution
- Keep hints conceptual and progressive (each builds on the previous)
- Focus on understanding the problem and approach, not implementation
- Make hints educational and thought-provoking
- Category should be specific (e.g., "Dynamic Programming", "Two Pointers", "Binary Search")
- Summary should explain the core approach without giving away the solution
- Each hint should be 1-2 sentences maximum`;
  }

  /**
   * Build prompt for debug feedback generation
   */
  buildDebugPrompt(problem, code) {
    return `You are CodeSensei, an AI mentor who helps debug code without revealing the complete solution.

Given the following problem:
Title: ${problem.title}
Platform: ${problem.platform}
Difficulty: ${problem.difficulty}
Description: ${problem.description?.substring(0, 500) || 'No description available'}

And the user's code:
\`\`\`
${code}
\`\`\`

Generate output in JSON format:
{
  "tips": [
    "<specific debugging tip 1>",
    "<specific debugging tip 2>",
    "<specific debugging tip 3>"
  ],
  "example": "<brief explanation of sample input/output reasoning without revealing solution>",
  "suggestions": [
    "<general improvement suggestion 1>",
    "<general improvement suggestion 2>"
  ]
}

Rules:
- Never provide the complete solution or working code
- Focus on common mistakes, edge cases, and logical errors
- Provide specific debugging tips that help identify issues
- Example should explain reasoning process, not the solution
- Suggestions should be general improvements, not specific fixes
- Each tip should be actionable and educational
- Limit tips to ${this.maxDebugTips} items maximum`;
  }

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAIAPI(prompt) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are CodeSensei, an AI mentor who helps with coding problems. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Parse hints response from LLM
   */
  parseHintsResponse(response) {
    try {
      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize response
      return {
        category: parsed.category || 'General',
        summary: parsed.summary || 'No summary available',
        hints: Array.isArray(parsed.hints) 
          ? parsed.hints.slice(0, this.maxHints).map(hint => String(hint).trim())
          : ['No hints available'],
        generatedAt: new Date(),
        llmProvider: this.defaultProvider
      };
    } catch (error) {
      console.error('Error parsing hints response:', error);
      console.error('Raw response:', response);
      
      // Fallback response
      return {
        category: 'General',
        summary: 'Unable to analyze this problem automatically.',
        hints: [
          'Try breaking down the problem into smaller parts',
          'Consider the time and space complexity requirements',
          'Think about edge cases and boundary conditions'
        ],
        generatedAt: new Date(),
        llmProvider: this.defaultProvider
      };
    }
  }

  /**
   * Parse debug response from LLM
   */
  parseDebugResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize response
      return {
        tips: Array.isArray(parsed.tips) 
          ? parsed.tips.slice(0, this.maxDebugTips).map(tip => String(tip).trim())
          : ['No specific debugging tips available'],
        example: parsed.example || 'Consider the problem constraints and edge cases',
        suggestions: Array.isArray(parsed.suggestions) 
          ? parsed.suggestions.map(suggestion => String(suggestion).trim())
          : ['Review your algorithm logic'],
        generatedAt: new Date(),
        llmProvider: this.defaultProvider
      };
    } catch (error) {
      console.error('Error parsing debug response:', error);
      console.error('Raw response:', response);
      
      // Fallback response
      return {
        tips: [
          'Check for off-by-one errors in loops',
          'Verify edge cases and boundary conditions',
          'Ensure all variables are properly initialized'
        ],
        example: 'Consider how your algorithm handles edge cases',
        suggestions: [
          'Add more test cases to verify your logic',
          'Consider the time complexity of your approach'
        ],
        generatedAt: new Date(),
        llmProvider: this.defaultProvider
      };
    }
  }

  /**
   * Check if API keys are configured
   */
  isConfigured() {
    return !!(this.geminiApiKey || this.openaiApiKey);
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    const providers = [];
    if (this.geminiApiKey) providers.push('gemini');
    if (this.openaiApiKey) providers.push('openai');
    return providers;
  }
}

module.exports = new LLMClient();
