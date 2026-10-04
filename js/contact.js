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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const value = (input.value || '').trim();
    const isValid = emailRegex.test(value);
    return {
        fieldId: input.id,
        isValid,
        errorMessage: isValid ? null : 'Please enter a valid email address.'
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

function showSuccessAlert(form) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show mb-4';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        Your message has been sent successfully! We will get back to you soon.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    form.before(alert);
}

function validateContactForm(event) {
    event.preventDefault();
    const form = event.target;
    clearFieldErrors(form);

    const errors = [];

    const nameResult = validateRequiredText('contact-name', 2);
    if (!nameResult.isValid) {
        errors.push('contact-name');
        showFieldError('contact-name', 'Please enter your name (at least 2 characters).');
    } else {
        showFieldValid('contact-name');
    }

    const emailInput = document.getElementById('contact-email');
    const emailResult = validateEmailField(emailInput);
    if (!emailResult.isValid) {
        errors.push('contact-email');
        showFieldError('contact-email', 'Please enter a valid email address.');
    } else {
        showFieldValid('contact-email');
    }

    const subjectInput = document.getElementById('contact-subject');
    if (subjectInput && subjectInput.value.trim().length > 0) {
        const subjectResult = validateRequiredText('contact-subject', 3);
        if (!subjectResult.isValid) {
            errors.push('contact-subject');
            showFieldError('contact-subject', 'Subject must be at least 3 characters.');
        } else {
            showFieldValid('contact-subject');
        }
    }

    const messageResult = validateRequiredText('contact-message', 10);
    if (!messageResult.isValid) {
        errors.push('contact-message');
        showFieldError('contact-message', 'Please enter a message (at least 10 characters).');
    } else {
        showFieldValid('contact-message');
    }

    if (errors.length > 0) {
        document.getElementById(errors[0]).focus();
        return;
    }

    showSuccessAlert(form);
    form.reset();
    form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
}

document.addEventListener('DOMContentLoaded', () => {
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
});
