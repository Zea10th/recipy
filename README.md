# Recipy

A recipe finder web application for busy people who love good food but have limited time to cook.

## Pages

| Page    | File           | Purpose                                                                                                       |
|---------|----------------|---------------------------------------------------------------------------------------------------------------|
| Home    | `index.html`   | Landing page — hero section, feature highlights, "How It Works" steps, and a preview of featured recipe cards |
| Recipes | `recipes.html` | Browse and filter recipes — search form with multiple input types, recipe card grid, and a media data table   |
| About   | `about.html`   | About the app — mission statement, key features list, collapsible FAQ, and a contact form                     |

## How to Open

No server, build tools, or dependencies required. Open any HTML file directly in your browser:

- **Windows**: Double-click `index.html` in File Explorer, or run `start index.html` in a terminal.
- **macOS**: Double-click `index.html` in Finder, or run `open index.html` in a terminal.
- **Linux**: Run `xdg-open index.html` in a terminal.

Navigate between pages using the navigation bar inside the app.

## Phase 1 Scope

This is a **static HTML + CSS** implementation. It covers:

- Semantic HTML5 page structure across all three pages
- Single external stylesheet (`css/styles.css`) with flexbox layout, CSS custom properties, and all required CSS
  selector types
- Recipe filter form demonstrating seven distinct input types
- Media data table on the Recipes page
- Hover transitions and image overlay effects on recipe cards
- Pure-CSS collapsible FAQ using native `<details>`/`<summary>`
- Responsive layout from 320px to 1920px viewport width
- UI wireframes in `design/wireframes.drawio` with a PNG export

JavaScript, Bootstrap, and external APIs are introduced in later phases.

## Project Structure

```text
/
├── index.html          — Home page
├── recipes.html        — Recipes / Search page
├── about.html          — About & Contact page
├── css/
│   └── styles.css      — Single external stylesheet
└── design/
    ├── wireframes.drawio   — draw.io wireframe source
    └── wireframes.png      — PNG export for quick preview
```
