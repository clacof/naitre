/* scroll/tilt.js — tarjetas IA con inclinación 3D al puntero. */

export const initTilt = () => {
  document.querySelectorAll('.ai-card').forEach(card => {
    const max = 8; // grados
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('tilting');
      card.style.transform =
        `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(6px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      setTimeout(() => card.classList.remove('tilting'), 160);
    });
  });
};
