// frontend/src/pages/AIRecipeAssistant/SmartRecommendations.js
import React, { useState } from 'react';
import recipeService from '../../services/recipeService';
import RecipeCard from '../../components/recipes/RecipeCard';
import Loading from '../../components/common/Loading';

const SmartRecommendations = () => {
  const [preferences, setPreferences] = useState({
    seaweedType: '',
    dietaryRestrictions: [],
    healthGoals: [],
    preferredMealType: 'any',
    skillLevel: 'intermediate'
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Options
  const seaweedTypes = ['Kappaphycus Alvarezii', 'Gracilaria Edulis'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Dairy-Free', 'Gluten-Free'];
  const healthGoalOptions = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Energy Boost'];
  const mealTypes = ['any', 'Breakfast', 'Main Dish', 'Side Dish', 'Soup', 'Salad', 'Snack', 'Dessert', 'Beverage'];
  const skillLevels = ['beginner', 'intermediate', 'advanced'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (category, value) => {
    setPreferences(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleGetRecommendations = async () => {
    if (!preferences.seaweedType) {
      setError('Please select a seaweed type');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await recipeService.getAIRecommendations(preferences);
      
      if (response.success) {
        setRecommendations(response.data || []);
      } else {
        setError(response.message || 'Failed to get recommendations');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences({
      seaweedType: '',
      dietaryRestrictions: [],
      healthGoals: [],
      preferredMealType: 'any',
      skillLevel: 'intermediate'
    });
    setRecommendations([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="smart-recommendations">
      <div className="recommendations-container">
        {/* Preferences Form */}
        <div className="preferences-form">
          <h2>🎯 Tell us your preferences</h2>
          <p className="form-subtitle">
            Help us find the perfect seaweed recipes for you
          </p>

          {/* Seaweed Type */}
          <div className="form-group">
            <label>Seaweed Type *</label>
            <select
              name="seaweedType"
              value={preferences.seaweedType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select seaweed type</option>
              {seaweedTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div className="form-group">
            <label>Dietary Restrictions</label>
            <div className="checkbox-group">
              {dietaryOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.dietaryRestrictions.includes(option)}
                    onChange={() => handleMultiSelect('dietaryRestrictions', option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Health Goals */}
          <div className="form-group">
            <label>Health Goals</label>
            <div className="checkbox-group">
              {healthGoalOptions.map(goal => (
                <label key={goal} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.healthGoals.includes(goal)}
                    onChange={() => handleMultiSelect('healthGoals', goal)}
                  />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Meal Type */}
          <div className="form-group">
            <label>Preferred Meal Type</label>
            <select
              name="preferredMealType"
              value={preferences.preferredMealType}
              onChange={handleInputChange}
            >
              {mealTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Level */}
          <div className="form-group">
            <label>Cooking Skill Level</label>
            <div className="radio-group">
              {skillLevels.map(level => (
                <label key={level} className="radio-label">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level}
                    checked={preferences.skillLevel === level}
                    onChange={handleInputChange}
                  />
                  <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleGetRecommendations}
              disabled={loading || !preferences.seaweedType}
            >
              {loading ? 'Finding recipes...' : '🔍 Get Recommendations'}
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
        <div className="recommendations-results">
          {loading ? (
            <Loading message="AI is finding perfect recipes for you..." />
          ) : recommendations.length > 0 ? (
            <>
              <div className="results-header">
                <h2> Your Personalized Recommendations</h2>
                <p>{recommendations.length} recipes matched your preferences</p>
              </div>
              <div className="recipes-grid">
                {recommendations.map((recipe, index) => (
                  <RecipeCard 
                    key={index} 
                    recipe={recipe}
                    showScore={true}
                  />
                ))}
              </div>
            </>
          ) : hasSearched ? (
            <div className="no-results">
              <p>😔 No recipes found matching your preferences.</p>
              <p>Try adjusting your filters!</p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>Ready to discover amazing recipes?</h3>
              <p>Fill in your preferences and let our AI find the perfect match for you!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;