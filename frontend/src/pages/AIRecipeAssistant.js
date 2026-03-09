// frontend/src/pages/AIRecipeAssistant.js - Complete with Free AI
import React, { useState, useEffect } from 'react';
import './AIRecipeAssistant.css';

const AIRecipeAssistant = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recommendations state
  const [preferences, setPreferences] = useState({
    seaweedType: '',
    dietaryRestrictions: [],
    preferredMealType: 'any',
    healthGoals: [],
    skillLevel: 'any'
  });
  const [recommendations, setRecommendations] = useState([]);

  // Ingredients state
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const API_BASE = 'http://localhost:5001/api/recipes';
  const token = localStorage.getItem('token');

  const seaweedTypes = ['Kappaphycus Alvarezii', 'Gracilaria Edulis'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb'];
  const healthGoalOptions = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Immunity Boost', 'Energy Boost'];

  // Get AI Recommendations (FREE)
  const getAIRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/free-ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to get AI recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get ingredient-based suggestions (FREE)
  const getSuggestionsByIngredients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/free-ai/suggest-by-ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ingredients: availableIngredients,
          seaweedType: preferences.seaweedType
        })
      });

      const data = await response.json();

      if (data.success) {
        setIngredientSuggestions(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to get suggestions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Chat with AI (FREE)
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: chatInput
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/free-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: chatInput
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.message
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim() && !availableIngredients.includes(ingredientInput.trim())) {
      setAvailableIngredients(prev => [...prev, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient) => {
    setAvailableIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const togglePreference = (key, value) => {
    setPreferences(prev => {
      const currentArray = prev[key];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  return (
    <div className="ai-recipe-assistant">
      <div className="ai-container">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header-content">
            <div className="ai-header-icon">🧠</div>
            <div className="ai-header-text">
              <h1>AI Recipe Assistant</h1>
              <p>FREE - Powered by machine learning • No API keys required</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="ai-tabs">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`ai-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            >
              ✨ Smart Recommendations
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`ai-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
            >
              🥘 What Can I Cook?
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
            >
              💬 Chat with AI
            </button>
          </div>
        </div>

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="ai-tab-content">
            <div className="ai-card">
              <h2>Tell us your preferences</h2>
              
              {/* Seaweed Type */}
              <div className="preference-group">
                <label>Seaweed Type</label>
                <div className="button-group">
                  {seaweedTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setPreferences(prev => ({ ...prev, seaweedType: type }))}
                      className={`pref-btn ${preferences.seaweedType === type ? 'active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="preference-group">
                <label>Dietary Restrictions</label>
                <div className="button-group wrap">
                  {dietaryOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => togglePreference('dietaryRestrictions', option)}
                      className={`pref-btn ${preferences.dietaryRestrictions.includes(option) ? 'active' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Goals */}
              <div className="preference-group">
                <label>Health Goals</label>
                <div className="button-group wrap">
                  {healthGoalOptions.map(goal => (
                    <button
                      key={goal}
                      onClick={() => togglePreference('healthGoals', goal)}
                      className={`pref-btn ${preferences.healthGoals.includes(goal) ? 'active' : ''}`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={getAIRecommendations}
                disabled={loading}
                className="ai-submit-btn"
              >
                {loading ? '⏳ Generating...' : '✨ Get AI Recommendations'}
              </button>
            </div>

            {/* Recommendations Results */}
            {recommendations.length > 0 && (
              <div className="ai-card results">
                <h3 className="results-title">⭐ Your Personalized Recommendations</h3>
                
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <div className="rec-header">
                        <div>
                          <h4>{rec.recipe_name}</h4>
                          <p className="rec-score">Match Score: {rec.final_score?.toFixed(0) || '0'}%</p>
                        </div>
                        <div className="rec-rank">#{index + 1}</div>
                      </div>
                      
                      <p className="rec-reason">{rec.reason}</p>
                      
                      {rec.health_benefits && rec.health_benefits.length > 0 && (
                        <div className="rec-benefits">
                          {rec.health_benefits.map((benefit, i) => (
                            <span key={i} className="benefit-tag">✓ {benefit}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <div className="ai-tab-content">
            <div className="ai-card">
              <h2>What ingredients do you have?</h2>
              
              <div className="ingredient-input-group">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  placeholder="e.g., coconut milk, garlic, onions..."
                  className="ingredient-input"
                />
                <button onClick={addIngredient} className="add-btn">
                  Add
                </button>
              </div>

              {availableIngredients.length > 0 && (
                <div className="ingredients-list">
                  {availableIngredients.map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">
                      {ingredient}
                      <button onClick={() => removeIngredient(ingredient)} className="remove-btn">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={getSuggestionsByIngredients}
                disabled={loading || availableIngredients.length === 0}
                className="ai-submit-btn"
              >
                {loading ? '⏳ Finding Recipes...' : '🔍 Find Recipes I Can Make'}
              </button>
            </div>

            {/* Ingredient Suggestions */}
            {ingredientSuggestions.length > 0 && (
              <div className="ai-card results">
                <h3 className="results-title">Recipes You Can Make</h3>
                
                <div className="recommendations-list">
                  {ingredientSuggestions.map((suggestion, index) => (
                    <div key={index} className="recommendation-card">
                      <div className="rec-header">
                        <div>
                          <h4>{suggestion.recipe_name}</h4>
                          <p className="rec-score">Match: {suggestion.match_percentage?.toFixed(0)}%</p>
                        </div>
                        <div className="rec-rank">📊</div>
                      </div>
                      
                      <p className="rec-reason">{suggestion.reason}</p>
                      
                      {suggestion.missing_ingredients && suggestion.missing_ingredients.length > 0 && (
                        <div className="missing-ingredients">
                          <p className="missing-label">Missing ingredients:</p>
                          <div className="rec-benefits">
                            {suggestion.missing_ingredients.map((ing, i) => (
                              <span key={i} className="benefit-tag missing">{ing}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="ai-tab-content">
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">🧠</div>
                    <p>Ask me anything about seaweed recipes!</p>
                    <p className="chat-empty-sub">Try: "What's a good breakfast recipe?" or "How do I cook Gracilaria?"</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.role}`}
                    >
                      <div className="message-bubble">
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="chat-message assistant">
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about recipes, ingredients, nutrition..."
                  className="chat-input"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={loading || !chatInput.trim()}
                  className="send-btn"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecipeAssistant;