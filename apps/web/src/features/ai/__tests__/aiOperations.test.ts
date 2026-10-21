import { describe, it, expect, beforeEach } from 'vitest';
import {
  chatWithPdf,
  summarizeDocument,
  extractStructuredData,
  detectPiiEntities,
} from '../aiClient';
import { useAiStore } from '../aiStore';

describe('Phase 6: AI Intelligence Suite (Provider-agnostic interface)', () => {
  beforeEach(() => {
    useAiStore.setState({
      aiEnabled: true,
      provider: 'demo',
      apiKey: '',
      model: 'gpt-4o',
      baseUrl: '',
    });
  });

  it('should summarize document content using demo provider', async () => {
    const docText = `
      Quarterly Performance Report 2026.
      Total Sales: $45,000.00.
      All legal compliance requirements satisfied.
    `;

    const summary = await summarizeDocument(docText, 'executive');
    expect(summary).toContain('Executive Document Summary');
    expect(summary).toContain('Document Scope');
  });

  it('should answer questions about document financials', async () => {
    const docText = `
      Invoice Reference: INV-2026-9901
      Total Balance Due: $45,000.00
      Due Date: November 30, 2026
    `;

    const answer = await chatWithPdf(docText, 'What is the total invoice amount?');
    expect(answer).toContain('$45,000.00');
  });

  it('should extract structured entities (invoice, total, date)', async () => {
    const docText = `
      INVOICE #INV-88912
      Date: 10/24/2026
      Total: $12,500.00
    `;

    const result = await extractStructuredData(docText);
    expect(result.docType).toBe('invoice');
    expect(result.entities.length).toBeGreaterThanOrEqual(3);

    const refEntity = result.entities.find((e) => e.field.includes('Reference'));
    expect(refEntity?.value).toBe('INV-88912');
  });

  it('should detect sensitive PII entities (email, phone, ssn)', async () => {
    const docText = `
      Contact john.doe@example.com or call (555) 234-5678.
      Employee SSN: 123-45-6789.
    `;

    const pii = await detectPiiEntities(docText);
    expect(pii.length).toBe(3);

    const types = pii.map((p) => p.type);
    expect(types).toContain('email');
    expect(types).toContain('phone');
    expect(types).toContain('ssn');
  });

  it('should allow toggling AI feature flag and switching providers in store', () => {
    useAiStore.getState().setAiEnabled(false);
    expect(useAiStore.getState().aiEnabled).toBe(false);

    useAiStore.getState().setProvider('ollama');
    expect(useAiStore.getState().provider).toBe('ollama');

    useAiStore.getState().setApiKey('test-key');
    expect(useAiStore.getState().apiKey).toBe('test-key');
  });
});
