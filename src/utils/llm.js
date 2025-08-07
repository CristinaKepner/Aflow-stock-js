import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

class LLMClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.model = process.env.LLM_MODEL || 'gpt-4';
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE) || 0.7;
  }

  async callLLM(prompt, systemPrompt = null) {
    try {
      // 优先使用 OpenAI
      if (process.env.OPENAI_API_KEY) {
        const messages = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: 2000,
        });

        return response.choices[0].message.content.trim();
      }
      
      // 备用 Anthropic
      if (process.env.ANTHROPIC_API_KEY) {
        const messages = [];
        if (systemPrompt) {
          messages.push({ role: 'user', content: `${systemPrompt}\n\n${prompt}` });
        } else {
          messages.push({ role: 'user', content: prompt });
        }

        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          messages,
          max_tokens: 2000,
          temperature: this.temperature,
        });

        return response.content[0].text.trim();
      }
      
      throw new Error('No LLM API key configured');
    } catch (error) {
      console.error('LLM call failed:', error.message);
      // 返回一个默认响应，避免程序崩溃
      return 'Unable to generate response due to API error.';
    }
  }

  async extractJSON(prompt, systemPrompt = null) {
    const response = await this.callLLM(prompt, systemPrompt);
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON from LLM response:', error);
      return null;
    }
  }
}

export const llmClient = new LLMClient();
export default llmClient;
