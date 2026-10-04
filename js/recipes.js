const RECIPES = [
    {
        id: 1,
        name: 'Spaghetti Carbonara',
        category: 'Italian',
        tags: ['Quick', 'Pasta'],
        mealTypes: ['dinner', 'lunch'],
        activePrepTime: 20,
        totalTime: 25,
        difficulty: 'Easy',
        calories: 520,
        description: 'Classic Roman pasta made with eggs, Pecorino Romano, guanciale, and black pepper — no cream required.',
        ingredients: [
            '400 g spaghetti',
            '150 g guanciale or pancetta',
            '4 egg yolks + 1 whole egg',
            '80 g Pecorino Romano, finely grated',
            'Freshly cracked black pepper',
            'Salt for pasta water'
        ],
        imageUrl: 'https://placehold.co/600x400/e76f51/ffffff?text=Spaghetti+Carbonara',
        imageAlt: 'A bowl of spaghetti carbonara with crispy guanciale and a dusting of black pepper'
    },
    {
        id: 2,
        name: 'Thai Green Curry',
        category: 'Thai',
        tags: ['Vegetarian', 'Spicy'],
        mealTypes: ['dinner', 'lunch'],
        activePrepTime: 15,
        totalTime: 35,
        difficulty: 'Medium',
        calories: 410,
        description: 'Aromatic green curry with coconut milk, Thai basil, and your choice of vegetables or chicken.',
        ingredients: [
            '400 ml coconut milk',
            '2 tbsp green curry paste',
            '300 g mixed vegetables or chicken',
            'Thai basil leaves',
            '1 stalk lemongrass',
            '2 kaffir lime leaves',
            'Fish sauce or soy sauce to taste'
        ],
        imageUrl: 'https://placehold.co/600x400/2a9d8f/ffffff?text=Thai+Green+Curry',
        imageAlt: 'A bowl of fragrant Thai green curry with coconut milk and fresh basil'
    },
    {
        id: 3,
        name: 'Avocado Toast',
        category: 'American',
        tags: ['Vegan', 'Breakfast'],
        mealTypes: ['breakfast', 'snack'],
        activePrepTime: 5,
        totalTime: 5,
        difficulty: 'Easy',
        calories: 280,
        description: 'Creamy smashed avocado on toasted sourdough with lemon, chilli flakes, and sea salt.',
        ingredients: [
            '2 slices sourdough bread',
            '1 ripe avocado',
            '1 tbsp lemon juice',
            'Chilli flakes',
            'Sea salt and black pepper',
            'Optional: poached egg'
        ],
        imageUrl: 'https://placehold.co/600x400/264653/ffffff?text=Avocado+Toast',
        imageAlt: 'Thick-cut sourdough toast topped with smashed avocado and chilli flakes'
    },
    {
        id: 4,
        name: 'Chicken Stir-Fry',
        category: 'Chinese',
        tags: ['Quick', 'High Protein'],
        mealTypes: ['dinner', 'lunch'],
        activePrepTime: 10,
        totalTime: 20,
        difficulty: 'Easy',
        calories: 380,
        description: 'Tender chicken and crisp vegetables tossed in a savory soy-ginger glaze.',
        ingredients: [
            '400 g chicken breast, sliced thin',
            '2 tbsp soy sauce',
            '1 tbsp fresh ginger, grated',
            '2 garlic cloves, minced',
            '1 tbsp sesame oil',
            '300 g mixed stir-fry vegetables',
            '1 tsp cornstarch'
        ],
        imageUrl: 'https://placehold.co/600x400/f4a261/ffffff?text=Chicken+Stir-Fry',
        imageAlt: 'Wok-tossed chicken and colourful vegetables in a glossy soy-ginger sauce'
    },
    {
        id: 5,
        name: 'Mushroom Risotto',
        category: 'Italian',
        tags: ['Vegetarian', 'Comfort Food'],
        mealTypes: ['dinner', 'lunch'],
        activePrepTime: 30,
        totalTime: 40,
        difficulty: 'Medium',
        calories: 460,
        description: 'Silky, slow-stirred risotto packed with mixed mushrooms and finished with parmesan.',
        ingredients: [
            '300 g Arborio rice',
            '400 g mixed mushrooms',
            '1 L warm vegetable stock',
            '1 onion, finely diced',
            '120 ml dry white wine',
            '60 g parmesan, grated',
            '2 tbsp unsalted butter',
            'Fresh thyme'
        ],
        imageUrl: 'https://placehold.co/600x400/6d4c41/ffffff?text=Mushroom+Risotto',
        imageAlt: 'Creamy mushroom risotto garnished with parmesan and fresh thyme'
    },
    {
        id: 6,
        name: 'Greek Salad',
        category: 'Mediterranean',
        tags: ['Vegetarian', 'Gluten-Free'],
        mealTypes: ['lunch', 'dinner', 'snack'],
        activePrepTime: 10,
        totalTime: 10,
        difficulty: 'Easy',
        calories: 220,
        description: 'Refreshing combination of tomatoes, cucumber, olives, red onion, and creamy feta.',
        ingredients: [
            '3 ripe tomatoes, chopped',
            '1 cucumber, sliced',
            '100 g kalamata olives',
            '1 red onion, thinly sliced',
            '200 g feta cheese',
            '3 tbsp extra-virgin olive oil',
            '1 tsp dried oregano'
        ],
        imageUrl: 'https://placehold.co/600x400/457b9d/ffffff?text=Greek+Salad',
        imageAlt: 'A fresh Greek salad with tomatoes, cucumber, olives, and feta cheese'
    }
];

