// frontend/src/pages/AIRecipeAssistant/WhatCanICook.js
import React, { useState } from 'react';
import recipeService from '../../services/recipeService';
import RecipeCard from '../../components/recipes/RecipeCard';
import Loading from '../../components/common/Loading';

const WhatCanICook = () => {
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [seaweedType, setSeaweedType] = useState('');
  const [category, setCategory] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const seaweedTypes = ['Kappaphycus Alvarezii', 'Gracilaria Edulis'];
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

  // Common ingredients for quick add
  const commonIngredients = [
    'tomato', 'onion', 'garlic', 'ginger', 'coconut', 
    'lime', 'soy sauce', 'sesame oil', 'rice', 'noodles'
  ];

  const handleAddIngredient = () => {
    const ingredient = currentIngredient.trim();
    if (ingredient && !ingredients.includes(ingredient.toLowerCase())) {
      setIngredients([...ingredients, ingredient.toLowerCase()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleQuickAdd = (ingredient) => {
    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleFindRecipes = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const data = {
        ingredients,
        seaweedType: seaweedType || undefined,
        category: category || undefined
      };

      const response = await recipeService.suggestByIngredients(data);

      if (response.success) {
        setSuggestions(response.suggestions || []);
      } else {
        setError(response.message || 'Failed to find recipes');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIngredients([]);
    setCurrentIngredient('');
    setSeaweedType('');
    setCategory('');
    setSuggestions([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="what-can-i-cook">
      <div className="cook-container">
        {/* Input Form */}
        <div className="ingredients-form">
          <h2>🥘 What's in your kitchen?</h2>
          <p className="form-subtitle">
            Tell us what ingredients you have, and we'll find recipes for you!
          </p>

          {/* Add Ingredient */}
          <div className="form-group">
            <label>Add Ingredients</label>
            <div className="ingredient-input-group">
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., tomato, garlic, coconut..."
              />
              <button 
                className="btn-add"
                onClick={handleAddIngredient}
                disabled={!currentIngredient.trim()}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="quick-add-section">
            <label>Quick Add Common Ingredients:</label>
            <div className="quick-add-buttons">
              {commonIngredients.map(ing => (
                <button
                  key={ing}
                  className={`quick-add-btn ${ingredients.includes(ing) ? 'added' : ''}`}
                  onClick={() => handleQuickAdd(ing)}
                  disabled={ingredients.includes(ing)}
                >
                  {ingredients.includes(ing) ? '✓' : '+'} {ing}
                </button>
              ))}
            </div>
          </div>

          {/* Current Ingredients List */}
          {ingredients.length > 0 && (
            <div className="ingredients-list">
              <label>Your Ingredients ({ingredients.length}):</label>
              <div className="ingredient-tags">
                {ingredients.map((ing, index) => (
                  <span key={index} className="ingredient-tag">
                    {ing}
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveIngredient(ing)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Optional Filters */}
          <div className="optional-filters">
            <h3>Optional Filters</h3>
            
            <div className="form-group">
              <label>Seaweed Type</label>
              <select
                value={seaweedType}
                onChange={(e) => setSeaweedType(e.target.value)}
              >
                <option value="">Any type</option>
                {seaweedTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Any category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleFindRecipes}
              disabled={loading || ingredients.length === 0}
            >
              {loading ? 'Searching...' : '🔍 Find Recipes'}
            </button>
            <button 
              className="btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}
        </div>

        {/* Results */}
        <div className="suggestions-results">
          {loading ? (
            <Loading message="Finding recipes with your ingredients..." />
          ) : suggestions.length > 0 ? (
            <>
              <div className="results-header">
                <h2> We found {suggestions.length} recipe{suggestions.length !== 1 ? 's' : ''}!</h2>
                <p>Recipes you can make with your ingredients</p>
              </div>
              <div className="recipes-list">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="match-info">
                      <div className="match-percentage">
                        <div 
                          className="match-circle"
                          style={{
                            background: `conic-gradient(#00897b ${suggestion.matchPercentage * 3.6}deg, #e5e7eb 0deg)`
                          }}
                        >
                          <div className="match-inner">
                            {suggestion.matchPercentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="match-details">
                        <p className="match-count">
                          ✓ {suggestion.matchCount} matching ingredient{suggestion.matchCount !== 1 ? 's' : ''}
                        </p>
                        {suggestion.missingIngredients.length > 0 && (
                          <p className="missing-ingredients">
                            Missing: {suggestion.missingIngredients.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <RecipeCard 
                      recipe={{
                        _id: suggestion.recipeId,
                        recipeName: suggestion.recipeName,
                        seaweedType: suggestion.seaweedType,
                        category: suggestion.category,
                        prepTime: suggestion.prepTime,
                        servings: suggestion.recipe?.servings || '4',
                        calories: suggestion.calories,
                        dietaryRestrictions: suggestion.dietaryRestrictions,
                        ingredients: suggestion.recipe?.ingredients || '',
                        howToMake: suggestion.recipe?.howToMake || '',
                        protein: suggestion.recipe?.protein || '0g',
                        carbohydrates: suggestion.recipe?.carbohydrates || '0g',
                        fiber: suggestion.recipe?.fiber || '0g',
                        fat: suggestion.recipe?.fat || '0g',
                        minerals: suggestion.recipe?.minerals || ''
                      }} 
                      showScore={false} 
                    />
                  </div>
                ))}
              </div>
            </>
          ) : hasSearched ? (
            <div className="no-results">
              <p>😔 No recipes found with those ingredients.</p>
              <p>Try adding more ingredients or removing some filters!</p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🥘</div>
              <h3>Ready to cook something delicious?</h3>
              <p>Add your available ingredients and discover recipes you can make right now!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatCanICook;