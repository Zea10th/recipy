const CONTACT_FORM_MARKUP = `
    <section id="contact">
        <form id="contact-form" novalidate>
            <div class="contact-form__field mb-3">
                <label for="contact-name" class="form-label">Your Name</label>
                <input type="text" id="contact-name" name="name" class="form-control" required>
            </div>
            <div class="contact-form__field mb-3">
                <label for="contact-email" class="form-label">Email Address</label>
                <input type="email" id="contact-email" name="email" class="form-control" required>
            </div>
            <div class="contact-form__field mb-3">
                <label for="contact-subject" class="form-label">Subject</label>
                <input type="text" id="contact-subject" name="subject" class="form-control">
            </div>
            <div class="contact-form__field mb-3">
                <label for="contact-rating" class="form-label">Rating (1–10)</label>
                <input type="text" id="contact-rating" name="rating" class="form-control" inputmode="numeric">
            </div>
            <div class="contact-form__field mb-3">
                <label for="contact-message" class="form-label">Message</label>
                <textarea id="contact-message" name="message" class="form-control" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Send Message</button>
        </form>
    </section>`;

const FIELD_IDS_BY_PROPERTY = {
    name: 'contact-name',
    email: 'contact-email',
    subject: 'contact-subject',
    rating: 'contact-rating',
    message: 'contact-message'
};

function renderContactForm() {
    document.body.innerHTML = CONTACT_FORM_MARKUP;
    return document.getElementById('contact-form');
}

function fillForm(values) {
    Object.entries(values).forEach(([property, value]) => {
        document.getElementById(FIELD_IDS_BY_PROPERTY[property]).value = value;
    });
}

function fillValidForm(overrides = {}) {
    fillForm({
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: '',
        rating: '',
        message: 'Great recipes',
        ...overrides
    });
}

module.exports = { renderContactForm, fillForm, fillValidForm };
