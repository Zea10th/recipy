const DEFAULT_CATEGORY = 'Chicken';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// ── Normalisation helpers ────────────────────────────────────────────────────

/**
 * Maps a raw ApiMealSummary item from the list endpoint into an ExternalRecipe.
 * Returns null (and logs a warning) if any required field is missing.
 */
function normaliseMealSummary(apiItem) {
    const { idMeal, strMeal, strMealThumb } = apiItem || {};
    if (!idMeal || !strMeal || !strMealThumb) {
        console.warn('Skipping malformed meal summary item:', apiItem);
        return null;
    }
    return {
        id: idMeal,
        name: strMeal,
        imageUrl: strMealThumb,
        imageAlt: `${strMeal} meal thumbnail`
    };
}

/**
 * Iterates the flat strIngredient1–20 / strMeasure1–20 slots and returns
 * an array of { name, measure } objects, filtering out empty slots.
 */
function extractIngredients(apiItem) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const name = (apiItem[`strIngredient${i}`] || '').trim();
        const measure = (apiItem[`strMeasure${i}`] || '').trim();
        if (name) {
            ingredients.push({ name, measure });
        }
    }
    return ingredients;
}

/**
 * Maps a raw ApiMealDetail item from the lookup endpoint into an ExternalRecipeDetail.
 */
function normaliseMealDetail(apiItem) {
    return {
        id: apiItem.idMeal,
        name: apiItem.strMeal,
        category: apiItem.strCategory || '',
        origin: apiItem.strArea || '',
        instructions: (apiItem.strInstructions || '').trim() || 'Instructions not available.',
        imageUrl: apiItem.strMealThumb || '',
        ingredients: extractIngredients(apiItem)
    };
}

// ── API fetch functions ──────────────────────────────────────────────────────

/**
 * Fetches a list of meals by category from TheMealDB.
 * Returns an array of ExternalRecipe objects (empty array when no results).
 * Throws on network/parse errors.
 */
async function fetchExternalRecipeList(category) {
    const response = await fetch(`${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await response.json();
    if (!data.meals) return [];
    return data.meals
        .map(normaliseMealSummary)
        .filter(item => item !== null);
}

/**
 * Fetches full detail for a single meal by its TheMealDB ID.
 * Returns an ExternalRecipeDetail object, or null when the ID is not found.
 * Throws on network/parse errors.
 */
async function fetchExternalRecipeDetail(id) {
    const response = await fetch(`${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!data.meals) return null;
    return normaliseMealDetail(data.meals[0]);
}

// ── Loading state helpers ────────────────────────────────────────────────────

function showLoadingSpinner(container) {
    container.innerHTML = `
        <div class="external-loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`;
}

function hideLoadingSpinner(container) {
    const spinner = container.querySelector('.external-loading');
    if (spinner) spinner.remove();
}

// ── Render functions ─────────────────────────────────────────────────────────

function createExternalRecipeCardHtml(recipe) {
    return `
        <div class="col">
            <article class="recipe-card card h-100"
                     data-external-id="${recipe.id}"
                     tabindex="0"
                     role="button"
                     aria-label="View details for ${recipe.name}">
                <div class="recipe-card__image-wrap">
                    <img class="recipe-card__image card-img-top"
                         src="${recipe.imageUrl}"
                         alt="${recipe.imageAlt}">
                    <div class="recipe-card__overlay" aria-hidden="true">
                        <span>${recipe.name}</span>
                    </div>
                </div>
                <div class="recipe-card__body card-body d-flex flex-column">
                    <h3 class="recipe-card__title">${recipe.name}</h3>
                    <button class="btn btn-primary mt-auto">
                        View Recipe
                    </button>
                </div>
            </article>
        </div>`;
}

function renderExternalRecipes(recipes, container) {
    if (recipes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-4">No recipes found for this category.</p>';
        return;
    }
    container.innerHTML = recipes.map(createExternalRecipeCardHtml).join('');
    wireExternalCardListeners();
}

function showExternalRecipesError(container, error) {
    console.error('Failed to load external recipes:', error);
    container.innerHTML = '<p class="external-recipe-error text-center py-4">Could not load external recipes. Please try again later.</p>';
}

// ── Modal functions ──────────────────────────────────────────────────────────

function populateExternalRecipeModal(detail, modalEl) {
    modalEl.querySelector('#externalModalTitle').textContent = detail.name;

    const img = modalEl.querySelector('#externalModalImage');
    img.src = detail.imageUrl;
    img.alt = `${detail.name} dish`;

    modalEl.querySelector('#externalModalCategory').textContent = detail.category;
    modalEl.querySelector('#externalModalOrigin').textContent = detail.origin ? `${detail.origin} cuisine` : '';

    const ingredientsEl = modalEl.querySelector('#externalModalIngredients');
    if (detail.ingredients.length === 0) {
        ingredientsEl.innerHTML = '<li class="text-muted">Ingredient list not available.</li>';
    } else {
        ingredientsEl.innerHTML = detail.ingredients
            .map(ing => `<li class="mb-1">• ${ing.measure ? ing.measure + ' ' : ''}${ing.name}</li>`)
            .join('');
    }

    modalEl.querySelector('#externalModalInstructions').textContent = detail.instructions;
}

function showExternalRecipeModalError(modalEl, error) {
    console.error('Failed to load external recipe detail:', error);
    modalEl.querySelector('#externalModalBody').innerHTML =
        '<p class="text-muted text-center py-4">Could not load recipe details. Please try again.</p>';
}

async function openExternalRecipeModal(id) {
    const modalEl = document.getElementById('externalRecipeDetailModal');
    if (!modalEl) return;

    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();

    const modalBody = modalEl.querySelector('#externalModalBody');

    // Prepend spinner without wiping the body's named elements — innerHTML= would
    // destroy #externalModalImage etc. that populateExternalRecipeModal needs.
    const spinner = document.createElement('div');
    spinner.className = 'external-loading';
    spinner.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
    modalBody.prepend(spinner);

    try {
        const detail = await fetchExternalRecipeDetail(id);
        spinner.remove();
        if (!detail) {
            modalBody.innerHTML = '<p class="text-muted text-center py-4">Recipe details not available.</p>';
            return;
        }
        populateExternalRecipeModal(detail, modalEl);
    } catch (error) {
        spinner.remove();
        showExternalRecipeModalError(modalEl, error);
    }
}

// ── Event wiring ─────────────────────────────────────────────────────────────

function wireExternalCardListeners() {
    document.querySelectorAll('[data-external-id]').forEach(el => {
        el.addEventListener('click', () => openExternalRecipeModal(el.dataset.externalId));
        el.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                openExternalRecipeModal(el.dataset.externalId);
            } else if (event.key === ' ') {
                event.preventDefault();
                openExternalRecipeModal(el.dataset.externalId);
            }
        });
    });
}

// ── Initialisation ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('external-recipe-container');
    if (!container) return;

    showLoadingSpinner(container);

    try {
        const recipes = await fetchExternalRecipeList(DEFAULT_CATEGORY);
        hideLoadingSpinner(container);
        renderExternalRecipes(recipes, container);
    } catch (error) {
        hideLoadingSpinner(container);
        showExternalRecipesError(container, error);
    }
});
