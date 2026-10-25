const rules = require('../../js/feedback-rules.js');

const { validateComment, validateRating } = rules;

const LENGTH_MESSAGE = 'Comment must be between 3 and 300 characters.';
const CHARACTERS_MESSAGE = 'Comment must not contain these characters: " \' ; . ( ) %';
const RATING_MESSAGE = 'Rating must be a whole number from 1 to 10.';

const VALID = { isValid: true, errorMessage: null };

describe('validateComment', () => {
    describe('valid comments', () => {
        test.each([
            ['abc'],
            ['  abc  '],
            ['a'.repeat(300)],
            ['a'.repeat(298) + '  '],
            ['  ' + 'a'.repeat(300) + '  ']
        ])('accepts %j', (text) => {
            expect(validateComment(text)).toEqual(VALID);
        });
    });

    describe('length boundaries', () => {
        test.each([
            ['empty text', ''],
            ['1 character', 'a'],
            ['2 characters', 'ab'],
            ['whitespace only', '   '],
            ['1 character surrounded by spaces', '  a  '],
            ['301 characters', 'a'.repeat(301)],
            ['1000 characters', 'a'.repeat(1000)],
            ['301 characters after trimming', ' ' + 'a'.repeat(301) + ' ']
        ])('rejects %s with the length message only', (_description, text) => {
            expect(validateComment(text)).toEqual({ isValid: false, errorMessage: LENGTH_MESSAGE });
        });
    });

    describe('prohibited characters', () => {
        const prohibitedCharacters = ['"', "'", ';', '.', '(', ')', '%'];

        test.each(prohibitedCharacters)('rejects %j in the middle of the text', (character) => {
            expect(validateComment('ab' + character + 'cd')).toEqual({ isValid: false, errorMessage: CHARACTERS_MESSAGE });
        });

        test.each(prohibitedCharacters)('rejects %j as the first character', (character) => {
            expect(validateComment(character + 'abc')).toEqual({ isValid: false, errorMessage: CHARACTERS_MESSAGE });
        });

        test.each(prohibitedCharacters)('rejects %j as the last character', (character) => {
            expect(validateComment('abc' + character)).toEqual({ isValid: false, errorMessage: CHARACTERS_MESSAGE });
        });

        test('rejects a repeated prohibited character', () => {
            expect(validateComment('a;;b')).toEqual({ isValid: false, errorMessage: CHARACTERS_MESSAGE });
        });

        test('rejects a prohibited character in a comment of exactly 300 characters', () => {
            expect(validateComment('a'.repeat(299) + '%')).toEqual({ isValid: false, errorMessage: CHARACTERS_MESSAGE });
        });

        test.each([
            ['nice, tasty'],
            ['Great taste! Really?'],
            ['well-done: 10/10'],
            ['crème brûlée'],
            ['“quoted” and ’curly’'],
            ['full-width，and。marks'],
            ['first line\nsecond line'],
            ['<b>bold</b>']
        ])('accepts %j because it has no prohibited character', (text) => {
            expect(validateComment(text)).toEqual(VALID);
        });
    });

    describe('several problems at once', () => {
        test.each([
            ['a.'],
            ['.'],
            ['(']
        ])('joins the length message and the characters message for %j', (text) => {
            expect(validateComment(text)).toEqual({
                isValid: false,
                errorMessage: `${LENGTH_MESSAGE} ${CHARACTERS_MESSAGE}`
            });
        });

        test('reports both problems for a 301-character comment containing a prohibited character', () => {
            expect(validateComment('a'.repeat(300) + '%').errorMessage).toBe(`${LENGTH_MESSAGE} ${CHARACTERS_MESSAGE}`);
        });
    });
});

describe('validateRating', () => {
    test.each(['', '  ', '1', '2', '9', '10', ' 7 ', '07', '010'])('accepts %j', (text) => {
        expect(validateRating(text)).toEqual(VALID);
    });

    test.each([
        '0', '-1', '11', '100', '5.5', '+3', '-3', '1e1', 'abc', '5a', 'a5', '1 0', '٣'
    ])('rejects %j', (text) => {
        expect(validateRating(text)).toEqual({ isValid: false, errorMessage: RATING_MESSAGE });
    });
});

