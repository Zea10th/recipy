# Recipy

A recipe finder web application for busy people who love good food but have limited time to cook.

## Pages

| Page    | File           | Purpose                                                                                                                                  |
|---------|----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Home    | `index.html`   | Landing page — hero section, Bootstrap carousel of featured recipes, feature highlights, and "How It Works" steps                        |
| Recipes | `recipes.html` | Browse recipes — dynamically loaded recipe cards from an external API, recipe detail overlay, search/filter form, and a media data table |
| About   | `about.html`   | About the app — mission statement, key features list, collapsible FAQ, and a contact form with validation                                |

## How to Open

No server, build tools, or dependencies required. Open any HTML file directly in your browser:

- **Windows**: Double-click `index.html` in File Explorer, or run `start index.html` in a terminal.
- **macOS**: Double-click `index.html` in Finder, or run `open index.html` in a terminal.
- **Linux**: Run `xdg-open index.html` in a terminal.

Navigate between pages using the navigation bar inside the app.

> **Note:** The Recipes page fetches data from a public API. An active internet connection is required for dynamically
> loaded recipe content. All other pages work fully offline.

## Features by Phase

### Phase 1 — HTML & CSS

- Semantic HTML5 page structure across all three pages
- Single external stylesheet (`css/styles.css`) with flexbox layout and CSS custom properties
- All required CSS selector types demonstrated (element, ID, class, descendant, child, attribute, pseudo-class,
  pseudo-element)
- Recipe filter form with seven distinct input types
- Media data table on the Recipes page
- Hover transitions and image overlay effects on recipe cards
- Pure-CSS collapsible FAQ using native `<details>`/`<summary>`
- Responsive layout from 320 px to 1920 px viewport width
- UI wireframes in `design/wireframes.drawio` with a PNG export

### Phase 2 — Bootstrap & JavaScript

- Bootstrap 5 integrated via CDN — responsive grid, utility classes, and components
- Collapsible hamburger navigation on mobile viewports
- Recipe cards built with Bootstrap card components, category badges, and action buttons
- Bootstrap carousel on the home page with auto-advance and manual navigation controls
- Recipe detail overlay (Bootstrap Modal) — opens on card click, closable via button, backdrop click, or Escape key;
  background scroll is locked while open
- Contact form client-side validation with field-specific error messages and a success confirmation on valid submission;
  whitespace-only fields treated as empty
- Scroll-triggered section animations — content fades in as it enters the viewport
- JavaScript collapsible content blocks with smooth transitions independent of each other
- Five DOM event types handled: `DOMContentLoaded`, `click`, `submit`, `input`, `scroll`
- Application logic split into named, single-responsibility functions across separate JS modules
- Recipe and content data represented as structured JavaScript objects

### Phase 3 — AJAX & API Integration

- Two distinct API calls to publicly accessible endpoints: one fetching a list of recipes, one fetching a specific
  recipe's details
- Loading indicator displayed while any API request is in progress
- JSON responses parsed and rendered as styled Bootstrap cards consistent with the rest of the application
- Recipe detail overlay populated with API-sourced data (ingredients, preparation steps) on card click
- User-friendly error message shown when an API request fails — no technical details exposed to the user
- Empty-state message displayed when the API returns zero results
- Individual API response items with missing fields are skipped gracefully without crashing

## Project Structure

```text
/
├── index.html          — Home page
├── recipes.html        — Recipes / Search page
├── about.html          — About & Contact page
├── css/
│   └── styles.css      — Single external stylesheet
├── js/
│   ├── app.js          — Shared initialisation and scroll animations
│   ├── recipes.js      — Recipe card rendering, overlay, and filter logic
│   ├── api.js          — API calls, JSON parsing, and error handling
│   └── contact.js      — Contact form validation
└── design/
    ├── wireframes.drawio   — draw.io wireframe source
    └── wireframes-*.png    — PNG export for quick preview
```