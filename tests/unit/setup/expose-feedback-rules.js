// contact.js is a classic browser script that reads the shared rules as globals.
// Expose them the same way before any test loads it.
Object.assign(globalThis, require('../../../js/feedback-rules.js'));
