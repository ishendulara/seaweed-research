// frontend/src/pages/RecipeDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import recipeService from '../services/recipeService';
import Loading from '../components/common/Loading';
import './RecipeDetails.css';

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [recipe, setRecipe] = useState(location.state?.recipe || null);
  const [loading, setLoading] = useState(!recipe);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!recipe) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getRecipeById(id);
      setRecipe(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseIngredients = (ingredientsStr) => {
    if (!ingredientsStr) return [];
    
    let ingredients = [];
    
    if (ingredientsStr.match(/\d+\./)) {
      ingredients = ingredientsStr
        .split(/\d+\./)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    else if (ingredientsStr.includes('\n')) {
      ingredients = ingredientsStr
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    else {
      ingredients = ingredientsStr
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    return ingredients;
  };

  const parseInstructions = (instructionsStr) => {
    if (!instructionsStr) return [];
    
    let steps = [];
    
    if (instructionsStr.match(/\d+\.|Step\s+\d+/i)) {
      steps = instructionsStr
        .split(/(?:\d+\.|Step\s+\d+:?\s*)/i)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    else if (instructionsStr.includes('\n')) {
      steps = instructionsStr
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    else {
      const sentences = instructionsStr.match(/[^.!?]+[.!?]+/g) || [instructionsStr];
      steps = sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    return steps;
  };

  const parseVitaminsMinerals = (mineralsStr) => {
    if (!mineralsStr) return { vitamins: [], minerals: [] };
    
    const vitamins = [];
    const minerals = [];
    
    const vitaminPatterns = ['Vitamin A', 'Vitamin C', 'Vitamin K', 'B-Complex', 'Vitamin E', 'Vitamin D'];
    const mineralPatterns = ['Iodine', 'Iron', 'Calcium', 'Magnesium', 'Potassium', 'Zinc', 'Selenium'];
    
    vitaminPatterns.forEach(vit => {
      if (mineralsStr.toLowerCase().includes(vit.toLowerCase())) {
        vitamins.push(vit);
      }
    });
    
    mineralPatterns.forEach(min => {
      if (mineralsStr.toLowerCase().includes(min.toLowerCase())) {
        minerals.push(min);
      }
    });
    
    return { vitamins, minerals };
  };

  if (loading) return <Loading message="Loading recipe details..." />;
  if (error) {
    return (
      <div className="error-page">
        <p>⚠️ Error: {error}</p>
        <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
      </div>
    );
  }
  if (!recipe) {
    return (
      <div className="error-page">
        <p>😔 Recipe not found</p>
        <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
      </div>
    );
  }

  const ingredients = parseIngredients(recipe.ingredients);
  const instructions = parseInstructions(recipe.howToMake);
  const { vitamins, minerals } = parseVitaminsMinerals(recipe.minerals);

  return (
    <div className="recipe-details-wrapper">
      {/* Hero Image with Blur Effect */}
      <div className="hero-image-section">
        {recipe.image && (
          <img 
            src={recipe.image} 
            alt={recipe.recipeName}
            className="hero-bg-image"
          />
        )}
        <div className="hero-blur-overlay"></div>
      </div>

      {/* Floating Action Buttons */}
      <button onClick={() => navigate(-1)} className="floating-back-btn">
        ← Back
      </button>

      <button 
        className="floating-favorite-btn"
        onClick={() => setIsFavorite(!isFavorite)}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      {/* Main Content Card */}
      <div className="content-wrapper">
        <div className="main-content-card">
          {/* Header Section */}
          <div className="recipe-header">
            <span className="seaweed-badge">
               {recipe.seaweedType}
            </span>
            
            <h1 className="main-title">{recipe.recipeName}</h1>
            
            <p className="recipe-intro">
              {recipe.description || `A refreshing and nutritious ${recipe.category.toLowerCase()} featuring tender ${recipe.seaweedType} seaweed with a zesty citrus dressing.`}
            </p>

            {/* Meta Information */}
            <div className="meta-info-row">
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span className="meta-text">{recipe.prepTime}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span className="meta-text">{recipe.servings}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🔥</span>
                <span className="meta-text">Easy</span>
              </div>
            </div>

            {/* Tags */}
            <div className="tags-row">
              <span className="tag">{recipe.category}</span>
              <span className="tag">{recipe.dietaryRestrictions}</span>
              <span className="tag">{recipe.calories}</span>
              {/* <span className="tag">Quick</span> */}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="two-column-layout">
            {/* Ingredients Section */}
            <div className="ingredients-section">
              <div className="section-title">
                <span className="title-icon">🥗</span>
                <h2>Ingredients</h2>
              </div>
              <ul className="ingredients-listing">
                {ingredients.map((ing, i) => (
                  <li key={i} className="ingredient-row">
                    <span className="ingredient-text">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preparation Steps Section */}
            <div className="preparation-section">
              <div className="section-title">
                <span className="title-icon">👨‍🍳</span>
                <h2>Preparation Steps</h2>
              </div>
              <div className="steps-list">
                {instructions.map((step, i) => (
                  <div key={i} className="step-item">
                    <div className="step-number">{i + 1}</div>
                    <p className="step-description">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="nutrition-section">
            <div className="section-title">
              <span className="title-icon"></span>
              <h2>Nutritional Information</h2>
            </div>
            
            <div className="nutrition-grid">
              <div className="nutrition-box">
                <p className="nutrition-number">{recipe.calories}</p>
                <p className="nutrition-name">Calories</p>
              </div>
              <div className="nutrition-box">
                <p className="nutrition-number">{recipe.protein}</p>
                <p className="nutrition-name">Protein</p>
              </div>
              <div className="nutrition-box">
                <p className="nutrition-number">{recipe.carbohydrates}</p>
                <p className="nutrition-name">Carbs</p>
              </div>
              <div className="nutrition-box">
                <p className="nutrition-number">{recipe.fat}</p>
                <p className="nutrition-name">Fat</p>
              </div>
            </div>

            {/* Vitamins & Minerals */}
            {(vitamins.length > 0 || minerals.length > 0) && (
              <div className="vitamins-minerals-wrapper">
                {vitamins.length > 0 && (
                  <div className="vm-group">
                    <h3 className="vm-title">Vitamins</h3>
                    <div className="vm-tags">
                      {vitamins.map((vit, i) => (
                        <span key={i} className="vm-tag vitamin-tag">{vit}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {minerals.length > 0 && (
                  <div className="vm-group">
                    <h3 className="vm-title">Minerals</h3>
                    <div className="vm-tags">
                      {minerals.map((min, i) => (
                        <span key={i} className="vm-tag mineral-tag">{min}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;