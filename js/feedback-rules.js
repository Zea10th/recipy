// Validation rules shared by the contact form (browser) and the local feedback save service (Node).
// The file must stay free of DOM access so both environments can load it.

const NAME_MIN_LENGTH = 2;
const SUBJECT_MIN_LENGTH = 3;
const COMMENT_MIN_LENGTH = 3;
const COMMENT_MAX_LENGTH = 300;
const RATING_MIN = 1;
const RATING_MAX = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_ERROR_MESSAGE = `Please enter your name (at least ${NAME_MIN_LENGTH} characters).`;
const EMAIL_ERROR_MESSAGE = 'Please enter a valid email address.';
const SUBJECT_ERROR_MESSAGE = `Subject must be at least ${SUBJECT_MIN_LENGTH} characters.`;
const COMMENT_LENGTH_ERROR_MESSAGE = `Comment must be between ${COMMENT_MIN_LENGTH} and ${COMMENT_MAX_LENGTH} characters.`;
const COMMENT_CHARACTERS_ERROR_MESSAGE = `Comment must not contain these characters: " ' ; . ( ) %`;
const RATING_ERROR_MESSAGE = `Rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}.`;

const PROHIBITED_COMMENT_CHARACTERS_PATTERN = /["';.()%]/;
// ASCII digits only: signs, decimal points, exponents and non-ASCII digits are not whole numbers here.
const WHOLE_NUMBER_PATTERN = /^[0-9]+$/;

function validateComment(text) {
    const trimmedText = text.trim();
    const errorMessages = [];
    if (trimmedText.length < COMMENT_MIN_LENGTH || trimmedText.length > COMMENT_MAX_LENGTH) {
        errorMessages.push(COMMENT_LENGTH_ERROR_MESSAGE);
    }
    if (PROHIBITED_COMMENT_CHARACTERS_PATTERN.test(trimmedText)) {
        errorMessages.push(COMMENT_CHARACTERS_ERROR_MESSAGE);
    }
    const isValid = errorMessages.length === 0;
    return {
        isValid,
        errorMessage: isValid ? null : errorMessages.join(' ')
    };
}

// The rating is optional: an empty value is valid.
function validateRating(text) {
    const trimmedText = text.trim();
    const isValid = trimmedText === '' || (
        WHOLE_NUMBER_PATTERN.test(trimmedText)
        && Number(trimmedText) >= RATING_MIN
        && Number(trimmedText) <= RATING_MAX
    );
    return {
        isValid,
        errorMessage: isValid ? null : RATING_ERROR_MESSAGE
    };
}

const BODY_ERROR_MESSAGE = 'Request body must be a JSON object.';

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Validates a whole entry received from an untrusted source (the save service).
// Every field must have the right type; a wrongly typed field gets that field's normal message.
function validateFeedbackEntry(entry) {
    if (!isPlainObject(entry)) {
        return { isValid: false, errors: { body: BODY_ERROR_MESSAGE } };
    }

    const errors = {};

    if (typeof entry.name !== 'string' || entry.name.trim().length < NAME_MIN_LENGTH) {
        errors.name = NAME_ERROR_MESSAGE;
    }
    if (typeof entry.email !== 'string' || !EMAIL_PATTERN.test(entry.email.trim())) {
        errors.email = EMAIL_ERROR_MESSAGE;
    }
    if (typeof entry.subject !== 'string' || !isSubjectLengthValid(entry.subject.trim())) {
        errors.subject = SUBJECT_ERROR_MESSAGE;
    }
    if (entry.rating !== null) {
        // Text such as "5" is not accepted. NaN and Infinity turn into text that validateRating rejects.
        if (typeof entry.rating !== 'number' || !validateRating(String(entry.rating)).isValid) {
            errors.rating = RATING_ERROR_MESSAGE;
        }
    }
    if (typeof entry.comment !== 'string') {
        errors.comment = COMMENT_LENGTH_ERROR_MESSAGE;
    } else {
        const commentResult = validateComment(entry.comment);
        if (!commentResult.isValid) {
            errors.comment = commentResult.errorMessage;
        }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}

// The subject is optional; when given it needs a minimum length.
function isSubjectLengthValid(trimmedSubject) {
    return trimmedSubject === '' || trimmedSubject.length >= SUBJECT_MIN_LENGTH;
}

// The export exists only for tests and the save service; browsers have no module object.
/* istanbul ignore else -- browser-only branch cannot run in the test environment */
// Stryker disable next-line all: browser-only branch cannot run in the test environment
if (typeof module !== 'undefined') {
    module.exports = {
        NAME_MIN_LENGTH,
        SUBJECT_MIN_LENGTH,
        COMMENT_MIN_LENGTH,
        COMMENT_MAX_LENGTH,
        RATING_MIN,
        RATING_MAX,
        EMAIL_PATTERN,
        NAME_ERROR_MESSAGE,
        EMAIL_ERROR_MESSAGE,
        SUBJECT_ERROR_MESSAGE,
        COMMENT_LENGTH_ERROR_MESSAGE,
        COMMENT_CHARACTERS_ERROR_MESSAGE,
        RATING_ERROR_MESSAGE,
        PROHIBITED_COMMENT_CHARACTERS_PATTERN,
        WHOLE_NUMBER_PATTERN,
        BODY_ERROR_MESSAGE,
        validateComment,
        validateRating,
        validateFeedbackEntry
    };
}
