// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Nav active-section highlight
const sections = document.querySelectorAll('main .section');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach((section) => {
  if (section.id) sectionObserver.observe(section);
});

// Subtle animated grid background
const canvas = document.getElementById('bg-grid');
const ctx = canvas.getContext('2d');
let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const spacing = 48;
let t = 0;

function draw() {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.06)';
  ctx.lineWidth = 1;

  const offset = (t * 0.15) % spacing;

  for (let x = -spacing + offset; x < w + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -spacing + offset; y < h + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  t += 1;
  requestAnimationFrame(draw);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  draw();
} else {
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.06)';
  for (let x = 0; x < w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}
