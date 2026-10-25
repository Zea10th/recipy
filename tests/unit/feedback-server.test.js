/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
const fs = require('node:fs/promises');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { createFeedbackServer } = require('../../server/server.js');

const FIXED_TIME = new Date('2026-10-25T10:00:00.000Z');
const FEEDBACK_PATH = '/api/feedback';

const validEntry = (overrides = {}) => ({
    name: 'Jane Smith',
    email: 'jane@example.com',
    subject: 'Recipe idea',
    rating: 8,
    comment: 'Loved the pasta recipe, easy to follow',
    ...overrides
});

describe('feedback save service', () => {
    let temporaryFolder;
    let storageFilePath;
    let server;
    let port;
    let idCounter;

    const sendRequest = ({ method = 'POST', requestPath = FEEDBACK_PATH, headers = {}, body }) =>
        new Promise((resolve, reject) => {
            const request = http.request({ host: '127.0.0.1', port, method, path: requestPath, headers }, (response) => {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const text = Buffer.concat(chunks).toString('utf8');
                    resolve({
                        status: response.statusCode,
                        headers: response.headers,
                        text,
                        json: text === '' ? null : JSON.parse(text)
                    });
                });
            });
            request.on('error', reject);
            request.end(body);
        });

    const postJson = (entry, headers = {}) =>
        sendRequest({
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(entry)
        });

    const readStoredRecords = async () => JSON.parse(await fs.readFile(storageFilePath, 'utf8'));

    const storedFileExists = () => fs.access(storageFilePath).then(() => true, () => false);

    beforeEach(async () => {
        temporaryFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'feedback-server-'));
        storageFilePath = path.join(temporaryFolder, 'feedback', 'feedback.json');
        idCounter = 0;
        server = createFeedbackServer({
            storageFilePath,
            now: () => FIXED_TIME,
            createId: () => `id-${++idCounter}`
        });
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        port = server.address().port;
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await new Promise((resolve) => server.close(resolve));
        await fs.rm(temporaryFolder, { recursive: true, force: true });
    });

    describe('storing valid feedback', () => {
        test('answers 201 with the new id and stores one complete record', async () => {
            const response = await postJson(validEntry());

            expect(response.status).toBe(201);
            expect(response.json).toEqual({ id: 'id-1' });
            expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
            expect(await readStoredRecords()).toEqual([{
                id: 'id-1',
                savedAt: '2026-10-25T10:00:00.000Z',
                name: 'Jane Smith',
                email: 'jane@example.com',
                subject: 'Recipe idea',
                rating: 8,
                comment: 'Loved the pasta recipe, easy to follow'
            }]);
        });

        test('stores a missing rating as null and an empty subject as an empty string', async () => {
            await postJson(validEntry({ rating: null, subject: '' }));

            const [stored] = await readStoredRecords();
            expect(stored.rating).toBeNull();
            expect(stored.subject).toBe('');
        });

        test('stores trimmed text and ignores unknown fields', async () => {
            await postJson(validEntry({
                name: '  Jane Smith ',
                email: ' jane@example.com ',
                subject: '  Recipe idea ',
                comment: '  nice, tasty  ',
                admin: true
            }));

            const [stored] = await readStoredRecords();
            expect(stored).toEqual({
                id: 'id-1',
                savedAt: '2026-10-25T10:00:00.000Z',
                name: 'Jane Smith',
                email: 'jane@example.com',
                subject: 'Recipe idea',
                rating: 8,
                comment: 'nice, tasty'
            });
        });

        test('accepts a comment containing a comma', async () => {
            expect((await postJson(validEntry({ comment: 'nice, tasty' }))).status).toBe(201);
        });

        test('keeps earlier records and the order of arrival', async () => {
            await postJson(validEntry({ comment: 'first comment' }));
            await postJson(validEntry({ comment: 'second comment' }));

            const records = await readStoredRecords();
            expect(records.map((record) => record.comment)).toEqual(['first comment', 'second comment']);
        });

        test('stores all 20 simultaneous submissions exactly once', async () => {
            const responses = await Promise.all(
                Array.from({ length: 20 }, (_value, index) => postJson(validEntry({ comment: `comment ${index}` })))
            );

            expect(responses.map((response) => response.status)).toEqual(Array(20).fill(201));
            const records = await readStoredRecords();
            expect(records).toHaveLength(20);
            expect(new Set(records.map((record) => record.id)).size).toBe(20);
            expect(new Set(records.map((record) => record.comment)).size).toBe(20);
        });

        test('ignores the query string when routing', async () => {
            const response = await sendRequest({
                requestPath: `${FEEDBACK_PATH}?source=form`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validEntry())
            });

            expect(response.status).toBe(201);
        });
    });

    describe('rejecting invalid feedback', () => {
        const PROHIBITED_MESSAGE = 'Comment must not contain these characters: " \' ; . ( ) %';

        test.each([
            ['name', { name: 'J' }, 'Please enter your name (at least 2 characters).'],
            ['email', { email: 'jane.example.com' }, 'Please enter a valid email address.'],
            ['subject', { subject: 'ab' }, 'Subject must be at least 3 characters.'],
            ['rating', { rating: 11 }, 'Rating must be a whole number from 1 to 10.'],
            ['rating', { rating: 5.5 }, 'Rating must be a whole number from 1 to 10.'],
            ['rating', { rating: '5' }, 'Rating must be a whole number from 1 to 10.'],
            ['comment', { comment: 'ab' }, 'Comment must be between 3 and 300 characters.'],
            ['comment', { comment: 'a'.repeat(301) }, 'Comment must be between 3 and 300 characters.'],
            ['comment', { comment: 42 }, 'Comment must be between 3 and 300 characters.']
        ])('answers 400 for an invalid %s and stores nothing', async (field, overrides, message) => {
            const response = await postJson(validEntry(overrides));

            expect(response.status).toBe(400);
            expect(response.json).toEqual({ errors: { [field]: message } });
            expect(await storedFileExists()).toBe(false);
        });

        test.each(['"', "'", ';', '.', '(', ')', '%'])('answers 400 for a comment containing %j', async (character) => {
            const response = await postJson(validEntry({ comment: `ab${character}cd` }));

            expect(response.status).toBe(400);
            expect(response.json).toEqual({ errors: { comment: PROHIBITED_MESSAGE } });
            expect(await storedFileExists()).toBe(false);
        });

        test('reports every invalid field at once', async () => {
            const response = await postJson({ name: 'J', email: 'x', subject: 'a', rating: 0, comment: 'a%' });

            expect(response.status).toBe(400);
            expect(Object.keys(response.json.errors).sort()).toEqual(['comment', 'email', 'name', 'rating', 'subject']);
        });

        test.each([
            ['invalid JSON', '{ not json'],
            ['an empty body', ''],
            ['JSON null', 'null'],
            ['a JSON array', '[]'],
            ['a JSON string', '"text"']
        ])('answers 400 with a body error for %s', async (_description, body) => {
            const response = await sendRequest({ headers: { 'Content-Type': 'application/json' }, body });

            expect(response.status).toBe(400);
            expect(response.json).toEqual({ errors: { body: 'Request body must be a JSON object.' } });
            expect(await storedFileExists()).toBe(false);
        });

        test('answers 413 for a body of 16385 bytes and stores nothing', async () => {
            const json = JSON.stringify(validEntry());
            const body = json + ' '.repeat(16385 - Buffer.byteLength(json));

            const response = await sendRequest({ headers: { 'Content-Type': 'application/json' }, body });

            expect(Buffer.byteLength(body)).toBe(16385);
            expect(response.status).toBe(413);
            expect(response.json).toEqual({ error: 'Request body is too large.' });
            expect(await storedFileExists()).toBe(false);
        });

        test('processes a body of exactly 16384 bytes normally', async () => {
            const json = JSON.stringify(validEntry());
            const body = json + ' '.repeat(16384 - Buffer.byteLength(json));

            const response = await sendRequest({ headers: { 'Content-Type': 'application/json' }, body });

            expect(Buffer.byteLength(body)).toBe(16384);
            expect(response.status).toBe(201);
        });

        test('stores nothing and keeps serving after a request is aborted mid-body', async () => {
            await new Promise((resolve) => {
                const socket = net.connect(port, '127.0.0.1', () => {
                    socket.write(
                        `POST ${FEEDBACK_PATH} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 500\r\n\r\n{"name":`
                    );
                    setTimeout(() => {
                        socket.destroy();
                        resolve();
                    }, 20);
                });
            });
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(await storedFileExists()).toBe(false);
            expect((await postJson(validEntry())).status).toBe(201);
        });
    });

    describe('routing', () => {
        test.each(['/', '/api/other', `${FEEDBACK_PATH}/extra`])('answers 404 for %s', async (requestPath) => {
            const response = await sendRequest({ method: 'GET', requestPath });

            expect(response.status).toBe(404);
            expect(response.json).toEqual({ error: 'Not found.' });
        });

        test('answers 404 for OPTIONS on an unknown path', async () => {
            expect((await sendRequest({ method: 'OPTIONS', requestPath: '/other' })).status).toBe(404);
        });

        test.each(['GET', 'PUT', 'DELETE'])('answers 405 with an Allow header for %s', async (method) => {
            const response = await sendRequest({ method });

            expect(response.status).toBe(405);
            expect(response.headers.allow).toBe('POST, OPTIONS');
            expect(response.json).toEqual({ error: 'Method not allowed.' });
        });

        test('answers the preflight request with 204 and no body', async () => {
            const response = await sendRequest({
                method: 'OPTIONS',
                headers: { Origin: 'null', 'Access-Control-Request-Method': 'POST' }
            });

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
            expect(response.headers['access-control-allow-origin']).toBe('null');
            expect(response.headers['access-control-allow-methods']).toBe('POST, OPTIONS');
            expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
        });
    });

    describe('origin policy', () => {
        test('processes a request without an Origin header and sends no CORS headers', async () => {
            const response = await postJson(validEntry());

            expect(response.status).toBe(201);
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });

        test.each([
            'null',
            'http://localhost',
            'http://localhost:5500',
            'http://127.0.0.1',
            'http://127.0.0.1:8080'
        ])('allows the origin %s and echoes it back', async (origin) => {
            const response = await postJson(validEntry(), { Origin: origin });

            expect(response.status).toBe(201);
            expect(response.headers['access-control-allow-origin']).toBe(origin);
            expect(response.headers.vary).toBe('Origin');
        });

        test.each([
            'https://example.com',
            'http://localhost.evil.com',
            'http://evil.com:3001',
            'http://localhost:abc',
            'http://evil.com/http://localhost',
            'http://evil.com/http://127.0.0.1:3001',
            'https://localhost',
            'file://',
            ''
        ])('rejects the origin %j with 403 and stores nothing', async (origin) => {
            const response = await postJson(validEntry(), { Origin: origin });

            expect(response.status).toBe(403);
            expect(response.json).toEqual({ error: 'Origin not allowed.' });
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
            expect(await storedFileExists()).toBe(false);
        });

        test('rejects a preflight request from a foreign origin', async () => {
            const response = await sendRequest({ method: 'OPTIONS', headers: { Origin: 'https://example.com' } });

            expect(response.status).toBe(403);
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });

        test('adds CORS headers to error responses for an allowed origin', async () => {
            const response = await sendRequest({
                headers: { Origin: 'null', 'Content-Type': 'application/json' },
                body: '{ nope'
            });

            expect(response.status).toBe(400);
            expect(response.headers['access-control-allow-origin']).toBe('null');
        });
    });

    describe('storage failures', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        test('answers 500, logs the problem and leaves a damaged file untouched', async () => {
            await fs.mkdir(path.dirname(storageFilePath), { recursive: true });
            await fs.writeFile(storageFilePath, '{ damaged', 'utf8');

            const response = await postJson(validEntry());

            expect(response.status).toBe(500);
            expect(response.json).toEqual({ error: 'Could not save feedback.' });
            expect(await fs.readFile(storageFilePath, 'utf8')).toBe('{ damaged');
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Could not save feedback:', expect.any(SyntaxError));
        });

        test('answers 500 when the storage path cannot be written', async () => {
            await fs.mkdir(storageFilePath, { recursive: true });

            const response = await postJson(validEntry());

            expect(response.status).toBe(500);
            expect(response.json).toEqual({ error: 'Could not save feedback.' });
        });
    });
});
