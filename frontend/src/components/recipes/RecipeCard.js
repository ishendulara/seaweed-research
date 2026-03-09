// frontend/src/components/recipes/RecipeCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecipeCard.css';

// Import images
import kappaphycusImage from '../../assets/images/kappaphycus-recipe.jpg';
import gracilariaImage from '../../assets/images/gracilaria-recipe.webp';

const RecipeCard = ({ recipe, showScore = false }) => {
  const navigate = useNavigate();

  // const handleCardClick = () => {
  //   navigate(`/recipe/${recipe._id}`, { state: { recipe } });
  // };
  const handleCardClick = () => {
    navigate(`/recipe/${recipe._id}`, { 
      state: { 
        recipe: {
          ...recipe,
          image: getRecipeImage(recipe.seaweedType) // image add
        }
      } 
    });
  };

  const getDifficultyLevel = (prepTime) => {
    if (!prepTime) return 'Easy';
    const time = parseInt(prepTime);
    if (time <= 30) return 'Easy';
    if (time <= 60) return 'Medium';
    return 'Hard';
  };

  // Get image based on seaweed type
  const getRecipeImage = (seaweedType) => {
    if (seaweedType?.includes('Kappaphycus')) {
      return kappaphycusImage;
    } else if (seaweedType?.includes('Gracilaria')) {
      return gracilariaImage;
    }
    return kappaphycusImage; // Default fallback
  };

  // Get seaweed badge name
  const getSeaweedBadge = (seaweedType) => {
    if (seaweedType?.includes('Kappaphycus')) return 'Kappaphycus';
    if (seaweedType?.includes('Gracilaria')) return 'Gracilaria';
    return 'Seaweed';
  };

  return (
    <div className="recipe-card" onClick={handleCardClick}>
      {/* Recipe Image */}
      <div className="recipe-image-container">
        <img 
          src={getRecipeImage(recipe.seaweedType)} 
          alt={recipe.recipeName}
          className="recipe-image"
        />
        
        {/* Seaweed Type Badge */}
        <div className="seaweed-type-badge">
          {getSeaweedBadge(recipe.seaweedType)}
        </div>

        {/* Favorite Button */}
        <button 
          className="favorite-btn"
          onClick={(e) => {
            e.stopPropagation();
            // Add favorite functionality here
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🤍</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.recipeName}</h3>
        
        <p className="recipe-card-description">
          {recipe.howToMake?.split('.')[0]?.slice(0, 100) || 'A delicious seaweed recipe'}...
        </p>

        {/* Meta Information */}
        <div className="recipe-card-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{recipe.prepTime || '30 mins'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🍽️</span>
            <span>{recipe.servings || '4'} servings</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon"></span>
            <span className={`difficulty-badge ${getDifficultyLevel(recipe.prepTime)}`}>
              {getDifficultyLevel(recipe.prepTime)}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="recipe-card-tags">
          {recipe.category && (
            <span className="recipe-tag">{recipe.category}</span>
          )}
          {recipe.dietaryRestrictions && (
            <span className="recipe-tag">{recipe.dietaryRestrictions}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;