describe('validateFeedbackEntry', () => {
    const { validateFeedbackEntry } = rules;

    const NAME_MESSAGE = 'Please enter your name (at least 2 characters).';
    const EMAIL_MESSAGE = 'Please enter a valid email address.';
    const SUBJECT_MESSAGE = 'Subject must be at least 3 characters.';
    const BODY_MESSAGE = 'Request body must be a JSON object.';

    const validEntry = (overrides = {}) => ({
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Recipe idea',
        rating: 8,
        comment: 'Loved the pasta recipe, easy to follow',
        ...overrides
    });

    test('accepts a complete valid entry', () => {
        expect(validateFeedbackEntry(validEntry())).toEqual({ isValid: true, errors: {} });
    });

    test.each([
        ['null rating', { rating: null }],
        ['empty subject', { subject: '' }],
        ['whitespace-only subject', { subject: '   ' }],
        ['rating 1', { rating: 1 }],
        ['rating 10', { rating: 10 }],
        ['name of exactly 2 characters', { name: 'Jo' }],
        ['subject of exactly 3 characters', { subject: 'abc' }],
        ['surrounding spaces everywhere', { name: ' Jo ', email: ' jane@example.com ', subject: ' abc ', comment: ' abc ' }],
        ['extra unknown fields', { admin: true, note: 'x' }]
    ])('accepts %s', (_description, overrides) => {
        expect(validateFeedbackEntry(validEntry(overrides))).toEqual({ isValid: true, errors: {} });
    });

    test.each([
        ['name of 1 character', { name: 'J' }, { name: NAME_MESSAGE }],
        ['empty name', { name: '' }, { name: NAME_MESSAGE }],
        ['email without @', { email: 'jane.example.com' }, { email: EMAIL_MESSAGE }],
        ['empty email', { email: '' }, { email: EMAIL_MESSAGE }],
        ['subject of 1 character', { subject: 'a' }, { subject: SUBJECT_MESSAGE }],
        ['subject of 2 characters', { subject: 'ab' }, { subject: SUBJECT_MESSAGE }],
        ['rating 0', { rating: 0 }, { rating: 'Rating must be a whole number from 1 to 10.' }],
        ['rating 11', { rating: 11 }, { rating: 'Rating must be a whole number from 1 to 10.' }],
        ['rating 5.5', { rating: 5.5 }, { rating: 'Rating must be a whole number from 1 to 10.' }],
        ['comment of 2 characters', { comment: 'ab' }, { comment: 'Comment must be between 3 and 300 characters.' }],
        ['comment of 301 characters', { comment: 'a'.repeat(301) }, { comment: 'Comment must be between 3 and 300 characters.' }],
        ['comment with a percent sign', { comment: 'ok 100%' }, { comment: 'Comment must not contain these characters: " \' ; . ( ) %' }]
    ])('rejects %s with only that field in errors', (_description, overrides, expectedErrors) => {
        expect(validateFeedbackEntry(validEntry(overrides))).toEqual({ isValid: false, errors: expectedErrors });
    });

    test.each([
        ['name that is 3 characters long only because of spaces', { name: ' J ' }, 'name', NAME_MESSAGE],
        ['subject that is 4 characters long only because of spaces', { subject: ' ab ' }, 'subject', SUBJECT_MESSAGE],
        ['email with text before it', { email: 'a b@example.com' }, 'email', EMAIL_MESSAGE],
        ['email with text after it', { email: 'jane@example.com x' }, 'email', EMAIL_MESSAGE],
        ['comment that is 2 characters long once trimmed', { comment: '  ab  ' }, 'comment', 'Comment must be between 3 and 300 characters.']
    ])('measures trimmed text: rejects %s', (_description, overrides, field, message) => {
        expect(validateFeedbackEntry(validEntry(overrides)).errors[field]).toBe(message);
    });

    test('reports every failing field at once', () => {
        const result = validateFeedbackEntry({ name: 'J', email: 'x', subject: 'a', rating: 11, comment: 'a;' });

        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors).sort()).toEqual(['comment', 'email', 'name', 'rating', 'subject']);
        expect(result.errors.comment).toBe(
            'Comment must be between 3 and 300 characters. Comment must not contain these characters: " \' ; . ( ) %'
        );
    });

    test.each([
        ['name: 5', { name: 5 }, 'name', NAME_MESSAGE],
        ['name: null', { name: null }, 'name', NAME_MESSAGE],
        ['email: null', { email: null }, 'email', EMAIL_MESSAGE],
        ['subject: 1', { subject: 1 }, 'subject', SUBJECT_MESSAGE],
        ['comment: 42', { comment: 42 }, 'comment', 'Comment must be between 3 and 300 characters.'],
        ['rating as text "5"', { rating: '5' }, 'rating', 'Rating must be a whole number from 1 to 10.'],
        ['rating true', { rating: true }, 'rating', 'Rating must be a whole number from 1 to 10.'],
        ['rating NaN', { rating: NaN }, 'rating', 'Rating must be a whole number from 1 to 10.'],
        ['rating Infinity', { rating: Infinity }, 'rating', 'Rating must be a whole number from 1 to 10.'],
        ['rating missing', { rating: undefined }, 'rating', 'Rating must be a whole number from 1 to 10.'],
        ['name missing', { name: undefined }, 'name', NAME_MESSAGE]
    ])('rejects wrong type %s', (_description, overrides, field, message) => {
        expect(validateFeedbackEntry(validEntry(overrides)).errors[field]).toBe(message);
    });

    test.each([
        ['null', null],
        ['undefined', undefined],
        ['an array', []],
        ['a string', 'text'],
        ['a number', 42]
    ])('rejects %s as the whole entry', (_description, value) => {
        expect(validateFeedbackEntry(value)).toEqual({ isValid: false, errors: { body: BODY_MESSAGE } });
    });
});
