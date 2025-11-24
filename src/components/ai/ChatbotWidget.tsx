'use client';

/**
 * AI Chatbot Widget Component - Enhanced UI
 * Floating chatbot for faculty users with Travelink theme
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m Travie, your Travelink assistant.\n\nI can help you with transport requests, vehicle availability, approval processes, and general questions about the system.\n\nWhat can I help you with today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load suggestions when opened (non-blocking)
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      // Load suggestions asynchronously without blocking UI
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/ai/chat', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Silently fail for suggestions - not critical
        // Only log if it's not a configuration issue
        if (response.status !== 503) {
          console.warn('[ChatbotWidget] Suggestions API not OK:', response.status);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn('[ChatbotWidget] Suggestions API returned non-JSON response. Content-Type:', contentType);
        const errorText = await response.text();
        console.error('[ChatbotWidget] Non-JSON response body:', errorText.substring(0, 500));
        throw new Error('Invalid response format');
      }
      
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('[ChatbotWidget] Failed to load suggestions:', error);
      // Don't show error to user, just use empty suggestions
      // The chat will still work without suggestions
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add timeout to prevent hanging (30 seconds for AI response)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Send to AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response for user-friendly message
        let errorData: any = {};
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch {
          // If parsing fails, use default error
        }
        
        // Only log unexpected errors (not 503 Service Unavailable)
        if (response.status !== 503) {
          console.warn('[ChatbotWidget] Chat API not OK:', response.status, response.statusText);
        }
        
        // Throw error with user-friendly message from API if available
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Only log if it's unexpected (not a 503 config error)
        if (response.status !== 503) {
          console.warn('[ChatbotWidget] Chat API returned non-JSON response. Content-Type:', contentType);
        }
        throw new Error('Invalid response format');
      }

      const data = await response.json();

      if (data.success) {
        // Add AI response
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(data.timestamp || Date.now())
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Use the user-friendly message from API if available
        throw new Error(data.message || data.error || 'Failed to get response');
      }
    } catch (error) {
      // Only log unexpected errors (not configuration issues)
      if (error instanceof Error && !error.message.includes('AI service is not configured')) {
        console.error('[ChatbotWidget] Chat error:', error);
      }
      
      // Provide user-friendly error message
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = 'The request took too long. The AI service might be slow right now. Please try again.';
        } else if (error.message.includes('HTTP')) {
          errorMessage = 'Unable to connect to the AI service. Please check your connection and try again.';
        } else if (error.message) {
          // Use the error message from the API if available (already user-friendly)
          errorMessage = error.message;
        }
      }
      
      // Add error message
      const errorMsg: Message = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50"
          style={{ backgroundColor: '#7A0010' }}
          aria-label="Open Travie AI Assistant"
          suppressHydrationWarning
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window - Minimized State */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50"
          style={{ backgroundColor: '#7A0010' }}
          aria-label="Expand Travie"
          suppressHydrationWarning
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window - Full State */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[550px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-300 overflow-hidden">
          {/* Header - Clickable to collapse/expand */}
          <div 
            className="text-white px-4 py-3 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
            style={{ backgroundColor: '#7A0010' }}
            onClick={() => setIsMinimized(true)}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Travie</h3>
                <p className="text-xs opacity-90">AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="hover:bg-white/20 p-1 rounded transition-all"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'text-white p-3 rounded-2xl rounded-br-sm'
                      : 'bg-gray-50 text-gray-900 p-4 rounded-2xl rounded-bl-sm border border-gray-200'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: '#7A0010' } : {}}
                >
                  <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-2 ${
                    msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                  }`}>
                    {msg.timestamp.toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 p-4 rounded-2xl rounded-bl-sm border border-gray-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#7A0010' }} />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {messages.length === 1 && suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium mb-2">Suggested questions:</p>
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(suggestion)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Travie..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-[15px]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="text-white p-2.5 rounded-full hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: '#7A0010' }}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
