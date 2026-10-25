const {
    validateRequiredText,
    validateEmailField,
    showFieldError,
    showFieldValid,
    clearFieldErrors,
    showSuccessAlert
} = require('../../js/contact.js');
const { renderContactForm, fillForm } = require('./helpers/contact-form-fixture.js');

describe('contact form helpers', () => {
    let form;

    beforeEach(() => {
        form = renderContactForm();
    });

    describe('validateRequiredText', () => {
        test('treats a missing element as valid', () => {
            expect(validateRequiredText('does-not-exist', 5)).toEqual({
                fieldId: 'does-not-exist',
                isValid: true,
                errorMessage: null
            });
        });

        test.each([
            ['abc', 3, true],
            ['ab', 3, false],
            ['', 1, false],
            ['  abc  ', 3, true],
            ['  ab  ', 3, false]
        ])('value %j with minimum %i gives isValid=%s', (value, minLength, expectedIsValid) => {
            fillForm({ name: value });

            const result = validateRequiredText('contact-name', minLength);

            expect(result.fieldId).toBe('contact-name');
            expect(result.isValid).toBe(expectedIsValid);
        });

        test('returns the minimum length in the error message when invalid', () => {
            fillForm({ name: 'a' });

            expect(validateRequiredText('contact-name', 4).errorMessage)
                .toBe('Please fill in this field (at least 4 characters).');
        });

        test('returns no error message when valid', () => {
            fillForm({ name: 'abcd' });

            expect(validateRequiredText('contact-name', 4).errorMessage).toBeNull();
        });
    });

    describe('validateEmailField', () => {
        const emailInput = () => document.getElementById('contact-email');

        test.each([
            ['jane@example.com', true],
            ['  jane@example.com  ', true],
            ['jane.example.com', false],
            ['jane@example', false],
            ['jane @example.com', false],
            ['@example.com', false],
            ['jane@.com', false],
            ['jane@a.b', true],
            ['', false]
        ])('email %j gives isValid=%s', (value, expectedIsValid) => {
            emailInput().value = value;

            const result = validateEmailField(emailInput());

            expect(result.fieldId).toBe('contact-email');
            expect(result.isValid).toBe(expectedIsValid);
        });

        test('returns the error message only when invalid', () => {
            emailInput().value = 'nope';
            expect(validateEmailField(emailInput()).errorMessage).toBe('Please enter a valid email address.');

            emailInput().value = 'jane@example.com';
            expect(validateEmailField(emailInput()).errorMessage).toBeNull();
        });

        test.each([
            ['  jane@example.com  ', true],
            ['a b@example.com', false],
            ['jane@example.com x', false],
            ['x jane@example.com', false],
            ['jane@example.com\njane@example.com', false]
        ])('checks the whole text of any input-like object: %j gives isValid=%s', (value, expectedIsValid) => {
            expect(validateEmailField({ id: 'detached', value }).isValid).toBe(expectedIsValid);
        });
    });

    describe('showFieldError', () => {
        test('does nothing when the element is missing', () => {
            expect(() => showFieldError('does-not-exist', 'Message')).not.toThrow();
            expect(document.querySelector('.invalid-feedback')).toBeNull();
        });

        test('marks the field invalid and adds a message element after it', () => {
            showFieldError('contact-name', 'Name problem');

            const input = document.getElementById('contact-name');
            expect(input.classList.contains('is-invalid')).toBe(true);
            expect(input.nextElementSibling.className).toBe('invalid-feedback');
            expect(input.nextElementSibling.textContent).toBe('Name problem');
        });

        test('reuses and updates an existing message element', () => {
            showFieldError('contact-name', 'First');
            showFieldError('contact-name', 'Second');

            const messages = document.getElementById('contact-name').parentElement.querySelectorAll('.invalid-feedback');
            expect(messages).toHaveLength(1);
            expect(messages[0].textContent).toBe('Second');
        });

        test('replaces the valid marker with the invalid marker', () => {
            const input = document.getElementById('contact-name');
            input.classList.add('is-valid');

            showFieldError('contact-name', 'Problem');

            expect(input.classList.contains('is-valid')).toBe(false);
            expect(input.classList.contains('is-invalid')).toBe(true);
        });
    });

    describe('showFieldValid', () => {
        test('does nothing when the element is missing', () => {
            expect(() => showFieldValid('does-not-exist')).not.toThrow();
        });

        test('marks the field valid and removes an existing error message', () => {
            showFieldError('contact-name', 'Problem');

            showFieldValid('contact-name');

            const input = document.getElementById('contact-name');
            expect(input.classList.contains('is-invalid')).toBe(false);
            expect(input.classList.contains('is-valid')).toBe(true);
            expect(input.parentElement.querySelector('.invalid-feedback')).toBeNull();
        });

        test('works when the field has no error message', () => {
            showFieldValid('contact-name');

            expect(document.getElementById('contact-name').classList.contains('is-valid')).toBe(true);
        });
    });

    describe('clearFieldErrors', () => {
        test('removes validation classes and all error messages', () => {
            showFieldError('contact-name', 'Problem');
            showFieldValid('contact-email');

            clearFieldErrors(form);

            expect(form.querySelectorAll('.is-invalid, .is-valid')).toHaveLength(0);
            expect(form.querySelectorAll('.invalid-feedback')).toHaveLength(0);
        });

        test('removes an alert placed directly before the form', () => {
            showSuccessAlert(form);

            clearFieldErrors(form);

            expect(document.querySelector('.alert')).toBeNull();
        });

        test('keeps a preceding element that is not an alert', () => {
            const note = document.createElement('p');
            note.id = 'note';
            form.before(note);

            clearFieldErrors(form);

            expect(document.getElementById('note')).not.toBeNull();
        });

        test('works when the form has no preceding sibling', () => {
            const isolatedForm = document.createElement('form');

            expect(() => clearFieldErrors(isolatedForm)).not.toThrow();
        });
    });

    describe('showSuccessAlert', () => {
        test('inserts a dismissible success alert before the form', () => {
            showSuccessAlert(form);

            const alert = form.previousElementSibling;
            expect(alert.classList.contains('alert-success')).toBe(true);
            expect(alert.getAttribute('role')).toBe('alert');
            expect(alert.textContent).toContain('Your message has been sent successfully! We will get back to you soon.');
            expect(alert.querySelector('button.btn-close').getAttribute('aria-label')).toBe('Close');
        });
    });
});