const MEDIA_ITEMS = [
    {
        title: 'Spaghetti Carbonara Hero',
        category: 'Main Course',
        mediaType: 'Image',
        description: 'High-resolution hero image of the finished carbonara dish.',
        thumbnailUrl: 'https://placehold.co/600x400/e76f51/ffffff?text=Carbonara',
        thumbnailAlt: 'Spaghetti Carbonara hero'
    },
    {
        title: 'Thai Green Curry — Step by Step',
        category: 'Main Course',
        mediaType: 'Video',
        description: '15-minute walkthrough covering curry paste preparation and coconut milk technique.',
        thumbnailUrl: 'https://placehold.co/600x400/2a9d8f/ffffff?text=Curry+Video',
        thumbnailAlt: 'Thai Green Curry step-by-step video thumbnail'
    },
    {
        title: 'Knife Skills Masterclass',
        category: 'Technique',
        mediaType: 'Video',
        description: 'Essential cuts — julienne, chiffonade, and brunoise — demonstrated at beginner speed.',
        thumbnailUrl: 'https://placehold.co/600x400/264653/ffffff?text=Knife+Skills',
        thumbnailAlt: 'Knife skills technique video thumbnail'
    },
    {
        title: 'Pantry Essentials Guide',
        category: 'Tips',
        mediaType: 'Audio',
        description: '20-minute audio guide covering the 12 pantry staples every home cook needs.',
        thumbnailUrl: 'https://placehold.co/600x400/f4a261/ffffff?text=Pantry+Guide',
        thumbnailAlt: 'Pantry essentials audio guide cover art'
    }
];

function createRecipeCardHtml(recipe) {
    const tagsHtml = recipe.tags
        .map(tag => `<span class="badge me-1">${tag}</span>`)
        .join('');

    return `
        <div class="col">
            <article class="recipe-card card h-100" data-recipe-id="${recipe.id}" tabindex="0"
                     role="button" aria-label="View details for ${recipe.name}">
                <div class="recipe-card__image-wrap">
                    <img class="recipe-card__image card-img-top"
                         src="${recipe.imageUrl}"
                         alt="${recipe.imageAlt}">
                    <div class="recipe-card__overlay" aria-hidden="true">
                        <span>${recipe.name}</span>
                    </div>
                </div>
                <div class="recipe-card__body card-body d-flex flex-column">
                    <span class="recipe-card__category">${recipe.category}</span>
                    <h3 class="recipe-card__title">${recipe.name}</h3>
                    <div class="recipe-card__tags mb-2">${tagsHtml}</div>
                    <div class="recipe-card__meta">
                        <span>⏱ ${recipe.activePrepTime} min</span>
                        <span>🕒 ${recipe.totalTime} min</span>
                        <span>${recipe.difficulty}</span>
                    </div>
                    <p class="recipe-card__description">${recipe.description}</p>
                    <button class="btn btn-primary mt-auto" data-recipe-id="${recipe.id}">
                        View Recipe
                    </button>
                </div>
            </article>
        </div>`;
}

function renderRecipeGrid(recipes) {
    const container = document.getElementById('recipe-list');
    if (!container) return;

    if (recipes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-4">No recipes match your filters. Try adjusting your search.</p>';
        return;
    }

    container.innerHTML = recipes.map(createRecipeCardHtml).join('');
    wireCardListeners();
}

