import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

class LLMClient {
  constructor() {
    this.openai = null;
    this.anthropic = null;
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.moonshot.cn/v1',
      });
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    
    this.model = 'moonshot-v1-8k';
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE) || 0.7;
  }

  async callLLM(prompt, systemPrompt = null, maxRetries = 3) {
    if (!this.openai && !this.anthropic) {
      console.log('No LLM API key configured');
      return null;
    }
    
    if (this.openai) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const messages = [];
          if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
          }
          messages.push({ role: 'user', content: prompt });

          const response = await this.openai.chat.completions.create({
            model: this.model,
            messages,
            temperature: this.temperature,
            max_tokens: 1000,
          });

          return response.choices[0].message.content;
        } catch (error) {
          console.error(`OpenAI API call failed (attempt ${attempt}/${maxRetries}):`, error.message);
          
          if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('RPM')) {
            const delaySeconds = Math.min(2 ** attempt + Math.random() * 2, 60);
            console.log(`⏳ Rate limit hit, waiting ${delaySeconds.toFixed(1)} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            continue;
          }
          
          if (attempt === maxRetries) {
            console.log('💡 Max retries reached, API unavailable');
            return null;
          }
        }
      }
    }

    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          temperature: this.temperature,
          system: systemPrompt || 'You are a helpful AI assistant.',
          messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].text;
      } catch (error) {
        console.error('Anthropic API call failed:', error.message);
        return null;
      }
    }

    console.error('No LLM API key configured');
    return null;
  }

  async extractJSON(prompt, systemPrompt = null) {
    const response = await this.callLLM(prompt, systemPrompt);
    if (!response) {
      return {
        signal: 'hold',
        confidence: 0.5,
        reasoning: 'No LLM response available',
        target_price: 100,
        stop_loss: 95,
        risk_level: 'medium',
        timeframe: '1d',
        key_factors: ['technical_analysis', 'market_sentiment']
      };
    }

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON from LLM response:', error);
      return {
        signal: 'hold',
        confidence: 0.5,
        reasoning: 'Default response due to parsing error',
        target_price: 100,
        stop_loss: 95,
        risk_level: 'medium',
        timeframe: '1d',
        key_factors: ['technical_analysis', 'market_sentiment']
      };
    }
  }
}

export const llmClient = new LLMClient();
