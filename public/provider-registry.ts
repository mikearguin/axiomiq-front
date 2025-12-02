// lib/ai/provider-registry.ts

import { createProviderRegistry, customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

// Create tenant-aware provider registry
export function createTenantProviderRegistry(tenantConfig: TenantAIConfig) {
  return createProviderRegistry({
    // OpenAI models
    openai: customProvider({
      languageModels: {
        'gpt-4o': openai('gpt-4o'),
        'gpt-4o-mini': openai('gpt-4o-mini'),
        'gpt-4-turbo': openai('gpt-4-turbo'),
      },
      // Use tenant's API key if provided, else platform key
      apiKey: tenantConfig.openaiKey || process.env.OPENAI_API_KEY,
    }),
    
    // Anthropic models
    anthropic: customProvider({
      languageModels: {
        'claude-sonnet-4': anthropic('claude-sonnet-4-20250514'),
        'claude-haiku': anthropic('claude-haiku'),
      },
      apiKey: tenantConfig.anthropicKey || process.env.ANTHROPIC_API_KEY,
    }),
    
    // Google models
    google: customProvider({
      languageModels: {
        'gemini-2-flash': google('gemini-2.0-flash'),
        'gemini-pro': google('gemini-pro'),
      },
      apiKey: tenantConfig.googleKey || process.env.GOOGLE_API_KEY,
    }),
    
    // Groq (fast inference)
    groq: customProvider({
      languageModels: {
        'llama-70b': groq('llama-3.3-70b-versatile'),
        'mixtral': groq('mixtral-8x7b-32768'),
      },
      apiKey: tenantConfig.groqKey || process.env.GROQ_API_KEY,
    }),
  });
}

// Model recommendation engine based on task type
export const MODEL_RECOMMENDATIONS = {
  // Complex reasoning, planning
  supervisor: ['anthropic:claude-sonnet-4', 'openai:gpt-4o'],
  
  // Fast, simple tasks
  worker: ['groq:llama-70b', 'openai:gpt-4o-mini', 'google:gemini-2-flash'],
  
  // Code generation
  coding: ['anthropic:claude-sonnet-4', 'openai:gpt-4o'],
  
  // Creative writing
  creative: ['anthropic:claude-sonnet-4', 'openai:gpt-4o'],
  
  // Data extraction, structured output
  extraction: ['openai:gpt-4o-mini', 'google:gemini-2-flash'],
  
  // Customer-facing chat
  chat: ['anthropic:claude-sonnet-4', 'openai:gpt-4o'],
};