// lib/ai/providers/registry.ts

import { createProviderRegistry, customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

// Tenant AI Configuration
export interface TenantAIConfig {
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  groqKey?: string;
}

// Create tenant-aware provider registry
export function createTenantProviderRegistry(tenantConfig: TenantAIConfig) {
  // TODO: Implement proper tenant-specific API key configuration
  // For now, using default providers which read from environment variables

  return createProviderRegistry({
    // OpenAI models
    openai: openai as any,

    // Anthropic models
    anthropic: anthropic as any,

    // Google models
    google: google as any,

    // Groq models
    groq: groq as any,
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