/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { appendFeedback } = require('../../server/feedback-store.js');

const record = (number) => ({ id: `id-${number}`, comment: `comment ${number}` });

describe('appendFeedback', () => {
    let temporaryFolder;
    let storageFilePath;

    const readStoredFile = async () => JSON.parse(await fs.readFile(storageFilePath, 'utf8'));
    const listStorageFolder = () => fs.readdir(path.dirname(storageFilePath));

    beforeEach(async () => {
        temporaryFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'feedback-store-'));
        storageFilePath = path.join(temporaryFolder, 'nested', 'feedback.json');
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await fs.rm(temporaryFolder, { recursive: true, force: true });
    });

    test('creates the missing folder and the file with one record', async () => {
        await appendFeedback(storageFilePath, record(1));

        expect(await readStoredFile()).toEqual([record(1)]);
    });

    test('appends to an existing array and keeps earlier records unchanged and in order', async () => {
        await appendFeedback(storageFilePath, record(1));
        await appendFeedback(storageFilePath, record(2));
        await appendFeedback(storageFilePath, record(3));

        expect(await readStoredFile()).toEqual([record(1), record(2), record(3)]);
    });

    test('keeps all records, in call order, when many calls run at the same time', async () => {
        const numbers = Array.from({ length: 25 }, (_value, index) => index + 1);

        await Promise.all(numbers.map((number) => appendFeedback(storageFilePath, record(number))));

        const storedRecords = await readStoredFile();
        expect(storedRecords).toHaveLength(25);
        expect(storedRecords.map((stored) => stored.id)).toEqual(numbers.map((number) => `id-${number}`));
    });

    test('writes readable JSON with two-space indentation and a trailing newline', async () => {
        await appendFeedback(storageFilePath, { id: 'a' });

        expect(await fs.readFile(storageFilePath, 'utf8')).toBe('[\n  {\n    "id": "a"\n  }\n]\n');
    });

    test('leaves only the storage file in its folder after success', async () => {
        await appendFeedback(storageFilePath, record(1));

        expect(await listStorageFolder()).toEqual(['feedback.json']);
    });

    describe.each([
        ['invalid JSON', '{ not json'],
        ['a JSON object', '{"id":"x"}'],
        ['JSON null', 'null'],
        ['a JSON string', '"text"']
    ])('when the file contains %s', (_description, content) => {
        beforeEach(async () => {
            await fs.mkdir(path.dirname(storageFilePath), { recursive: true });
            await fs.writeFile(storageFilePath, content, 'utf8');
        });

        test('rejects and leaves the file byte-for-byte unchanged', async () => {
            const expectedError = content === '{ not json' ? SyntaxError : /does not contain a JSON array/;
            await expect(appendFeedback(storageFilePath, record(1))).rejects.toThrow(expectedError);

            expect(await fs.readFile(storageFilePath, 'utf8')).toBe(content);
            expect(await listStorageFolder()).toEqual(['feedback.json']);
        });
    });

    test('rejects when the storage path is a directory', async () => {
        await fs.mkdir(storageFilePath, { recursive: true });

        await expect(appendFeedback(storageFilePath, record(1))).rejects.toMatchObject({ code: 'EISDIR' });
    });

    test('rejects and removes the temporary file when writing fails', async () => {
        await appendFeedback(storageFilePath, record(1));
        const writeError = new Error('disk full');
        jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(writeError);

        await expect(appendFeedback(storageFilePath, record(2))).rejects.toBe(writeError);

        expect(await readStoredFile()).toEqual([record(1)]);
        expect(await listStorageFolder()).toEqual(['feedback.json']);
    });

    test('rejects and removes the temporary file when renaming fails', async () => {
        await appendFeedback(storageFilePath, record(1));
        const renameError = new Error('rename blocked');
        jest.spyOn(fs, 'rename').mockRejectedValueOnce(renameError);

        await expect(appendFeedback(storageFilePath, record(2))).rejects.toBe(renameError);

        expect(await readStoredFile()).toEqual([record(1)]);
        expect(await listStorageFolder()).toEqual(['feedback.json']);
    });

    describe('temporary file locks during the final rename', () => {
        const lockError = (code) => Object.assign(new Error(`${code}: file is locked`), { code });

        test.each(['EPERM', 'EBUSY', 'EACCES'])('retries after %s and then succeeds', async (code) => {
            await appendFeedback(storageFilePath, record(1));
            const rename = jest.spyOn(fs, 'rename');
            rename.mockRejectedValueOnce(lockError(code)).mockRejectedValueOnce(lockError(code));

            await appendFeedback(storageFilePath, record(2));

            expect(rename).toHaveBeenCalledTimes(3);
            expect(await readStoredFile()).toEqual([record(1), record(2)]);
            expect(await listStorageFolder()).toEqual(['feedback.json']);
        });

        test('succeeds on the last allowed attempt', async () => {
            const rename = jest.spyOn(fs, 'rename');
            for (let failure = 0; failure < 4; failure += 1) {
                rename.mockRejectedValueOnce(lockError('EPERM'));
            }

            await appendFeedback(storageFilePath, record(1));

            expect(rename).toHaveBeenCalledTimes(5);
            expect(await readStoredFile()).toEqual([record(1)]);
        });

        test('gives up after 5 attempts and removes the temporary file', async () => {
            await appendFeedback(storageFilePath, record(1));
            const finalError = lockError('EPERM');
            const rename = jest.spyOn(fs, 'rename').mockRejectedValue(finalError);

            await expect(appendFeedback(storageFilePath, record(2))).rejects.toBe(finalError);

            expect(rename).toHaveBeenCalledTimes(5);
            expect(await readStoredFile()).toEqual([record(1)]);
            expect(await listStorageFolder()).toEqual(['feedback.json']);
        });

        test('does not retry other errors', async () => {
            const otherError = lockError('ENOSPC');
            const rename = jest.spyOn(fs, 'rename').mockRejectedValue(otherError);

            await expect(appendFeedback(storageFilePath, record(1))).rejects.toBe(otherError);

            expect(rename).toHaveBeenCalledTimes(1);
        });
    });

    test('keeps accepting calls after a failed call', async () => {
        await fs.mkdir(path.dirname(storageFilePath), { recursive: true });
        await fs.writeFile(storageFilePath, '{ broken', 'utf8');
        await expect(appendFeedback(storageFilePath, record(1))).rejects.toBeDefined();
        await fs.writeFile(storageFilePath, '[]', 'utf8');

        await appendFeedback(storageFilePath, record(2));

        expect(await readStoredFile()).toEqual([record(2)]);
    });

    test('runs a queued call even when the call before it failed', async () => {
        await fs.mkdir(path.dirname(storageFilePath), { recursive: true });
        await fs.writeFile(storageFilePath, '{ broken', 'utf8');
        const readFile = jest.spyOn(fs, 'readFile');
        readFile.mockResolvedValueOnce('{ broken').mockResolvedValueOnce('[]');

        const results = await Promise.allSettled([
            appendFeedback(storageFilePath, record(1)),
            appendFeedback(storageFilePath, record(2))
        ]);

        expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled']);
        expect(await readStoredFile()).toEqual([record(2)]);
    });
});
