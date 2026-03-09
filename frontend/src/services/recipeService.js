// frontend/src/services/recipeService.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/recipes';

// Get auth token from localStorage
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Recipe Service API calls
const recipeService = {
  // Get all recipes
  getAllRecipes: async () => {
    try {
      const response = await axios.get(API_URL, getAuthConfig());
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recipes' };
    }
  },

  // Get recipe by ID
  getRecipeById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recipe' };
    }
  },

  // Get recipes by seaweed type
  getRecipesBySeaweedType: async (type) => {
    try {
      const response = await axios.get(`${API_URL}/seaweed/${type}`, getAuthConfig());
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recipes' };
    }
  },

  // Get seaweed types
  getSeaweedTypes: async () => {
    try {
      const response = await axios.get(`${API_URL}/seaweed-types`, getAuthConfig());
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch seaweed types' };
    }
  },

  // Get random suggestions
  getRandomSuggestions: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_URL}/suggestions/random?limit=${limit}`, getAuthConfig());
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch suggestions' };
    }
  },

  // ========== AI-POWERED ENDPOINTS ==========

  // Get AI recommendations
  getAIRecommendations: async (preferences) => {
    try {
      const response = await axios.post(
        `${API_URL}/free-ai/recommendations`,
        preferences,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get AI recommendations' };
    }
  },

  // Suggest recipes by ingredients
  suggestByIngredients: async (data) => {
    try {
      const response = await axios.post(
        `${API_URL}/free-ai/suggest-by-ingredients`,
        data,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to suggest recipes' };
    }
  },

  // Chat with AI
  chatWithAI: async (message) => {
    try {
      const response = await axios.post(
        `${API_URL}/free-ai/chat`,
        { message },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to chat with AI' };
    }
  }
};

export default recipeService;