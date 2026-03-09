// frontend/src/pages/AIRecipeAssistant/AIRecipeAssistant.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartRecommendations from './SmartRecommendations';
import WhatCanICook from './WhatCanICook';
import ChatWithAI from './ChatWithAI';
import './AIRecipeAssistant.css';

const AIRecipeAssistant = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recommendations');

  const tabs = [
    {
      id: 'recommendations',
      label: 'Smart Recommendations',
      icon: '🎯',
      description: 'Get personalized recipe suggestions'
    },
    {
      id: 'ingredients',
      label: 'What Can I Cook?',
      icon: '🥘',
      description: 'Find recipes with your ingredients'
    },
    {
      id: 'chat',
      label: 'Chat with AI',
      icon: '💬',
      description: 'Ask anything about seaweed recipes'
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'recommendations':
        return <SmartRecommendations />;
      case 'ingredients':
        return <WhatCanICook />;
      case 'chat':
        return <ChatWithAI />;
      default:
        return <SmartRecommendations />;
    }
  };

  return (
    <div className="ai-recipe-assistant">
      {/* Header */}
      <header className="ai-assistant-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => navigate('/recipe-dashboard')}
          >
            ← Back to Recipes
          </button>
          <div className="header-title">
            <h1>🤖 AI Recipe Assistant</h1>
            <p>Your intelligent seaweed recipe companion</p>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <div className="tab-content">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="tab-content-container">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AIRecipeAssistant;