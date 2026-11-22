const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Split headings into words that each slide up out of a mask
document.querySelectorAll('[data-words]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words
    .map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${w}</span></span>`)
    .join(' ');
  el.dataset.slide = 'words';
});

// Discography covers slide in from alternating sides, staggered along each row
const releases = [...document.querySelectorAll('.release')];
function setReleaseDirections() {
  const cols = getComputedStyle(document.querySelector('.release-grid')).gridTemplateColumns.split(' ').length;
  releases.forEach((el, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (!el.classList.contains('in')) el.dataset.slide = row % 2 ? 'right' : 'left';
    el.style.setProperty('--d', `${(row % 2 ? cols - 1 - col : col) * 80}ms`);
  });
}
setReleaseDirections();

// Reveal on enter
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-slide], [data-wipe]').forEach((el) => io.observe(el));

// ---- Scroll-linked: colour shift, parallax, sideways gallery, nav ----
// Lovro (white + navy) → deep navy → Blurfnes (black + red)
const STOPS = [
  { bg: [245, 246, 249], fg: [12, 22, 54],    accent: [26, 43, 109] },
  { bg: [11, 19, 52],    fg: [236, 239, 250], accent: [143, 163, 255] },
  { bg: [6, 6, 7],       fg: [242, 242, 242], accent: [225, 15, 26] },
];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const at = (key, t) => (t < 0.5
  ? mix(STOPS[0][key], STOPS[1][key], t * 2)
  : mix(STOPS[1][key], STOPS[2][key], (t - 0.5) * 2));
const rgb = (c, a = 1) => `rgba(${c.join(',')},${a})`;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);

const nav = document.querySelector('.nav');
const hero = document.querySelector('.hero');
const heroBg = document.querySelector('[data-parallax]');
const shift = document.querySelector('#shift');
const gallery = document.querySelector('.gallery');
const track = document.querySelector('[data-hscroll]');
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));

let lastP = -1;
function applyTheme(p) {
  if (p === lastP) return;
  lastP = p;
  const t = ease(p);
  const fg = at('fg', t);
  root.style.setProperty('--p', p.toFixed(4));
  root.style.setProperty('--bg', rgb(at('bg', t)));
  root.style.setProperty('--fg', rgb(fg));
  root.style.setProperty('--muted', rgb(fg, 0.66));
  root.style.setProperty('--line', rgb(fg, 0.14));
  root.style.setProperty('--accent', rgb(at('accent', t)));
}

let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  // Colour shift runs across the pinned #shift section, starting a little before it
  const start = shift.offsetTop - vh * 0.35;
  const end = shift.offsetTop + shift.offsetHeight - vh;
  applyTheme(clamp01((y - start) / (end - start)));

  root.style.setProperty('--scroll', clamp01(y / (root.scrollHeight - vh)).toFixed(4));

  nav.classList.toggle('on-dark', y < hero.offsetHeight - 60);
  nav.classList.toggle('scrolled', y > 40);

  if (!reduceMotion) {
    if (y < vh) heroBg.style.transform = `translateY(${y * 0.3}px)`;

    // Gallery track slides from right to left as the section passes through
    const r = gallery.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const g = clamp01((vh - r.top) / (vh + r.height));
      const travel = track.scrollWidth - root.clientWidth;
      track.style.transform = `translateX(${(-g * travel).toFixed(1)}px)`;
    }
  }

  const mid = y + vh * 0.4;
  let current = -1;
  sections.forEach((s, i) => { if (s && s.offsetTop <= mid) current = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
window.addEventListener('resize', () => { setReleaseDirections(); onScroll(); });
onScroll();
