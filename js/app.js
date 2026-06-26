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

    const cardWidth = card.offsetWidth + 24; // card width + gap
    this.track.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
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

// ---- Media Manager (Audio & Video Player) ----
const MediaManager = {
  init() {
    this.audio = document.getElementById('html5-audio');
    this.playBtn = document.getElementById('audio-play-btn');
    this.progress = document.getElementById('audio-progress');
    this.volume = document.getElementById('audio-volume');
    this.currentTimeEl = document.getElementById('audio-current-time');
    this.durationEl = document.getElementById('audio-duration');
    this.visualizer = document.getElementById('audio-visualizer');
    this.trackTitle = document.getElementById('audio-track-title');
    this.playlistItems = document.querySelectorAll('.playlist-item');
    this.videoIframe = document.getElementById('video-iframe');
    this.videoItems = document.querySelectorAll('.video-item');

    if (!this.audio) return;

    // Play/Pause button
    this.playBtn.addEventListener('click', () => this.togglePlay());

    // Time update
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    
    // Loaded metadata to set initial duration
    this.audio.addEventListener('loadedmetadata', () => {
      this.durationEl.textContent = this.formatTime(this.audio.duration);
    });

    // Seek progress
    this.progress.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      this.audio.currentTime = (pct / 100) * this.audio.duration;
    });

    // Volume adjustment
    this.volume.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value) / 100;
      this.audio.volume = vol;
    });

    // Track ended → play next or loop
    this.audio.addEventListener('ended', () => {
      this.visualizer.classList.remove('playing');
      this.playBtn.textContent = '▶';
    });

    // Audio Playlist selection
    this.playlistItems.forEach(item => {
      item.addEventListener('click', () => {
        this.playlistItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const src = item.dataset.src;
        const name = item.querySelector('.track-name').textContent;
        
        this.trackTitle.textContent = name;
        this.audio.src = src;
        this.audio.load();
        
        this.play();
      });
    });

    // Video Playlist selection
    this.videoItems.forEach(item => {
      item.addEventListener('click', () => {
        this.videoItems.forEach(v => v.classList.remove('active'));
        item.classList.add('active');
        
        const src = item.dataset.src;
        this.videoIframe.src = src;
      });
    });
  },

  togglePlay() {
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  },

  play() {
    this.audio.play().then(() => {
      this.playBtn.textContent = '⏸';
      this.visualizer.classList.add('playing');
    }).catch(err => console.log("Play failed: ", err));
  },

  pause() {
    this.audio.pause();
    this.playBtn.textContent = '▶';
    this.visualizer.classList.remove('playing');
  },

  onTimeUpdate() {
    if (!this.audio.duration) return;
    const pct = (this.audio.currentTime / this.audio.duration) * 100;
    this.progress.value = pct;
    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
  },

  formatTime(secs) {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
};

