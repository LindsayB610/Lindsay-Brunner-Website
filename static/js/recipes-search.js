(function() {
  'use strict';

  // Configuration
  const INDEX_URL = '/recipes/index.json';
  const STORAGE_KEY = 'recipes-search-index';
  const DEBOUNCE_DELAY = 200;

  // Fuse.js configuration
  const FUSE_OPTIONS = {
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 3 },
      { name: 'description', weight: 2 },
      { name: 'subtitle', weight: 2 },
      { name: 'recipeCategory', weight: 1.5 },
      { name: 'recipeCuisine', weight: 1.5 },
      { name: 'recipeIngredient', weight: 1 }
    ]
  };

  // DOM elements
  const searchInput = document.getElementById('recipe-search-input');
  const clearButton = document.getElementById('recipe-search-clear');
  const resultsCount = document.getElementById('recipe-search-results-count');
  const emptyState = document.getElementById('recipe-search-empty');
  const recipesList = document.getElementById('recipes-list');

  if (!searchInput || !clearButton || !resultsCount || !emptyState || !recipesList) {
    // Missing required elements, exit silently (progressive enhancement)
    return;
  }

  // Check if Fuse.js is available
  if (typeof Fuse === 'undefined') {
    console.warn('Fuse.js not loaded, search will not work');
    return;
  }

  let fuse = null;
  let allRecipes = [];
  let allRecipeElements = [];
  let debounceTimer = null;

  // Initialize: cache recipe elements
  function initRecipeElements() {
    const articles = recipesList.querySelectorAll('article.featured-post');
    allRecipeElements = Array.from(articles).map(article => {
      const link = article.querySelector('h2 a');
      const href = link ? link.getAttribute('href') : null;
      return { element: article, href: href };
    });
  }

  // Fetch and cache index
  async function loadIndex() {
    // Try sessionStorage first
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is recent (less than 1 hour old)
        if (data.timestamp && Date.now() - data.timestamp < 3600000) {
          return data.recipes;
        }
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    // Fetch from server
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe index');
      }
      const recipes = await response.json();

      // Process recipes: join ingredient arrays for search
      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        recipeIngredient: Array.isArray(recipe.recipeIngredient)
          ? recipe.recipeIngredient.join(' ')
          : ''
      }));

      // Cache in sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipes: processedRecipes,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Ignore sessionStorage errors
      }

      return processedRecipes;
    } catch (error) {
      console.error('Error loading recipe index:', error);
      return [];
    }
  }

  // Initialize search
  async function initSearch() {
    try {
      initRecipeElements();
      allRecipes = await loadIndex();

      if (allRecipes.length === 0) {
        console.warn('No recipes found in search index');
        return;
      }

      // Initialize Fuse.js
      fuse = new Fuse(allRecipes, FUSE_OPTIONS);
      console.log(`Recipe search initialized with ${allRecipes.length} recipes`);
    } catch (error) {
      console.error('Error initializing recipe search:', error);
    }
  }

  // Perform search
  function performSearch(query) {
    if (!fuse || !query.trim()) {
      showAllRecipes();
      return;
    }

    const results = fuse.search(query.trim());
    const matchedRecipes = results.map(result => result.item);
    const matchedPermalinks = new Set(matchedRecipes.map(r => r.permalink));

    // Show/hide recipe elements
    let visibleCount = 0;
    allRecipeElements.forEach(({ element, href }) => {
      if (href && matchedPermalinks.has(href)) {
        element.style.display = '';
        visibleCount++;
      } else {
        element.style.display = 'none';
      }
    });

    // Update UI
    if (visibleCount === 0) {
      emptyState.style.display = 'block';
      resultsCount.textContent = '';
    } else {
      emptyState.style.display = 'none';
      const countText = visibleCount === 1 ? 'recipe' : 'recipes';
      resultsCount.textContent = `${visibleCount} ${countText} found`;
    }
  }

  // Show all recipes
  function showAllRecipes() {
    allRecipeElements.forEach(({ element }) => {
      element.style.display = '';
    });
    emptyState.style.display = 'none';
    resultsCount.textContent = '';
  }

  // Event handlers
  function handleSearchInput(query) {
    if (query.trim()) {
      clearButton.style.display = '';
      // Clear any pending debounce
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      // Debounce the search
      debounceTimer = setTimeout(() => {
        performSearch(query);
      }, DEBOUNCE_DELAY);
    } else {
      clearButton.style.display = 'none';
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      showAllRecipes();
    }
  }

  searchInput.addEventListener('input', (e) => {
    handleSearchInput(e.target.value);
  });

  // Handle Enter key to search immediately (prevent any form submission)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = e.target.value;
      // Cancel any pending debounced search
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      // Search immediately
      if (query.trim()) {
        performSearch(query);
      } else {
        showAllRecipes();
      }
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    showAllRecipes();
    searchInput.focus();
  });

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