function wireCardListeners() {
    document.querySelectorAll('.recipe-card[data-recipe-id]').forEach(card => {
        card.addEventListener('click', () => openRecipeModal(card.dataset.recipeId));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                openRecipeModal(card.dataset.recipeId);
            } else if (event.key === ' ') {
                event.preventDefault();
                openRecipeModal(card.dataset.recipeId);
            }
        });
    });
}

function openRecipeModal(recipeId) {
    const recipe = RECIPES.find(r => r.id === Number(recipeId));
    if (!recipe) return;

    const modalEl = document.getElementById('recipeDetailModal');
    if (!modalEl) return;

    modalEl.querySelector('#recipeModalTitle').textContent = recipe.name;

    const img = modalEl.querySelector('#recipeModalImage');
    img.src = recipe.imageUrl;
    img.alt = recipe.imageAlt;

    modalEl.querySelector('#recipeModalCategory').textContent = recipe.category;

    const tagsEl = modalEl.querySelector('#recipeModalTags');
    tagsEl.innerHTML = recipe.tags.map(tag => `<span class="badge me-1">${tag}</span>`).join('');

    const metaEl = modalEl.querySelector('#recipeModalMeta');
    metaEl.innerHTML = `
        <span>⏱ ${recipe.activePrepTime} min active</span>
        <span>🕒 ${recipe.totalTime} min total</span>
        <span>${recipe.difficulty}</span>
        <span>${recipe.calories} kcal</span>`;

    modalEl.querySelector('#recipeModalDescription').textContent = recipe.description;

    const ingredientsEl = modalEl.querySelector('#recipeModalIngredients');
    ingredientsEl.innerHTML = recipe.ingredients
        .map(ing => `<li class="mb-1">• ${ing}</li>`)
        .join('');

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function buildFilterCriteria(form) {
    const data = new FormData(form);
    const keyword = (data.get('keyword') || '').trim();
    const dietary = data.get('dietary') || '';
    const maxPrepRaw = data.get('max-prep-time');
    const maxPrepTime = maxPrepRaw ? parseInt(maxPrepRaw, 10) : null;
    const mealTypes = data.getAll('meal-type');
    const sortBy = data.get('sort') || 'newest';
    const maxCalories = parseInt(data.get('max-calories') || '1000', 10);

    return { keyword, dietary, maxPrepTime, mealTypes, sortBy, maxCalories };
}

function filterRecipes(criteria) {
    const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 };

    let results = RECIPES.filter(recipe => {
        if (criteria.keyword) {
            const searchText = `${recipe.name} ${recipe.category} ${recipe.tags.join(' ')}`.toLowerCase();
            if (!searchText.includes(criteria.keyword.toLowerCase())) return false;
        }

        if (criteria.dietary) {
            const hasTag = recipe.tags.some(tag => tag.toLowerCase() === criteria.dietary.toLowerCase());
            if (!hasTag) return false;
        }

        if (criteria.maxPrepTime !== null && recipe.activePrepTime > criteria.maxPrepTime) {
            return false;
        }

        if (criteria.mealTypes.length > 0) {
            const hasType = criteria.mealTypes.some(type => recipe.mealTypes.includes(type));
            if (!hasType) return false;
        }

        if (recipe.calories > criteria.maxCalories) return false;

        return true;
    });

    if (criteria.sortBy === 'fastest') {
        results.sort((a, b) => a.activePrepTime - b.activePrepTime);
    } else if (criteria.sortBy === 'easiest') {
        results.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    }

    return results;
}

function updateCalorieDisplay(value) {
    const display = document.getElementById('calorie-display');
    if (display) display.textContent = value;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('recipe-list')) {
        renderRecipeGrid(RECIPES);
    }

    wireCardListeners();

    const filterForm = document.getElementById('recipe-filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', event => {
            event.preventDefault();
            const criteria = buildFilterCriteria(filterForm);
            const filtered = filterRecipes(criteria);
            renderRecipeGrid(filtered);
        });

        const calorieSlider = document.getElementById('max-calories');
        if (calorieSlider) {
            calorieSlider.addEventListener('input', () => updateCalorieDisplay(calorieSlider.value));
        }
    }

    document.querySelectorAll('[data-recipe-id][data-action="open-modal"]').forEach(btn => {
        btn.addEventListener('click', () => openRecipeModal(btn.dataset.recipeId));
    });
});
