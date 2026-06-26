/* ============================================================
   NurulQuran — Main Application
   Handles: Theme toggle, navigation, scroll effects,
            animations, testimonial carousel, star field
   ============================================================ */

// ---- Theme Management ----
const ThemeManager = {
  init() {
    this.toggle = document.getElementById('theme-toggle');
    this.icon = this.toggle?.querySelector('.theme-icon');
    this.meta = document.querySelector('meta[name="color-scheme"]');

    // Determine current state
    this.updateIcon();

    this.toggle?.addEventListener('click', () => this.cycle());

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!localStorage.getItem('nq-theme')) this.updateIcon();
    });
  },

  isDark() {
    const manual = localStorage.getItem('nq-theme');
    if (manual) return manual === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  cycle() {
    const currentManual = localStorage.getItem('nq-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (!currentManual) {
      // Currently following system → switch to opposite
      const opposite = systemDark ? 'light' : 'dark';
      localStorage.setItem('nq-theme', opposite);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(opposite);
      this.meta.content = opposite;
    } else {
      // Currently pinned → return to system
      localStorage.removeItem('nq-theme');
      document.documentElement.classList.remove('light', 'dark');
      this.meta.content = 'light dark';
    }

    this.updateIcon();
  },

  updateIcon() {
    if (!this.icon) return;
    this.icon.textContent = this.isDark() ? '☀️' : '🌙';
    this.toggle.setAttribute('aria-label',
      this.isDark() ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }
};

// ---- Navigation ----
const NavManager = {
  init() {
    this.navbar = document.getElementById('navbar');
    this.navLinks = document.getElementById('nav-links');
    this.navToggle = document.getElementById('nav-toggle');
    this.links = document.querySelectorAll('.nav-links a');

    // Scroll state
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();

    // Mobile toggle
    this.navToggle?.addEventListener('click', () => this.toggleMobile());

    // Close mobile menu on link click
    this.links.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobile();
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.navLinks?.classList.contains('open')) {
        this.closeMobile();
        this.navToggle?.focus();
      }
    });

    // Active section tracking
    this.setupActiveTracking();
  },

  onScroll() {
    const scrolled = window.scrollY > 50;
    this.navbar?.classList.toggle('scrolled', scrolled);
  },

  toggleMobile() {
    const isOpen = this.navLinks?.classList.toggle('open');
    this.navToggle?.setAttribute('aria-expanded', String(isOpen));
    this.navToggle.querySelector('span').textContent = isOpen ? '✕' : '☰';
  },

  closeMobile() {
    this.navLinks?.classList.remove('open');
    this.navToggle?.setAttribute('aria-expanded', 'false');
    if (this.navToggle) this.navToggle.querySelector('span').textContent = '☰';
  },

  setupActiveTracking() {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

    sections.forEach(section => observer.observe(section));
  }
};

// ---- Scroll Reveal Animations ----
const ScrollReveal = {
  init() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Make everything visible immediately
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      observer.observe(el);
    });
  }
};

// ---- Star Field Generator ----
const StarField = {
  init() {
    const container = document.getElementById('hero-stars');
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = prefersReduced ? 30 : 60;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
      star.style.setProperty('--delay', `${Math.random() * 3}s`);
      star.style.width = `${1 + Math.random() * 3}px`;
      star.style.height = star.style.width;
      container.appendChild(star);
    }
  }
};

// ---- Stat Counter Animation ----
const StatCounter = {
  init() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target, prefersReduced);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  },

  animate(el, instant = false) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.count.replace(/\d/g, ''); // e.g., "+"
    const hasPlus = el.dataset.count.includes('+');

    if (instant) {
      el.textContent = target.toLocaleString() + (hasPlus ? '+' : '');
      return;
    }

    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + (hasPlus ? '+' : '');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + (hasPlus ? '+' : '');
      }
    };

    requestAnimationFrame(step);
  }
};

// ---- Testimonial Carousel ----
const TestimonialCarousel = {
  init() {
    this.track = document.getElementById('testimonials-track');
    this.dotsContainer = document.getElementById('testimonials-dots');
    if (!this.track || !this.dotsContainer) return;

    this.cards = this.track.querySelectorAll('.testimonial-card');
    this.currentIndex = 0;
    this.autoplayInterval = null;

    // Create dots
    this.cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    });

    this.dots = this.dotsContainer.querySelectorAll('.dot');

    // Track scroll position to update dots
    this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Auto-scroll
    this.startAutoplay();

    // Pause on hover/focus
    this.track.addEventListener('mouseenter', () => this.stopAutoplay());
    this.track.addEventListener('mouseleave', () => this.startAutoplay());
    this.track.addEventListener('focusin', () => this.stopAutoplay());
    this.track.addEventListener('focusout', () => this.startAutoplay());
  },

  onScroll() {
    const scrollLeft = this.track.scrollLeft;
    const cardWidth = this.cards[0]?.offsetWidth + 24; // gap
    const newIndex = Math.round(scrollLeft / cardWidth);

    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      this.updateDots();
    }
  },

  goTo(index) {
    const card = this.cards[index];
    if (!card) return;

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    this.currentIndex = index;
    this.updateDots();
  },

  updateDots() {
    this.dots?.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });
  },

  startAutoplay() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      const next = (this.currentIndex + 1) % this.cards.length;
      this.goTo(next);
    }, 5000);
  },

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
};

// ---- Smooth Scroll for anchor links ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });

        // Update URL without scroll jump
        history.pushState(null, '', href);
      }
    });
  });
}

// ---- Initialize Everything ----
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  StarField.init();
  ScrollReveal.init();
  StatCounter.init();
  TestimonialCarousel.init();
  initSmoothScroll();
});
