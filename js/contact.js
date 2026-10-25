// Local save service started with `npm run start:feedback-service`; replace when the real backend arrives.
const FEEDBACK_ENDPOINT = 'http://localhost:3001/api/feedback';

const SAVE_SUCCESS_MESSAGE = 'Your message has been sent successfully! We will get back to you soon.';
const SAVE_FAILURE_MESSAGE = 'We could not send your message. Please try again later.';

function validateRequiredText(fieldId, minLength) {
    const input = document.getElementById(fieldId);
    if (!input) return { fieldId, isValid: true, errorMessage: null };
    const value = input.value.trim();
    const isValid = value.length >= minLength;
    return {
        fieldId,
        isValid,
        errorMessage: isValid ? null : `Please fill in this field (at least ${minLength} characters).`
    };
}

function validateEmailField(input) {
    const value = input.value.trim();
    const isValid = EMAIL_PATTERN.test(value);
    return {
        fieldId: input.id,
        isValid,
        errorMessage: isValid ? null : EMAIL_ERROR_MESSAGE
    };
}

function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    let feedback = input.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.after(feedback);
    }
    feedback.textContent = message;
}

function showFieldValid(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    const feedback = input.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();
}

function clearFieldErrors(form) {
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    const existingAlert = form.previousElementSibling;
    if (existingAlert?.classList.contains('alert')) {
        existingAlert.remove();
    }
}

// Only the fixed messages above are ever placed into the markup, never visitor text.
function insertAlert(form, variant, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${variant} alert-dismissible fade show mb-4`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    form.before(alert);
}

function showSuccessAlert(form) {
    insertAlert(form, 'success', SAVE_SUCCESS_MESSAGE);
}

function showFailureAlert(form) {
    insertAlert(form, 'danger', SAVE_FAILURE_MESSAGE);
}

function collectFeedbackEntry() {
    const subjectInput = document.getElementById('contact-subject');
    const ratingText = document.getElementById('contact-rating').value.trim();
    return {
        name: document.getElementById('contact-name').value.trim(),
        // An email input removes surrounding whitespace from its value itself.
        email: document.getElementById('contact-email').value,
        subject: subjectInput ? subjectInput.value.trim() : '',
        rating: ratingText === '' ? null : Number(ratingText),
        comment: document.getElementById('contact-message').value.trim()
    };
}

// Resolves true only when the service confirms that the entry was stored (HTTP 201).
async function saveFeedback(entry) {
    try {
        const response = await fetch(FEEDBACK_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        return response.status === 201;
    } catch (error) {
        console.error('Could not reach the feedback service:', error);
        return false;
    }
}

async function validateContactForm(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    clearFieldErrors(form);

    const errors = [];

    const nameResult = validateRequiredText('contact-name', NAME_MIN_LENGTH);
    if (!nameResult.isValid) {
        errors.push('contact-name');
        showFieldError('contact-name', NAME_ERROR_MESSAGE);
    } else {
        showFieldValid('contact-name');
    }

    const emailInput = document.getElementById('contact-email');
    const emailResult = validateEmailField(emailInput);
    if (!emailResult.isValid) {
        errors.push('contact-email');
        showFieldError('contact-email', EMAIL_ERROR_MESSAGE);
    } else {
        showFieldValid('contact-email');
    }

    const subjectInput = document.getElementById('contact-subject');
    if (subjectInput && subjectInput.value.trim().length > 0) {
        const subjectResult = validateRequiredText('contact-subject', SUBJECT_MIN_LENGTH);
        if (!subjectResult.isValid) {
            errors.push('contact-subject');
            showFieldError('contact-subject', SUBJECT_ERROR_MESSAGE);
        } else {
            showFieldValid('contact-subject');
        }
    }

    const ratingValue = document.getElementById('contact-rating').value;
    if (ratingValue.trim().length > 0) {
        const ratingResult = validateRating(ratingValue);
        if (!ratingResult.isValid) {
            errors.push('contact-rating');
            showFieldError('contact-rating', ratingResult.errorMessage);
        } else {
            showFieldValid('contact-rating');
        }
    }

    const messageResult = validateComment(document.getElementById('contact-message').value);
    if (!messageResult.isValid) {
        errors.push('contact-message');
        showFieldError('contact-message', messageResult.errorMessage);
    } else {
        showFieldValid('contact-message');
    }

    if (errors.length > 0) {
        document.getElementById(errors[0]).focus();
        return;
    }

    submitButton.disabled = true;
    try {
        const isSaved = await saveFeedback(collectFeedbackEntry());
        if (isSaved) {
            showSuccessAlert(form);
            form.reset();
            form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        } else {
            showFailureAlert(form);
        }
    } finally {
        submitButton.disabled = false;
    }
}

function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', validateContactForm);
    }

    const emailInput = document.getElementById('contact-email');
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('is-invalid')) {
                const result = validateEmailField(emailInput);
                if (result.isValid) {
                    showFieldValid('contact-email');
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeContactForm);

// The export exists only for tests; browsers have no module object.
/* istanbul ignore else -- browser-only branch cannot run in the test environment */
// Stryker disable next-line all: browser-only branch cannot run in the test environment
if (typeof module !== 'undefined') {
    module.exports = {
        validateRequiredText,
        validateEmailField,
        showFieldError,
        showFieldValid,
        clearFieldErrors,
        showSuccessAlert,
        showFailureAlert,
        collectFeedbackEntry,
        saveFeedback,
        validateContactForm,
        initializeContactForm
    };
}
