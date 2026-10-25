const fs = require('node:fs/promises');
const path = require('node:path');

const RENAME_MAX_ATTEMPTS = 5;
const RENAME_RETRY_DELAY_MS = 20;
const RENAME_RETRY_ERROR_CODES = ['EPERM', 'EBUSY', 'EACCES'];

// Every write waits for the previous one, so simultaneous requests cannot overwrite each other.
let pendingWrite = Promise.resolve();

function appendFeedback(storageFilePath, record) {
    const currentWrite = pendingWrite.then(() => appendRecord(storageFilePath, record));
    // A failed write must not block the writes queued after it.
    pendingWrite = currentWrite.catch(() => {});
    return currentWrite;
}

async function appendRecord(storageFilePath, record) {
    await fs.mkdir(path.dirname(storageFilePath), { recursive: true });
    const records = await readStoredRecords(storageFilePath);
    records.push(record);

    // Writing to a temporary file and renaming it keeps the real file complete at every moment.
    const temporaryFilePath = `${storageFilePath}.tmp`;
    try {
        await fs.writeFile(temporaryFilePath, `${JSON.stringify(records, null, 2)}\n`);
        await replaceFile(temporaryFilePath, storageFilePath);
    } catch (error) {
        await fs.rm(temporaryFilePath, { force: true });
        throw error;
    }
}

// On Windows, antivirus or indexing tools can hold a freshly written file for a few milliseconds,
// which makes the rename fail with a temporary permission error. Retrying a few times resolves it.
async function replaceFile(temporaryFilePath, storageFilePath) {
    for (let attempt = 1; ; attempt += 1) {
        try {
            await fs.rename(temporaryFilePath, storageFilePath);
            return;
        } catch (error) {
            const canRetry = attempt < RENAME_MAX_ATTEMPTS && RENAME_RETRY_ERROR_CODES.includes(error.code);
            if (!canRetry) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, RENAME_RETRY_DELAY_MS));
        }
    }
}

// A missing file means no feedback has been stored yet. A damaged file is never overwritten.
async function readStoredRecords(storageFilePath) {
    let content;
    try {
        // Stryker disable next-line StringLiteral: without an encoding Node returns a Buffer, which JSON.parse converts to the same text
        content = await fs.readFile(storageFilePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
    const records = JSON.parse(content);
    if (!Array.isArray(records)) {
        throw new Error('The feedback file does not contain a JSON array.');
    }
    return records;
}

module.exports = { appendFeedback };
