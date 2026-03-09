// frontend/src/pages/RecipeDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import recipeService from '../services/recipeService';
import RecipeCard from '../components/recipes/RecipeCard';
import Loading from '../components/common/Loading';
import './RecipeDashboard.css';
import heroImage from '../assets/images/hero-seaweed.jpg';

const RecipeDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSeaweed, setSelectedSeaweed] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Seaweed types
  const seaweedTypes = ['Kappaphycus Alvarezii', 'Gracilaria Edulis'];
  
  // Categories
  const categories = [
    'Breakfast', 'Main Dish', 'Side Dish', 'Soup', 'Salad', 'Snack', 'Dessert', 'Beverage', 'Appetizer'
  ];

  // Fetch all recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Apply filters when recipes or filter values change
  useEffect(() => {
    applyFilters();
  }, [recipes, selectedSeaweed, selectedCategory, searchQuery]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getAllRecipes();
      setRecipes(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    // Filter by seaweed type
    if (selectedSeaweed !== 'all') {
      filtered = filtered.filter(r => r.seaweedType === selectedSeaweed);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.recipeName.toLowerCase().includes(query) ||
        r.ingredients.toLowerCase().includes(query)
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <Loading message="Loading delicious seaweed recipes..." />;
  }

  return (
    <div className="recipe-dashboard">
      {/* Hero Header */}
      <header className="dashboard-header">
        <div className="header-background-image" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="header-overlay" />
        
        <div className="header-content">
          <div className="header-left">
            <h1>Discover Nutritious Seaweed Recipes</h1>
            <p>
              Explore delicious and healthy recipes featuring Kappaphycus Alvarezii and Gracilaria Edulis seaweeds
            </p>
            
            {/* Hero Search */}
            <div className="hero-search">
              <input
                type="text"
                placeholder="Search recipes, ingredients, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <button 
              className="ai-assistant-btn"
              onClick={() => navigate('/ai-recipe-assistant')}
            >
              🤖 AI Recipe Assistant
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Filters Section */}
        <div className="filters-section">
          <span className="filter-label">
            <span>🔍</span>
            Filter by:
          </span>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedSeaweed === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedSeaweed('all')}
            >
              All Recipes
            </button>
            <button 
              className={`filter-btn ${selectedSeaweed === 'Kappaphycus Alvarezii' ? 'active' : ''}`}
              onClick={() => setSelectedSeaweed('Kappaphycus Alvarezii')}
            >
               Kappaphycus Alvarezii
            </button>
            <button 
              className={`filter-btn ${selectedSeaweed === 'Gracilaria Edulis' ? 'active' : ''}`}
              onClick={() => setSelectedSeaweed('Gracilaria Edulis')}
            >
               Gracilaria Edulis
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {selectedSeaweed !== 'all' && (
          <div className="filters-section">
            <span className="filter-label">
              <span>🍽️</span>
              Category:
            </span>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="results-header">
          <h2>
            Showing {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={fetchRecipes}>Try Again</button>
          </div>
        )}

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="recipes-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe._id} 
                recipe={recipe}
                showScore={false}
              />
            ))}
          </div>
        ) : (
          <div className="no-recipes">
            <p>😔 No recipes found matching your filters.</p>
            <button onClick={() => {
              setSelectedSeaweed('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDashboard;