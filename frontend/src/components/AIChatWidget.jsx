import React, { useState, useRef, useEffect } from 'react';
import GradientButton from './GradientButton';
import GlassmorphicCard from './GlassmorphicCard';
import { aiChatService } from '../utils/api';

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Hi! I am your Alpha Insights AI assistant. I can help you with portfolio management, stock research, platform support, financial education, and setting up alerts. How can I help you today?',
      agent: 'Master Agent',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    // Add user message and loading indicator
    const loadingMessage: Message = {
      sender: 'ai',
      text: 'Thinking...',
      loading: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
              // Enhanced context for AI service
        const enhancedContext = {
          conversation_context: messages.slice(-5).map(msg => ({
            text: msg.text,
            agent: msg.agent,
            timestamp: msg.timestamp,
            sender: msg.sender
          })),
          current_timestamp: new Date().toISOString(),
          last_agent: messages.length > 0 ? messages[messages.length - 1]?.agent : null,
          conversation_length: messages.length,
          user_id: 'current_user' // This would come from auth context in real app
        };

        // Send message to AI service
        const response = await aiChatService.sendMessage(input, enhancedContext);

      if (response.success && response.data) {
        const aiResponse: AIResponse = response.data;
        
        const aiMessage: Message = {
          sender: 'ai',
          text: aiResponse.response,
          agent: aiResponse.agent_name || aiResponse.agent,
          timestamp: new Date().toISOString(),
          confidence: aiResponse.confidence
        };

        // Replace loading message with actual response
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = aiMessage;
          return newMessages;
        });

        // Get AI suggestions for follow-up with enhanced context
        try {
          const suggestionsResponse = await aiChatService.getSuggestions(input);
          if (suggestionsResponse.success && suggestionsResponse.data) {
            setSuggestions(suggestionsResponse.data.suggestions);
          }
        } catch (error) {
          console.log('Failed to get suggestions:', error);
        }

        // Track agent transitions for handoff analysis
        if (messages.length > 1) {
          const lastMessage = messages[messages.length - 2];
          const currentAgent = aiResponse.agent_name || aiResponse.agent;
          const lastAgent = lastMessage.agent;
          
          if (lastAgent && currentAgent && lastAgent !== currentAgent) {
            console.log(`Agent handoff detected: ${lastAgent} → ${currentAgent}`);
            // This could be enhanced to send handoff tracking to backend
          }
        }
      } else {
        // Handle error response
        const errorMessage: Message = {
          sender: 'ai',
          text: response.error || 'I apologize, but I\'m experiencing technical difficulties. Please try again.',
          agent: 'System',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = errorMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const errorMessage: Message = {
        sender: 'ai',
        text: 'I\'m sorry, I\'m having trouble connecting right now. Please check your connection and try again.',
        agent: 'System',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

    const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. How can I help you today?',
        agent: 'Master Agent',
        timestamp: new Date().toISOString()
      }
    ]);
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setSuggestions([]);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        {!open && (
          <GradientButton 
            onClick={() => setOpen(true)} 
            className="rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform"
          >
            💬
          </GradientButton>
        )}
        {open && (
          <GlassmorphicCard className="w-96 h-[500px] flex flex-col shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20">
              <div>
                <span className="font-bold text-lg text-white">AI Assistant</span>
                <p className="text-xs text-gray-400">Multi-agent financial AI</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={clearChat}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Clear chat"
                >
                  🗑️
                </button>
                <button 
                  className="text-white text-xl font-bold hover:text-indigo-400 transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 px-1 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                    {/* Agent badge for AI messages */}
                    {msg.sender === 'ai' && msg.agent && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">AI</span>
                        </div>
                        <span className="text-xs text-gray-400">{msg.agent}</span>
                        {msg.confidence && (
                          <span className="text-xs text-gray-500">
                            ({Math.round(msg.confidence * 100)}%)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-primary text-white' 
                        : msg.loading
                        ? 'bg-gray-600/50 text-gray-300'
                        : 'bg-slate-700/50 text-white border border-slate-600/50'
                    }`}>
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">{msg.text}</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs text-gray-500 mt-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Suggested follow-ups:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-full transition-colors border border-slate-600/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form className="flex gap-2" onSubmit={handleSend}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about stocks, portfolio, or get help..."
                disabled={isLoading}
                className="flex-1 input-glass text-sm disabled:opacity-50"
              />
              <GradientButton 
                type="submit" 
                className="px-4 py-2" 
                disabled={!input.trim() || isLoading}
                loading={isLoading}
              >
                Send
              </GradientButton>
            </form>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {[
                  'Analyze my portfolio',
                  'Research AAPL',
                  'Set price alert',
                  'Market overview',
                  'Help me get started'
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-2 py-1 bg-slate-700/30 hover:bg-slate-600/30 text-gray-300 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </GlassmorphicCard>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;
