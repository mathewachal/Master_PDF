/**
 * Pluggable LLM Provider types and configurations.
 */

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'demo';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProviderConfig {
  type: ProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface ExtractedEntity {
  field: string;
  value: string;
  confidence: number;
}

export interface StructuredExtractionResult {
  docType: 'invoice' | 'contract' | 'receipt' | 'general';
  entities: ExtractedEntity[];
  rawJson: Record<string, any>;
}

export interface PiiDetectionItem {
  text: string;
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'name' | 'address';
  confidence: number;
}
