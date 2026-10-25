# Recipy

A recipe finder web application for busy people who love good food but have limited time to cook.

## Pages

| Page    | File           | Purpose                                                                                                                                  |
|---------|----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Home    | `index.html`   | Landing page — hero section, Bootstrap carousel of featured recipes, feature highlights, and "How It Works" steps                        |
| Recipes | `recipes.html` | Browse recipes — dynamically loaded recipe cards from an external API, recipe detail overlay, search/filter form, and a media data table |
| About   | `about.html`   | About the app — mission statement, key features list, collapsible FAQ, and a contact form with validation                                |

## How to Open

No server, build tools, or dependencies are required to browse the pages. Open any HTML file directly in your browser:

- **Windows**: Double-click `index.html` in File Explorer, or run `start index.html` in a terminal.
- **macOS**: Double-click `index.html` in Finder, or run `open index.html` in a terminal.
- **Linux**: Run `xdg-open index.html` in a terminal.

Navigate between pages using the navigation bar inside the app.

> **Note:** The Recipes page fetches data from a public API. An active internet connection is required for dynamically
> loaded recipe content. All other pages work fully offline.

## Saving Feedback

Messages sent through the Contact Us form on the About page are stored by a small local service, because a web page
cannot write files on its own. The service needs Node.js 20 or newer and has no runtime dependencies:

```bash
npm install
npm run start:feedback-service
```

The service listens on `127.0.0.1:3001` and appends every accepted message to `tmp/feedback/feedback.json` (a JSON array;
the folder is created automatically and is excluded from version control because it contains visitors' names and email
addresses). Stop it with `Ctrl+C`. While the service is not running, the form still validates input, but submitting a
valid message shows "We could not send your message. Please try again later." and keeps what was typed.

Each stored record contains `id`, `savedAt`, `name`, `email`, `subject`, `rating` and `comment`. The service checks every
rule again, accepts requests only from pages opened from disk or from `localhost`, and has no limit on the number of
stored messages for now.

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
  whitespace-only fields treated as empty; the message must be 3–300 characters and must not contain `"` `'` `;` `.` `(`
  `)` `%`; an optional rating accepts whole numbers from 1 to 10
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
│   ├── app.js              — Shared initialisation and scroll animations
│   ├── recipes.js          — Recipe card rendering, overlay, and filter logic
│   ├── api.js              — API calls, JSON parsing, and error handling
│   ├── feedback-rules.js   — Feedback validation rules shared by the form and the save service
│   └── contact.js          — Contact form handling and sending feedback to the save service
├── server/
│   ├── feedback-store.js   — Appends records to the JSON file safely
│   ├── server.js           — HTTP handling and validation of incoming feedback
│   └── start.js            — Starts the local feedback save service
├── tests/unit/             — Unit tests for the feedback code
├── tmp/feedback/           — Stored messages (created at runtime, not committed)
├── package.json            — Test and service scripts (development tooling only)
├── jest.config.js          — Test runner and coverage thresholds
├── stryker.config.json     — Mutation testing configuration
└── design/
    ├── wireframes.drawio   — draw.io wireframe source
    ├── wireframes-*.png    — PNG export for quick preview
    └── processes/          — Business process diagrams (feedback save flow)
```

## Running the Tests

The feedback code (`js/feedback-rules.js`, `js/contact.js`, `server/feedback-store.js`, `server/server.js`) has unit
tests with 100% statement, branch and decision coverage, checked by mutation testing. Requires Node.js 20 or newer.

```bash
npm install                 # once
npm test                    # run the unit tests
npm run test:coverage       # tests + coverage report (fails below 100%); HTML report in coverage/lcov-report/
npm run test:mutation       # mutation analysis; HTML report in reports/mutation/mutation.html
```

Mutation analysis runs every standard StrykerJS mutator category. Categories that produced mutants for this code:
ConditionalExpression, StringLiteral, BlockStatement, EqualityOperator, ObjectLiteral, BooleanLiteral, Regex,
MethodExpression, CallExpression, LogicalOperator, ArrowFunction, ArrayDeclaration, AssignmentOperator and
OptionalChaining (14 categories). ArithmeticOperator, UpdateOperator and UnaryOperator produced no mutants because the
code has no matching constructs. Mutation score: 100% (every mutant is killed or ignored with a justification below).
A full mutation run takes about 7 minutes; the unit tests take about 40 seconds with coverage.

### Equivalent mutants

Mutants that cannot change observable behavior are ignored in the source with a `Stryker disable` comment:

| File | Ignored construct | Justification |
|------|-------------------|---------------|
| `js/feedback-rules.js`, `js/contact.js` | `if (typeof module !== 'undefined')` export guard | The export exists only for tests and the save service; the browser-only branch cannot run in the test environment |
| `server/feedback-store.js` | `'utf8'` argument of `readFile` | Without an encoding Node returns a Buffer, which `JSON.parse` converts to the same text |
| `server/server.js` | `receivedBytes <= MAX_REQUEST_BODY_BYTES` condition while draining the body | Keeping every chunk instead of dropping the surplus changes memory use only; the 413 answer is the same |