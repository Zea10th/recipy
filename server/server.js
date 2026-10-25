const http = require('node:http');
const { validateFeedbackEntry, BODY_ERROR_MESSAGE } = require('../js/feedback-rules.js');
const { appendFeedback } = require('./feedback-store.js');

const FEEDBACK_PATH = '/api/feedback';
const MAX_REQUEST_BODY_BYTES = 16384;

// Pages opened from the file system send the origin "null"; locally served pages send localhost.
// Any other website open in the visitor's browser must not be able to post to this service.
const LOCAL_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/;

function isOriginAllowed(origin) {
    return origin === 'null' || LOCAL_ORIGIN_PATTERN.test(origin);
}

function buildCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

function sendJson(response, statusCode, body, headers) {
    response.writeHead(statusCode, { ...headers, 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

// The whole body is drained even when it is too large, so the 413 answer can still be delivered.
async function readRequestBody(request) {
    const chunks = [];
    let receivedBytes = 0;
    for await (const chunk of request) {
        receivedBytes += chunk.length;
        // Stryker disable next-line ConditionalExpression: keeping every chunk instead of dropping the surplus changes memory use only
        if (receivedBytes <= MAX_REQUEST_BODY_BYTES) {
            chunks.push(chunk);
        }
    }
    return {
        isTooLarge: receivedBytes > MAX_REQUEST_BODY_BYTES,
        text: Buffer.concat(chunks).toString('utf8')
    };
}

// Returns undefined for text that is not valid JSON; the caller reports it as an invalid body.
function parseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        // Nothing to do here: falling through returns undefined.
    }
    return undefined;
}

async function handleFeedbackPost(request, response, headers, { storageFilePath, now, createId }) {
    let body;
    try {
        body = await readRequestBody(request);
    } catch {
        // The visitor disconnected before the whole body arrived: nobody is left to answer.
        return;
    }
    if (body.isTooLarge) {
        sendJson(response, 413, { error: 'Request body is too large.' }, headers);
        return;
    }

    const entry = parseJson(body.text);
    const validation = validateFeedbackEntry(entry);
    if (!validation.isValid) {
        sendJson(response, 400, { errors: validation.errors }, headers);
        return;
    }

    const record = {
        id: createId(),
        savedAt: now().toISOString(),
        name: entry.name.trim(),
        email: entry.email.trim(),
        subject: entry.subject.trim(),
        rating: entry.rating,
        comment: entry.comment.trim()
    };
    try {
        await appendFeedback(storageFilePath, record);
    } catch (error) {
        console.error('Could not save feedback:', error);
        sendJson(response, 500, { error: 'Could not save feedback.' }, headers);
        return;
    }
    sendJson(response, 201, { id: record.id }, headers);
}

async function handleRequest(request, response, dependencies) {
    const origin = request.headers.origin;
    let headers = {};
    if (origin !== undefined) {
        if (!isOriginAllowed(origin)) {
            sendJson(response, 403, { error: 'Origin not allowed.' }, headers);
            return;
        }
        headers = buildCorsHeaders(origin);
    }

    const requestPath = request.url.split('?')[0];
    if (requestPath !== FEEDBACK_PATH) {
        sendJson(response, 404, { error: 'Not found.' }, headers);
        return;
    }
    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed.' }, { ...headers, Allow: 'POST, OPTIONS' });
        return;
    }
    await handleFeedbackPost(request, response, headers, dependencies);
}

// Returns an http.Server that is not listening yet. All dependencies are passed in so tests control
// the storage location, the clock and the identifiers.
function createFeedbackServer(dependencies) {
    return http.createServer((request, response) => handleRequest(request, response, dependencies));
}

module.exports = { createFeedbackServer };