// ---- Calendar & Events Manager ----
const CalendarManager = {
  events: {
    '2026-07-05': {
      title: 'Surah Al-Mulk Study Circle',
      type: 'Weekly Circle',
      time: 'Sundays at 11:00 AM EST',
      location: 'Online via Zoom / Live Stream',
      desc: 'Join us for a weekly reflection on the themes and lessons of Surah Al-Mulk, focusing on the majesty of Allah\'s creation and our purpose in life.',
      link: 'https://nurulquranlive.com/'
    },
    '2026-07-12': {
      title: 'Surah Al-Mulk Study Circle',
      type: 'Weekly Circle',
      time: 'Sundays at 11:00 AM EST',
      location: 'Online via Zoom / Live Stream',
      desc: 'Join us for a weekly reflection on the themes and lessons of Surah Al-Mulk, focusing on the majesty of Allah\'s creation and our purpose in life.',
      link: 'https://nurulquranlive.com/'
    },
    '2026-07-15': {
      title: 'Tajweed Masterclass for Beginners',
      type: 'Seminar',
      time: 'Wednesday at 6:30 PM EST',
      location: 'Onsite (Boston, USA) & Online',
      desc: 'A live interactive workshop focusing on the correct articulation points (Makharij) of Arabic letters. Essential for anyone wanting to improve their recitation.',
      link: 'https://nurulquran.com/seminars/'
    },
    '2026-07-19': {
      title: 'Surah Al-Mulk Study Circle',
      type: 'Weekly Circle',
      time: 'Sundays at 11:00 AM EST',
      location: 'Online via Zoom / Live Stream',
      desc: 'Join us for a weekly reflection on the themes and lessons of Surah Al-Mulk, focusing on the majesty of Allah\'s creation and our purpose in life.',
      link: 'https://nurulquranlive.com/'
    },
    '2026-07-24': {
      title: 'Youth Summer Program Kickoff',
      type: 'Youth Program',
      time: 'Friday at 5:00 PM EST',
      location: 'NurulQuran Center USA & UK Branches',
      desc: 'An inspiring program kickoff for teenagers and youth. Features team-building activities, interactive discussions, and spiritual lessons.',
      link: 'https://nurulquran.com/teens/'
    },
    '2026-07-26': {
      title: 'Surah Al-Mulk Study Circle',
      type: 'Weekly Circle',
      time: 'Sundays at 11:00 AM EST',
      location: 'Online via Zoom / Live Stream',
      desc: 'Join us for a weekly reflection on the themes and lessons of Surah Al-Mulk, focusing on the majesty of Allah\'s creation and our purpose in life.',
      link: 'https://nurulquranlive.com/'
    }
  },

  init() {
    this.daysGrid = document.getElementById('calendar-days-grid');
    this.monthYearEl = document.getElementById('calendar-month-year');
    this.prevBtn = document.getElementById('prev-month');
    this.nextBtn = document.getElementById('next-month');
    
    this.detailEmpty = document.getElementById('event-detail-empty');
    this.detailContent = document.getElementById('event-detail-content');
    this.detailTag = document.getElementById('event-type-tag');
    this.detailTitle = document.getElementById('event-detail-title');
    this.detailTime = document.getElementById('event-detail-time');
    this.detailLoc = document.getElementById('event-detail-location');
    this.detailDesc = document.getElementById('event-detail-desc');
    this.detailCta = document.getElementById('event-detail-cta');

    // Tabs
    this.tabCalendar = document.getElementById('tab-calendar');
    this.tabTrips = document.getElementById('tab-trips');
    this.panelCalendar = document.getElementById('calendar-panel');
    this.panelTrips = document.getElementById('trips-panel');

    if (!this.daysGrid) return;

    // Set current active date (July 2026)
    this.currentYear = 2026;
    this.currentMonth = 6; // 0-indexed: 6 = July
    
    this.renderCalendar();
    this.setupTabs();

    this.prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    this.nextBtn.addEventListener('click', () => this.navigateMonth(1));
  },

  setupTabs() {
    const togglePanel = (showCal) => {
      this.tabCalendar.classList.toggle('active', showCal);
      this.tabCalendar.setAttribute('aria-selected', String(showCal));
      this.tabTrips.classList.toggle('active', !showCal);
      this.tabTrips.setAttribute('aria-selected', String(!showCal));

      this.panelCalendar.classList.toggle('active', showCal);
      this.panelTrips.classList.toggle('active', !showCal);
    };

    this.tabCalendar?.addEventListener('click', () => togglePanel(true));
    this.tabTrips?.addEventListener('click', () => togglePanel(false));
  },

  navigateMonth(dir) {
    this.currentMonth += dir;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
    
    // Reset selection card
    this.detailContent.classList.add('hidden');
    this.detailEmpty.classList.remove('hidden');
  },

  renderCalendar() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.monthYearEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
    
    this.daysGrid.innerHTML = '';

    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    // Empty cells for alignment before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'cal-day empty';
      this.daysGrid.appendChild(emptyDiv);
    }

    // Days in current month
    for (let day = 1; day <= lastDay; day++) {
      const dayButton = document.createElement('button');
      dayButton.className = 'cal-day';
      dayButton.textContent = day;
      
      const dateString = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      if (this.events[dateString]) {
        dayButton.classList.add('has-event');
        dayButton.setAttribute('aria-label', `Day ${day}, has event: ${this.events[dateString].title}`);
        
        // Add dot marker
        const dot = document.createElement('span');
        dot.className = 'event-dot';
        dayButton.appendChild(dot);
        
        dayButton.addEventListener('click', () => this.showEvent(dateString, dayButton));
      } else {
        dayButton.setAttribute('aria-label', `Day ${day}`);
      }

      this.daysGrid.appendChild(dayButton);
    }
  },

  showEvent(dateString, element) {
    const event = this.events[dateString];
    if (!event) return;

    // Highlight selected day
    this.daysGrid.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Fill event details
    this.detailTag.textContent = event.type;
    this.detailTitle.textContent = event.title;
    this.detailTime.textContent = event.time;
    this.detailLoc.textContent = event.location;
    this.detailDesc.textContent = event.desc;
    this.detailCta.href = event.link;

    // Swap displays
    this.detailEmpty.classList.add('hidden');
    this.detailContent.classList.remove('hidden');
  }
};

// ---- Initialize Everything ----
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  StarField.init();
  ScrollReveal.init();
  StatCounter.init();
  TestimonialCarousel.init();
  MediaManager.init();
  CalendarManager.init();
  initSmoothScroll();
});
