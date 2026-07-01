/* scroll/magnetic.js — botones magnéticos (solo puntero fino). */

export const initMagnetic = () => {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('mag');
    const strength = 0.32;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * strength}px, ${y * strength - 2}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
};
