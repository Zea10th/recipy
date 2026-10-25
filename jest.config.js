module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/unit/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/unit/setup/expose-feedback-rules.js'],
    // server/start.js is intentionally absent: it only wires real dependencies and starts listening.
    collectCoverageFrom: [
        'js/feedback-rules.js',
        'js/contact.js',
        'server/feedback-store.js',
        'server/server.js'
    ],
    coverageReporters: ['text', 'lcov'],
    // The branch figure is the decision-coverage gate: it counts every if/ternary outcome
    // and each operand of &&, ||, ?? and ?.
    coverageThreshold: {
        global: {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100
        }
    }
};
