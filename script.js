document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".tool-card");
    cards.forEach((card, i) => {
        card.style.animationDelay = `${i * 0.12}s`;
    });
});
