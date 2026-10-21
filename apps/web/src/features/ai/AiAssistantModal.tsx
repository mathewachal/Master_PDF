import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Copy,
  Check,
  Loader2,
  X,
  FileText,
  Key,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAiStore } from './aiStore';
import {
  chatWithPdf,
  summarizeDocument,
  extractStructuredData,
} from './aiClient';
import { LLMMessage, StructuredExtractionResult, ProviderType } from './types';
import { Button } from '../../components/ui/Button';

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc } = useWorkspaceStore();
  const {
    aiEnabled,
    provider,
    apiKey,
    model,
    baseUrl,
    setAiEnabled,
    setProvider,
    setApiKey,
    setModel,
    setBaseUrl,
  } = useAiStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'extract' | 'settings'>('chat');

  // Chat State
  const [messages, setMessages] = useState<LLMMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI document assistant. Ask me questions about this document, request translations, or ask for clarifications.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Summary State
  const [summaryMode, setSummaryMode] = useState<'executive' | 'bullets' | 'action_items'>('executive');
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Extraction State
  const [extractResult, setExtractResult] = useState<StructuredExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeDoc) return null;

  // Simple text decoder for the document data
  const getDocSampleText = () => {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return decoder.decode(activeDoc.data.slice(0, 100000));
    } catch {
      return activeDoc.name;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isChatting) return;

    const userMsg: LLMMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsChatting(true);

    try {
      const docText = getDocSampleText();
      const reply = await chatWithPdf(docText, text, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to get AI response'}` },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const docText = getDocSampleText();
      const summary = await summarizeDocument(docText, summaryMode);
      setSummaryText(summary);
    } catch (err: any) {
      setSummaryText(`Summary generation failed: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunExtraction = async () => {
    setIsExtracting(true);
    try {
      const docText = getDocSampleText();
      const result = await extractStructuredData(docText);
      setExtractResult(result);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col h-[640px] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  AI PDF Intelligence
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  {provider.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Summarize, chat, and extract structured data from {activeDoc.name}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat with PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summarize</span>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'extract'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Extract Entities</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ml-auto ${
              activeTab === 'settings'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Provider Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 text-xs ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex gap-2 items-center text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing document context...</span>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-2 pt-3 pb-2 overflow-x-auto">
                <button
                  onClick={() => handleSendMessage('Summarize the primary purpose of this document')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  💡 Summarize document
                </button>
                <button
                  onClick={() => handleSendMessage('What are the key financial numbers and totals?')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  💰 Key financials
                </button>
                <button
                  onClick={() => handleSendMessage('List all dates, deadlines, and parties involved')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  📅 Deadlines & Parties
                </button>
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Ask any question about this PDF..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isChatting}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2">
                {(['executive', 'bullets', 'action_items'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSummaryMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      summaryMode === mode
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
                {summaryText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySummary}
                    className="ml-auto text-xs gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className={`${summaryText ? '' : 'ml-auto '}text-xs gap-1.5`}
                >
                  {isSummarizing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Summary</span>
                </Button>
              </div>

              <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40 text-xs overflow-y-auto font-sans leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                {summaryText || (
                  <span className="text-slate-400 italic">
                    Select a format above and click "Generate Summary" to extract insights.
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'extract' && (
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Automatically extracts invoice numbers, totals, dates, and entities.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunExtraction}
                  disabled={isExtracting}
                  className="text-xs gap-1.5"
                >
                  {isExtracting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Run Extraction</span>
                </Button>
              </div>

              <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                {extractResult ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2">Field Entity</th>
                        <th className="px-3 py-2">Extracted Value</th>
                        <th className="px-3 py-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {extractResult.entities.map((e, idx) => (
                        <tr key={idx} className="hover:bg-white/40">
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                            {e.field}
                          </td>
                          <td className="px-3 py-2 text-brand-600 dark:text-brand-400 font-semibold">
                            {e.value}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {Math.round(e.confidence * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                    Click "Run Extraction" to detect structured entities.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 overflow-y-auto">
              {/* Feature Flag Toggle */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Enable AI Features
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Master_PDF functions 100% offline without AI when disabled.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  LLM Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ProviderType)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="demo">Demo / Local Heuristics (Offline, No API Key needed)</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="gemini">Google Gemini (Gemini 1.5 Pro)</option>
                  <option value="ollama">Ollama (Local LLaMA 3 / Mistral)</option>
                </select>
              </div>

              {/* API Key */}
              {provider !== 'demo' && provider !== 'ollama' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>API Key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Custom Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Base URL for Ollama / Custom Endpoint */}
              {(provider === 'ollama' || provider === 'openai') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Base Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Provider: <strong>{provider}</strong> ({model})
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
