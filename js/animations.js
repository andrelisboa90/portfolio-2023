// js/animations.js
document.addEventListener("DOMContentLoaded", () => {
    const statsSection = document.querySelector(".stats-container");

    if (!statsSection) return;

    const observerOptions = {
        root: null,
        threshold: 0.01 // Dispara quando 20% do elemento estiver visível
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observerInstance.unobserve(entry.target); // Anima apenas uma vez
            }
        });
    }, observerOptions);

    observer.observe(statsSection);
});