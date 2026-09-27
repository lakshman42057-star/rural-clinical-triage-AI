import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ClinicalChatbotProps {
  initialOpen?: boolean;
}

const QUICK_PROMPTS = [
  'How do I assess signs of pediatric septic shock?',
  'Translate idiom: "fire in stomach with eyes turning yellow"',
  'What are the WHO danger signs for postpartum hemorrhage?',
  'What vitals require immediate district referral?',
];

export const ClinicalChatbot: React.FC<ClinicalChatbotProps> = ({ initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        '**Hello, Field Nurse.** I am your **Clinical Triage & Protocol Copilot** powered by Gemini.\n\nI can help you with:\n- Clarifying **vernacular patient idioms** into medical terms\n- Reviewing **triage urgency thresholds** and WHO danger signs\n- Step-by-step **field stabilization & referral checklists**\n\nHow can I support your triage evaluation today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.6-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Prepare multi-turn messages array
      const apiPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiPayload }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive response from clinical AI.');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Error communicating with AI. Please check network and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages in the current triage chat session?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content:
            '**Session reset.** How can I assist you with clinical triage, vernacular translation, or referral protocols?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setErrorMessage(null);
    }
  };

  return (
    <aside
      aria-label="Clinical AI Chatbot"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end print:hidden"
    >
      {/* Expanded Chat Window / Small Tab */}
      {isOpen && (
        <div
          id="clinical-chat-window"
          className={`bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out mb-3 ${
            isExpanded
              ? 'w-[calc(100vw-2.5rem)] sm:w-[540px] md:w-[600px] h-[640px] max-h-[88vh]'
              : 'w-[calc(100vw-2.5rem)] sm:w-[390px] md:w-[420px] h-[520px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-white tracking-wide">
                    Clinical AI Copilot
                  </h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <span>Gemini Decision-Support</span>
                  <span>•</span>
                  <span className="text-emerald-400">Online</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset Chat Session"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse size' : 'Expand window'}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          {messages.length <= 2 && (
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 shrink-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Suggested Clinical Inquiries:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="text-left text-[11px] bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 hover:text-blue-900 px-2 py-1 rounded-md transition-colors shadow-2xs cursor-pointer truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[88%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mb-1 text-[10px] font-bold shadow-2xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs relative group leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-body space-y-1 text-slate-800">
                          <Markdown
                            components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="leading-tight">{children}</li>,
                              strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        </div>
                      )}

                      {/* Message Actions */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy message"
                          className="absolute -right-7 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded shadow-2xs"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500 font-sans">{msg.modelUsed}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-end gap-1.5 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></span>
                    <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                      Synthesizing clinical guidance...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-start justify-between gap-2 shadow-2xs">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Chat Service Notice: </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, vernacular terms, or triage protocols..."
                rows={1}
                disabled={isLoading}
                className="flex-1 max-h-24 resize-none px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white leading-relaxed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 text-[9px] text-center text-slate-400 flex items-center justify-center gap-1 font-sans">
              <Activity className="w-2.5 h-2.5 text-blue-500" />
              <span>Decision-support only. Always verify critical findings bedside.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button with Chatbot Logo */}
      <button
        id="clinical-chatbot-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 cursor-pointer border ${
          isOpen
            ? 'bg-slate-900 border-slate-700 text-white scale-95'
            : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white hover:shadow-2xl hover:scale-105'
        }`}
        title={isOpen ? 'Close Chatbot' : 'Open Clinical AI Copilot'}
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-600 rounded-full"></span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-wide leading-tight">
            Clinical AI Chat
          </span>
          <span className="text-[10px] text-blue-100 leading-none opacity-90">
            {isOpen ? 'Click to minimize' : 'Protocol & Triage Copilot'}
          </span>
        </div>

        <MessageSquare className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors ml-0.5" />
      </button>
    </aside>
  );
};
