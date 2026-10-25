// Entry point of the local feedback save service. It only wires real dependencies and starts listening,
// so it is intentionally outside the unit-test coverage and mutation scope.
const crypto = require('node:crypto');
const path = require('node:path');
const { createFeedbackServer } = require('./server.js');

const HOST = '127.0.0.1';
const PORT = 3001;
const STORAGE_FILE_PATH = path.join(__dirname, '..', 'tmp', 'feedback', 'feedback.json');

const server = createFeedbackServer({
    storageFilePath: STORAGE_FILE_PATH,
    now: () => new Date(),
    createId: crypto.randomUUID
});

server.listen(PORT, HOST, () => {
    console.log(`Feedback service listening on ${HOST}:${PORT}, storing messages in ${STORAGE_FILE_PATH}`);
});
