const {
    initializeContactForm,
    collectFeedbackEntry,
    saveFeedback,
    showFailureAlert,
    validateContactForm
} = require('../../js/contact.js');
const { renderContactForm, fillValidForm, fillForm } = require('./helpers/contact-form-fixture.js');

const SUCCESS_TEXT = 'Your message has been sent successfully! We will get back to you soon.';
const FAILURE_TEXT = 'We could not send your message. Please try again later.';
const FEEDBACK_ENDPOINT = 'http://localhost:3001/api/feedback';

const savedResponse = () => Promise.resolve({ status: 201 });

// Lets every pending promise callback of the submit handler run.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function submitForm(form) {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await settle();
}

const errorTextOf = (fieldId) => {
    const feedback = document.getElementById(fieldId).parentElement.querySelector('.invalid-feedback');
    return feedback ? feedback.textContent : null;
};

const hasSuccessAlert = () => document.querySelector('.alert-success') !== null;
const hasFailureAlert = () => document.querySelector('.alert-danger') !== null;

describe('contact form', () => {
    let form;

    beforeEach(() => {
        form = renderContactForm();
        initializeContactForm();
        global.fetch = jest.fn(savedResponse);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
    });

    describe('valid comment with an optional rating', () => {
        test.each([
            ['exactly 3 characters', 'abc'],
            ['exactly 300 characters', 'a'.repeat(300)],
            ['5 characters (old 10-character minimum is gone)', 'Tasty']
        ])('accepts a comment of %s', async (_description, message) => {
            fillValidForm({ message });

            await submitForm(form);

            expect(form.previousElementSibling.classList.contains('alert-success')).toBe(true);
            expect(form.previousElementSibling.textContent).toContain(SUCCESS_TEXT);
        });

        test.each(['', '1', '5', '10'])('accepts rating %j', async (rating) => {
            fillValidForm({ rating });

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
        });

        test('clears every field and validation marker after success', async () => {
            fillValidForm({ subject: 'Hello', rating: '7' });

            await submitForm(form);

            ['contact-name', 'contact-email', 'contact-subject', 'contact-rating', 'contact-message']
                .forEach((fieldId) => {
                    const input = document.getElementById(fieldId);
                    expect(input.value).toBe('');
                    expect(input.classList.contains('is-valid')).toBe(false);
                    expect(input.classList.contains('is-invalid')).toBe(false);
                });
            expect(form.querySelector('.invalid-feedback')).toBeNull();
        });
    });

    describe('comment length', () => {
        test.each([
            ['2 characters', 'ab'],
            ['301 characters', 'a'.repeat(301)],
            ['spaces only', '     ']
        ])('blocks a comment of %s and focuses the message field', async (_description, message) => {
            fillValidForm({ message });

            await submitForm(form);

            const messageField = document.getElementById('contact-message');
            expect(hasSuccessAlert()).toBe(false);
            expect(messageField.classList.contains('is-invalid')).toBe(true);
            expect(errorTextOf('contact-message')).toBe('Comment must be between 3 and 300 characters.');
            expect(document.activeElement).toBe(messageField);
        });

        test('accepts the corrected comment and removes the earlier error', async () => {
            fillValidForm({ message: 'ab' });
            await submitForm(form);

            fillForm({ message: 'abc' });
            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
            expect(document.querySelector('.invalid-feedback')).toBeNull();
        });
    });

    describe('prohibited characters', () => {
        test('blocks a comment with a semicolon', async () => {
            fillValidForm({ message: 'a;b' });

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(false);
            expect(errorTextOf('contact-message')).toBe('Comment must not contain these characters: " \' ; . ( ) %');
            expect(document.activeElement).toBe(document.getElementById('contact-message'));
        });

        test('accepts a comment with a comma', async () => {
            fillValidForm({ message: 'nice, tasty' });

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
        });

        test('accepts markup-like text and never echoes visitor text in messages', async () => {
            fillValidForm({ message: '<b>x</b>' });
            await submitForm(form);
            expect(hasSuccessAlert()).toBe(true);
            expect(document.querySelector('.alert').innerHTML).not.toContain('<b>');

            fillValidForm({ message: '<b>x</b>;' });
            await submitForm(form);
            expect(errorTextOf('contact-message')).not.toContain('<b>');
            expect(document.querySelector('.invalid-feedback').innerHTML).not.toContain('<b>');
        });
    });

    describe('rating', () => {
        test.each(['0', '11', '5.5', 'abc'])('blocks rating %j', async (rating) => {
            fillValidForm({ rating });

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(false);
            expect(errorTextOf('contact-rating')).toBe('Rating must be a whole number from 1 to 10.');
            expect(document.activeElement).toBe(document.getElementById('contact-rating'));
        });

        test('leaves an empty rating unmarked', async () => {
            fillValidForm({ rating: '', message: 'ab' });

            await submitForm(form);

            const ratingField = document.getElementById('contact-rating');
            expect(ratingField.classList.contains('is-valid')).toBe(false);
            expect(ratingField.classList.contains('is-invalid')).toBe(false);
        });

        test('marks a valid rating as valid when another field is invalid', async () => {
            fillValidForm({ rating: '7', message: 'ab' });

            await submitForm(form);

            expect(document.getElementById('contact-rating').classList.contains('is-valid')).toBe(true);
        });

        test('focuses the first invalid field in page order and shows every error', async () => {
            fillForm({ name: 'J', email: 'jane@example.com', subject: '', rating: '11', message: 'ab' });

            await submitForm(form);

            expect(document.activeElement).toBe(document.getElementById('contact-name'));
            expect(errorTextOf('contact-name')).toBe('Please enter your name (at least 2 characters).');
            expect(errorTextOf('contact-rating')).toBe('Rating must be a whole number from 1 to 10.');
            expect(errorTextOf('contact-message')).toBe('Comment must be between 3 and 300 characters.');
        });

        test('focuses the rating before the message when both are invalid', async () => {
            fillValidForm({ rating: '0', message: 'ab' });

            await submitForm(form);

            expect(document.activeElement).toBe(document.getElementById('contact-rating'));
        });

        test('accepts the corrected rating on resubmission', async () => {
            fillValidForm({ rating: '11' });
            await submitForm(form);

            fillForm({ rating: '10' });
            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
        });
    });

    describe('name, email and subject', () => {
        test('blocks an invalid name and focuses it', async () => {
            fillValidForm({ name: 'J' });

            await submitForm(form);

            expect(errorTextOf('contact-name')).toBe('Please enter your name (at least 2 characters).');
            expect(document.activeElement).toBe(document.getElementById('contact-name'));
            expect(hasSuccessAlert()).toBe(false);
        });

        test('blocks an invalid email and focuses it', async () => {
            fillValidForm({ email: 'jane.example.com' });

            await submitForm(form);

            expect(errorTextOf('contact-email')).toBe('Please enter a valid email address.');
            expect(document.activeElement).toBe(document.getElementById('contact-email'));
            expect(hasSuccessAlert()).toBe(false);
        });

        test.each(['a', 'ab'])('blocks a subject of %j', async (subject) => {
            fillValidForm({ subject });

            await submitForm(form);

            expect(errorTextOf('contact-subject')).toBe('Subject must be at least 3 characters.');
            expect(document.activeElement).toBe(document.getElementById('contact-subject'));
        });

        test('accepts a subject of 3 characters and marks it valid when another field fails', async () => {
            fillValidForm({ subject: 'abc', message: 'ab' });

            await submitForm(form);

            expect(document.getElementById('contact-subject').classList.contains('is-valid')).toBe(true);
        });

        test('does not mark an empty subject at all', async () => {
            fillValidForm({ subject: '', message: 'ab' });

            await submitForm(form);

            const subjectField = document.getElementById('contact-subject');
            expect(subjectField.classList.contains('is-valid')).toBe(false);
            expect(subjectField.classList.contains('is-invalid')).toBe(false);
        });

        test('works when the page has no subject field', async () => {
            fillValidForm();
            document.getElementById('contact-subject').closest('.contact-form__field').remove();

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
            expect(JSON.parse(global.fetch.mock.calls[0][1].body).subject).toBe('');
        });
    });

    describe('validation markers', () => {
        test('marks name, email and message as valid when only the rating is wrong', async () => {
            fillValidForm({ rating: '0' });

            await submitForm(form);

            ['contact-name', 'contact-email', 'contact-message'].forEach((fieldId) => {
                const field = document.getElementById(fieldId);
                expect(field.classList.contains('is-valid')).toBe(true);
                expect(field.classList.contains('is-invalid')).toBe(false);
            });
        });

        test('removes the error of a corrected field and marks it valid', async () => {
            fillValidForm({ name: 'J', email: 'nope', message: 'ab' });
            await submitForm(form);

            fillForm({ name: 'Jane', email: 'jane@example.com', message: 'abc', rating: '0' });
            await submitForm(form);

            ['contact-name', 'contact-email', 'contact-message'].forEach((fieldId) => {
                expect(document.getElementById(fieldId).classList.contains('is-valid')).toBe(true);
                expect(errorTextOf(fieldId)).toBeNull();
            });
        });

        test('treats a subject and a rating made only of spaces as empty', async () => {
            fillValidForm({ subject: '   ', rating: '   ' });

            await submitForm(form);

            expect(hasSuccessAlert()).toBe(true);
            const sentEntry = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(sentEntry.subject).toBe('');
            expect(sentEntry.rating).toBeNull();
        });

        test('leaves a rating made only of spaces unmarked', async () => {
            fillValidForm({ rating: '   ', message: 'ab' });

            await submitForm(form);

            const ratingField = document.getElementById('contact-rating');
            expect(ratingField.classList.contains('is-valid')).toBe(false);
            expect(ratingField.classList.contains('is-invalid')).toBe(false);
        });

        test('keeps the valid markers of the fields when saving fails', async () => {
            global.fetch.mockResolvedValue({ status: 500 });
            fillValidForm({ rating: '7' });

            await submitForm(form);

            ['contact-name', 'contact-email', 'contact-rating', 'contact-message'].forEach((fieldId) => {
                expect(document.getElementById(fieldId).classList.contains('is-valid')).toBe(true);
            });
        });
    });

    describe('previous results', () => {
        test('removes errors and the earlier success alert when submitting again', async () => {
            fillValidForm();
            await submitForm(form);
            expect(hasSuccessAlert()).toBe(true);

            fillValidForm({ message: 'ab' });
            await submitForm(form);

            expect(hasSuccessAlert()).toBe(false);
            expect(document.querySelectorAll('.alert')).toHaveLength(0);
            expect(errorTextOf('contact-message')).toBe('Comment must be between 3 and 300 characters.');
        });

        test('prevents the default browser submission', () => {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });

            form.dispatchEvent(submitEvent);

            expect(submitEvent.defaultPrevented).toBe(true);
        });
    });

    describe('email field live feedback', () => {
        const emailField = () => document.getElementById('contact-email');
        const typeEmail = (value) => {
            emailField().value = value;
            emailField().dispatchEvent(new Event('input', { bubbles: true }));
        };

        test('clears the error and marks the field valid once the address becomes valid', async () => {
            fillValidForm({ email: 'nope' });
            await submitForm(form);
            expect(emailField().classList.contains('is-invalid')).toBe(true);

            typeEmail('jane@example.com');

            expect(emailField().classList.contains('is-invalid')).toBe(false);
            expect(emailField().classList.contains('is-valid')).toBe(true);
            expect(errorTextOf('contact-email')).toBeNull();
        });

        test('keeps the error while the address is still invalid', async () => {
            fillValidForm({ email: 'nope' });
            await submitForm(form);

            typeEmail('still-nope');

            expect(emailField().classList.contains('is-invalid')).toBe(true);
            expect(errorTextOf('contact-email')).toBe('Please enter a valid email address.');
        });

        test('does nothing while the field is not marked invalid', () => {
            typeEmail('jane@example.com');

            expect(emailField().classList.contains('is-valid')).toBe(false);
            expect(emailField().classList.contains('is-invalid')).toBe(false);
        });
    });

    describe('collectFeedbackEntry', () => {
        test('returns trimmed text and a numeric rating', () => {
            fillForm({
                name: '  Jane Smith ',
                email: ' jane@example.com ',
                subject: ' Idea ',
                rating: ' 8 ',
                message: '  nice, tasty  '
            });

            expect(collectFeedbackEntry()).toEqual({
                name: 'Jane Smith',
                email: 'jane@example.com',
                subject: 'Idea',
                rating: 8,
                comment: 'nice, tasty'
            });
        });

        test('returns a null rating and an empty subject when they are empty', () => {
            fillValidForm({ subject: '   ', rating: '   ' });

            const entry = collectFeedbackEntry();

            expect(entry.rating).toBeNull();
            expect(entry.subject).toBe('');
        });
    });

    describe('saveFeedback', () => {
        const entry = { name: 'Jane', email: 'jane@example.com', subject: '', rating: null, comment: 'abc' };

        test('posts the entry as JSON to the feedback endpoint', async () => {
            await saveFeedback(entry);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(FEEDBACK_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
        });

        test('resolves true for status 201', async () => {
            await expect(saveFeedback(entry)).resolves.toBe(true);
        });

        test.each([200, 204, 400, 403, 413, 500])('resolves false for status %i', async (status) => {
            global.fetch.mockResolvedValue({ status });

            await expect(saveFeedback(entry)).resolves.toBe(false);
        });

        test('resolves false and logs the problem when the request fails', async () => {
            const networkError = new TypeError('Failed to fetch');
            global.fetch.mockRejectedValue(networkError);
            jest.spyOn(console, 'error').mockImplementation(() => {});

            await expect(saveFeedback(entry)).resolves.toBe(false);

            expect(console.error).toHaveBeenCalledWith('Could not reach the feedback service:', networkError);
        });
    });

    describe('saving the submitted feedback', () => {
        test('sends the entry once and shows success only after the response', async () => {
            let respond;
            global.fetch.mockReturnValue(new Promise((resolve) => { respond = resolve; }));
            fillValidForm({ subject: 'Idea', rating: '9' });

            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            await settle();

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
                name: 'Jane Smith',
                email: 'jane@example.com',
                subject: 'Idea',
                rating: 9,
                comment: 'Great recipes'
            });
            expect(hasSuccessAlert()).toBe(false);
            expect(document.getElementById('contact-name').value).toBe('Jane Smith');

            respond({ status: 201 });
            await settle();

            expect(hasSuccessAlert()).toBe(true);
            expect(document.getElementById('contact-name').value).toBe('');
        });

        test('disables the submit button while saving and ignores a second submission', async () => {
            let respond;
            global.fetch.mockReturnValue(new Promise((resolve) => { respond = resolve; }));
            fillValidForm();
            const submitButton = form.querySelector('button[type="submit"]');

            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            await settle();
            expect(submitButton.disabled).toBe(true);

            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            await settle();
            expect(global.fetch).toHaveBeenCalledTimes(1);

            respond({ status: 201 });
            await settle();
            expect(submitButton.disabled).toBe(false);
        });

        test.each([
            ['an error status', () => global.fetch.mockResolvedValue({ status: 500 })],
            ['a network error', () => {
                global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
                jest.spyOn(console, 'error').mockImplementation(() => {});
            }]
        ])('shows the failure alert, keeps the values and re-enables the button after %s', async (_description, arrange) => {
            arrange();
            fillValidForm({ subject: 'Idea', rating: '9' });

            await submitForm(form);

            const alert = form.previousElementSibling;
            expect(alert.classList.contains('alert-danger')).toBe(true);
            expect(alert.getAttribute('role')).toBe('alert');
            expect(alert.textContent).toContain(FAILURE_TEXT);
            expect(alert.querySelector('button.btn-close').getAttribute('aria-label')).toBe('Close');
            expect(hasSuccessAlert()).toBe(false);
            expect(document.getElementById('contact-name').value).toBe('Jane Smith');
            expect(document.getElementById('contact-message').value).toBe('Great recipes');
            expect(document.getElementById('contact-rating').value).toBe('9');
            expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
        });

        test('never calls the service when validation fails', async () => {
            fillValidForm({ message: 'ab' });

            await submitForm(form);

            expect(global.fetch).not.toHaveBeenCalled();
            expect(hasFailureAlert()).toBe(false);
        });

        test('removes the failure alert when the next submission starts and succeeds on retry', async () => {
            global.fetch.mockResolvedValueOnce({ status: 500 });
            fillValidForm();
            await submitForm(form);
            expect(hasFailureAlert()).toBe(true);

            await submitForm(form);

            expect(hasFailureAlert()).toBe(false);
            expect(hasSuccessAlert()).toBe(true);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('never puts visitor text into the failure alert', async () => {
            global.fetch.mockResolvedValue({ status: 500 });
            fillValidForm({ name: '<i>Jane</i>', message: '<b>x</b>' });

            await submitForm(form);

            const alert = document.querySelector('.alert-danger');
            expect(alert.textContent).not.toContain('Jane');
            expect(alert.textContent).not.toContain('x');
            expect(alert.querySelector('b, i')).toBeNull();
        });
    });

    describe('showFailureAlert', () => {
        test('inserts a dismissible danger alert before the form', () => {
            showFailureAlert(form);

            const alert = form.previousElementSibling;
            expect(alert.className).toBe('alert alert-danger alert-dismissible fade show mb-4');
            expect(alert.textContent).toContain(FAILURE_TEXT);
        });
    });
});

describe('contact form setup', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
    });

    test('does nothing when the page has neither the form nor the email field', () => {
        document.body.innerHTML = '<p>No form here</p>';

        expect(() => initializeContactForm()).not.toThrow();
    });

    test('registers the submit handler when the page has the form only', () => {
        const formOnly = document.createElement('form');
        formOnly.id = 'contact-form';
        document.body.replaceChildren(formOnly);
        const addEventListener = jest.spyOn(formOnly, 'addEventListener');

        initializeContactForm();

        expect(addEventListener).toHaveBeenCalledTimes(1);
        expect(addEventListener).toHaveBeenCalledWith('submit', validateContactForm);
    });

    test('registers the email listener when the page has the email field only', () => {
        document.body.innerHTML = '<input type="email" id="contact-email" class="is-invalid" value="jane@example.com">';
        initializeContactForm();
        const emailField = document.getElementById('contact-email');

        emailField.dispatchEvent(new Event('input', { bubbles: true }));

        expect(emailField.classList.contains('is-valid')).toBe(true);
    });

    test('initializes the form when the document finishes loading', async () => {
        const form = renderContactForm();
        global.fetch = jest.fn(savedResponse);
        fillValidForm();

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await submitForm(form);

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
