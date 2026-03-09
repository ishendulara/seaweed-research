// frontend/src/pages/AIRecipeAssistant/ChatWithAI.js
import React, { useState, useRef, useEffect } from 'react';
import recipeService from '../../services/recipeService';

const ChatWithAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Hello! 👋 I\'m your seaweed recipe AI assistant. You can ask me about:\n\n• Recipe suggestions for breakfast, lunch, or dinner\n• Vegetarian or vegan options\n• Quick and easy recipes\n• High protein meals\n• Specific ingredients\n\nWhat would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested questions
  const suggestedQuestions = [
    '🥗 Show me vegetarian breakfast recipes',
    '⏱️ What are some quick recipes?',
    '💪 I need high protein meals',
    '🍜 Recipes with noodles',
    '🥥 What can I make with coconut?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText = input) => {
    const userMessage = messageText.trim();
    if (!userMessage) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // Add 3 second delay for loading effect
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Call AI chat API
      const response = await recipeService.chatWithAI(userMessage);

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: '⚠️ Sorry, I encountered an error. Please try again!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (question) => {
    handleSendMessage(question);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: 'Chat cleared! How can I help you with seaweed recipes today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="chat-with-ai">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-title">
            <div className="ai-avatar">🤖</div>
            <div>
              <h2>Chat with AI</h2>
              <p className="ai-status">
                <span className="status-indicator"></span>
                Online and ready to help
              </p>
            </div>
          </div>
          <button className="clear-chat-btn" onClick={handleClearChat}>
            🗑️ Clear
          </button>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="message ai-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble loading-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="suggested-questions">
            <p className="suggestions-label">Try asking:</p>
            <div className="suggestions-list">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => handleSuggestionClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about seaweed recipes..."
              rows="1"
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>
          <p className="input-hint">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;