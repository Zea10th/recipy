function initScrollReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-scroll-reveal]').forEach(el => observer.observe(el));
}

function initKeyFeatureHover() {
    document.querySelectorAll('#key-features li').forEach(item => {
        item.addEventListener('mouseover', () => item.classList.add('key-feature--highlighted'));
        item.addEventListener('mouseout', () => item.classList.remove('key-feature--highlighted'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initKeyFeatureHover();
});