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
    document.body.classList.toggle('menu-open', isOpen);
  },

  closeMobile() {
    this.navLinks?.classList.remove('open');
    this.navToggle?.setAttribute('aria-expanded', 'false');
    if (this.navToggle) this.navToggle.querySelector('span').textContent = '☰';
    document.body.classList.remove('menu-open');
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
    this.prevBtn = document.getElementById('testi-prev');
    this.nextBtn = document.getElementById('testi-next');

    if (!this.track) return;

    this.cards = this.track.querySelectorAll('.testimonial-card');
    if (!this.cards.length) return;

    this.currentIndex = 0;
    this.autoplayInterval = null;
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;

    this.updatePagination();
    this.setupListeners();
    this.startAutoplay();
  },

  updatePagination() {
    if (!this.track || !this.cards.length) return;
    const trackWidth = this.track.clientWidth;
    const cardWidth = (this.cards[0]?.offsetWidth || 360) + 24;
    const visibleCount = Math.max(1, Math.floor(trackWidth / cardWidth));
    const totalPages = Math.max(1, this.cards.length - visibleCount + 1);
    this.pageCount = Math.min(4, totalPages);

    this.renderDots();
  },

  renderDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    if (this.pageCount <= 1) return;

    for (let i = 0; i < this.pageCount; i++) {
      const dot = document.createElement('button');
      dot.className = `dot${i === this.currentIndex ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Testimonials Slide ${i + 1}`);
      dot.addEventListener('click', () => this.goToPage(i));
      this.dotsContainer.appendChild(dot);
    }
  },

  setupListeners() {
    // Arrow buttons
    if (this.prevBtn) {
      this.prevBtn.onclick = () => {
        this.stopAutoplay();
        this.scrollPrev();
      };
    }

    if (this.nextBtn) {
      this.nextBtn.onclick = () => {
        this.stopAutoplay();
        this.scrollNext();
      };
    }

    // Scroll listener for dot sync
    let scrollTimeout;
    this.track.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.syncDotsWithScroll(), 60);
    }, { passive: true });

    // Mouse drag scrolling
    this.track.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.track.classList.add('is-dragging');
      this.startX = e.pageX - this.track.offsetLeft;
      this.scrollLeft = this.track.scrollLeft;
      this.stopAutoplay();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - this.track.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      this.track.scrollLeft = this.scrollLeft - walk;
    });

    window.addEventListener('mouseup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.track.classList.remove('is-dragging');
      this.startAutoplay();
    });

    // Pause on hover
    this.track.addEventListener('mouseenter', () => this.stopAutoplay());
    this.track.addEventListener('mouseleave', () => {
      if (!this.isDragging) this.startAutoplay();
    });

    // Touch events
    this.track.addEventListener('touchstart', () => this.stopAutoplay(), { passive: true });
    this.track.addEventListener('touchend', () => this.startAutoplay(), { passive: true });

    // Window resize
    window.addEventListener('resize', () => {
      this.updatePagination();
    });
  },

  syncDotsWithScroll() {
    if (!this.track || !this.dotsContainer || this.pageCount <= 1) return;
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;
    if (maxScroll <= 0) return;
    const progress = this.track.scrollLeft / maxScroll;
    const pageIndex = Math.min(this.pageCount - 1, Math.max(0, Math.round(progress * (this.pageCount - 1))));
    if (pageIndex !== this.currentIndex) {
      this.currentIndex = pageIndex;
      this.updateDots();
    }
  },

  goToPage(pageIndex) {
    if (!this.track) return;
    this.currentIndex = pageIndex;
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;
    const targetScroll = this.pageCount > 1 ? (pageIndex / (this.pageCount - 1)) * maxScroll : 0;
    this.track.scrollTo({ left: targetScroll, behavior: 'smooth' });
    this.updateDots();
  },

  scrollNext() {
    if (!this.track || !this.cards.length) return;
    const cardWidth = (this.cards[0]?.offsetWidth || 360) + 24;
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;
    if (this.track.scrollLeft >= maxScroll - 15) {
      this.track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      this.track.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  },

  scrollPrev() {
    if (!this.track || !this.cards.length) return;
    const cardWidth = (this.cards[0]?.offsetWidth || 360) + 24;
    if (this.track.scrollLeft <= 15) {
      const maxScroll = this.track.scrollWidth - this.track.clientWidth;
      this.track.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      this.track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  },

  updateDots() {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });
  },

  startAutoplay() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      this.scrollNext();
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

// ---- First-Visit Smooth Scroll to Events (10 Seconds) ----
function initFirstVisitScroll() {
  // Only trigger on home page root, when no specific anchor hash is in the URL
  const path = window.location.pathname;
  if (path.endsWith('archive.html') || 
      path.endsWith('donate.html') || 
      path.endsWith('admin.html') || 
      path.endsWith('kids.html') || 
      path.endsWith('teens.html') || 
      path.endsWith('ramadan.html') || 
      path.endsWith('resources.html') || 
      path.endsWith('rootwords.html') || 
      path.endsWith('flowcharts.html') || 
      path.endsWith('tafseer-notes.html') || 
      path.endsWith('reading-material.html') || 
      path.endsWith('volunteer.html') || 
      window.location.hash) {
    return;
  }

  // Check session storage to ensure it only happens once per session
  if (sessionStorage.getItem('nq_first_visit_scrolled')) {
    return;
  }

  const eventsSection = document.getElementById('events');
  if (!eventsSection) return;

  sessionStorage.setItem('nq_first_visit_scrolled', 'true');

  let animationId = null;
  let isCancelled = false;

  const cancelAutoScroll = () => {
    if (!isCancelled) {
      isCancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('wheel', cancelAutoScroll);
      window.removeEventListener('touchstart', cancelAutoScroll);
      window.removeEventListener('keydown', cancelAutoScroll);
      window.removeEventListener('mousedown', cancelAutoScroll);
    }
  };

  // Gracefully stop if the user initiates any manual interaction
  window.addEventListener('wheel', cancelAutoScroll, { passive: true });
  window.addEventListener('touchstart', cancelAutoScroll, { passive: true });
  window.addEventListener('keydown', cancelAutoScroll, { passive: true });
  window.addEventListener('mousedown', cancelAutoScroll, { passive: true });

  // Initial delay so user sees hero before smooth 10s descent begins
  setTimeout(() => {
    if (isCancelled || window.scrollY > 100) {
      cancelAutoScroll();
      return;
    }

    const startY = window.scrollY;
    const targetY = eventsSection.getBoundingClientRect().top + window.scrollY - 70;
    const distance = targetY - startY;
    if (distance <= 10) return;

    const duration = 10000; // 10 seconds
    let startTime = null;

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function scrollStep(timestamp) {
      if (isCancelled) return;
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);

      window.scrollTo(0, startY + (distance * eased));

      if (progress < 1) {
        animationId = requestAnimationFrame(scrollStep);
      } else {
        cancelAutoScroll();
      }
    }

    animationId = requestAnimationFrame(scrollStep);
  }, 1200);
}

// ---- Media Manager (Audio & Video Player) ----
const MediaManager = {
  async init() {
    this.audio = document.getElementById('html5-audio');
    this.playBtn = document.getElementById('audio-play-btn');
    this.progress = document.getElementById('audio-progress');
    this.volume = document.getElementById('audio-volume');
    this.currentTimeEl = document.getElementById('audio-current-time');
    this.durationEl = document.getElementById('audio-duration');
    this.visualizer = document.getElementById('audio-visualizer');
    this.trackTitle = document.getElementById('audio-track-title');
    this.videoIframe = document.getElementById('video-iframe');
    this.audioPlaylistContainer = document.getElementById('audio-playlist-container');
    this.videoPlaylistContainer = document.getElementById('video-playlist-container');

    // Floating bar elements
    this.floatingBar = document.getElementById('floating-audio-bar');
    this.floatingPlayBtn = document.getElementById('floating-play-btn');
    this.floatingPrevBtn = document.getElementById('floating-prev-btn');
    this.floatingNextBtn = document.getElementById('floating-next-btn');
    this.floatingTitle = document.getElementById('floating-track-title');
    this.floatingArtist = document.getElementById('floating-track-artist');

    // Fallback logic state
    this.fallbackIndex = 0;
    this.fallbackVideos = [
      '8K8PqckMGiA', // Dawrah e Quran 2026 Para 2
      'O0hXZrlxy4I', // Dawrah e Quran 2026 Para 3
      'rvMxAl6BiAg', // Dawrah e Quran 2026 Para 1
      '29noFYSZqHU', // Qasim Ali Shah Interview
      'LZAWLZFuo50', // AlLulu Wal Marjaan Course
      '5Hw0Q7yJigw', // Medina Live
      'a7Aea3l1K5E', // Tajweed Basics
      'G6jWzN0u5t0'  // Quran: Ultimate Guide
    ];

    if (!this.audio) return;

    // Load YouTube API
    this.setupYoutubeAPI();

    // Load media data from JSON
    try {
      const response = await fetch('content/media.json');
      const data = await response.json();
      this.renderAudioPlaylist(data.audio.tracks);
      await this.renderVideoPlaylist(data.video.items);
    } catch (err) {
      console.error('Failed to load media.json:', err);
      return;
    }

    // Setup player controls
    this.setupPlayerControls();
  },

  renderAudioPlaylist(tracks) {
    if (!this.audioPlaylistContainer || !tracks.length) return;

    this.audioPlaylistContainer.innerHTML = '';

    tracks.forEach((track, index) => {
      const btn = document.createElement('button');
      btn.className = `playlist-item${index === 0 ? ' active' : ''}`;
      btn.dataset.index = index;
      btn.dataset.src = track.src;
      btn.dataset.artist = track.artist || 'Ustazah Iffat Maqbool';
      btn.innerHTML = `
        <span class="track-num">${track.trackNumber || (index + 1).toString().padStart(2, '0')}</span>
        <span class="track-name">${track.title}</span>
        <span class="track-length">${track.duration}</span>
      `;
      this.audioPlaylistContainer.appendChild(btn);
    });

    // Set initial track from first audio track
    const firstTrack = tracks[0];
    this.trackTitle.textContent = firstTrack.title;
    if (this.floatingTitle) this.floatingTitle.textContent = firstTrack.title;
    if (this.floatingArtist) this.floatingArtist.textContent = firstTrack.artist || 'Ustazah Iffat Maqbool';
    const artistEl = document.getElementById('audio-track-artist');
    if (artistEl) artistEl.textContent = firstTrack.artist || 'Ustazah Iffat Maqbool';
    this.audio.src = firstTrack.src;

    // Bind playlist click handlers
    this.playlistItems = this.audioPlaylistContainer.querySelectorAll('.playlist-item');
    this.playlistItems.forEach(item => {
      item.addEventListener('click', () => {
        this.playlistItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const src = item.dataset.src;
        const name = item.querySelector('.track-name').textContent;
        const artist = item.dataset.artist || 'Ustazah Iffat Maqbool';

        this.trackTitle.textContent = name;
        if (artistEl) artistEl.textContent = artist;
        if (this.floatingTitle) this.floatingTitle.textContent = name;
        if (this.floatingArtist) this.floatingArtist.textContent = artist;
        this.audio.src = src;
        this.audio.load();

        this.play();
      });
    });
  },

  checkVideoExists(videoId) {
    return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 3000);

      img.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (img.naturalWidth === 120 && img.naturalHeight === 90) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      };

      img.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(false);
        }
      };

      img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    });
  },

  setupYoutubeAPI() {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const self = this;
    const oldCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      if (oldCallback) oldCallback();
      self.initYoutubePlayer();
    };
  },

  initYoutubePlayer() {
    const iframe = document.getElementById('video-iframe');
    if (!iframe) return;

    this.ytPlayer = new YT.Player('video-iframe', {
      events: {
        'onError': (e) => this.onPlayerError(e)
      }
    });
  },

  loadVideo(youtubeId, videoUrl = '') {
    this.currentVideoId = youtubeId;
    this.currentVideoUrl = videoUrl;
    
    const wrapper = document.querySelector('.responsive-video');
    if (!wrapper) return;
    
    if (videoUrl) {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try { this.ytPlayer.pauseVideo(); } catch(e) {}
      }
      wrapper.innerHTML = `
        <video id="native-video-player" controls autoplay style="width: 100%; height: 100%; border-radius: 8px; background: #000;">
          <source src="${videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      wrapper.innerHTML = `
        <iframe id="video-iframe" src="https://www.youtube.com/embed/${youtubeId}?enablejsapi=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
      `;
      if (window.YT && YT.Player) {
        this.ytPlayer = new YT.Player('video-iframe', {
          events: {
            'onError': (e) => this.onPlayerError(e)
          }
        });
      }
    }
  },

  async onPlayerError(event) {
    console.warn('YouTube Player API Error triggered with code:', event.data);
    let fallbackId = '';
    let foundWorking = false;

    while (!foundWorking && this.fallbackIndex < this.fallbackVideos.length) {
      const testId = this.fallbackVideos[this.fallbackIndex];
      this.fallbackIndex = (this.fallbackIndex + 1) % this.fallbackVideos.length;

      if (await this.checkVideoExists(testId)) {
        fallbackId = testId;
        foundWorking = true;
      }
    }

    if (!fallbackId) {
      fallbackId = this.fallbackVideos[0];
    }

    console.log('Falling back to video:', fallbackId);
    this.loadVideo(fallbackId);

    const activeItem = this.videoPlaylistContainer.querySelector('.video-item.active');
    if (activeItem) {
      activeItem.dataset.youtubeId = fallbackId;
      const titleEl = activeItem.querySelector('h4');
      if (titleEl && !titleEl.textContent.includes('(Fallback)')) {
        titleEl.textContent += " (Fallback)";
      }
    }
  },

  async renderVideoPlaylist(items) {
    if (!this.videoPlaylistContainer || !items.length) return;

    const checkedItems = await Promise.all(
      items.map(async (item) => {
        if (item.videoUrl) return { item, isValid: true };
        const isValid = await this.checkVideoExists(item.youtubeId);
        return { item, isValid };
      })
    );

    const verifiedItems = [];
    for (const res of checkedItems) {
      if (res.isValid) {
        verifiedItems.push(res.item);
      } else {
        console.warn(`Video link ${res.item.youtubeId} is invalid. Locating fallback...`);
        let fallbackId = '';
        let foundWorking = false;

        while (!foundWorking && this.fallbackIndex < this.fallbackVideos.length) {
          const testId = this.fallbackVideos[this.fallbackIndex];
          this.fallbackIndex = (this.fallbackIndex + 1) % this.fallbackVideos.length;

          if (await this.checkVideoExists(testId)) {
            fallbackId = testId;
            foundWorking = true;
          }
        }

        if (!fallbackId) {
          fallbackId = this.fallbackVideos[0];
        }

        verifiedItems.push({
          ...res.item,
          youtubeId: fallbackId,
          title: res.item.title + " (Fallback)"
        });
      }
    }

    this.videoPlaylistContainer.innerHTML = '';

    verifiedItems.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = `video-item${index === 0 ? ' active' : ''}`;
      btn.dataset.index = index;
      btn.dataset.youtubeId = item.youtubeId || '';
      btn.dataset.videoUrl = item.videoUrl || '';
      btn.innerHTML = `
        <span class="video-thumbnail">▶</span>
        <div class="video-details">
          <h4>${item.title}</h4>
          <p>${item.description}</p>
        </div>
      `;
      this.videoPlaylistContainer.appendChild(btn);
    });

    const firstVideo = verifiedItems[0];
    if (firstVideo) {
      this.loadVideo(firstVideo.youtubeId || '', firstVideo.videoUrl || '');
    }

    this.videoItems = this.videoPlaylistContainer.querySelectorAll('.video-item');
    this.videoItems.forEach(item => {
      item.addEventListener('click', () => {
        this.videoItems.forEach(v => v.classList.remove('active'));
        item.classList.add('active');

        const youtubeId = item.dataset.youtubeId;
        const videoUrl = item.dataset.videoUrl;
        this.loadVideo(youtubeId, videoUrl);
      });
    });
  },

  setupPlayerControls() {
    // Play/Pause button
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.floatingPlayBtn?.addEventListener('click', () => this.togglePlay());
    this.floatingPrevBtn?.addEventListener('click', () => this.playPrev());
    this.floatingNextBtn?.addEventListener('click', () => this.playNext());

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

    // Track ended → play next
    this.audio.addEventListener('ended', () => {
      this.playNext();
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
      if (this.floatingPlayBtn) this.floatingPlayBtn.textContent = '⏸';
      this.visualizer.classList.add('playing');
      
      const activeItem = this.audioPlaylistContainer?.querySelector('.playlist-item.active');
      if (activeItem) {
        const title = activeItem.querySelector('.track-name')?.textContent || 'Tajjuliyat e Nabuwat — Importance of Seerah';
        const artist = activeItem.dataset.artist || 'Ustazah Iffat Maqbool';
        if (this.floatingTitle) this.floatingTitle.textContent = title;
        if (this.floatingArtist) this.floatingArtist.textContent = artist;
      }
      
      if (this.floatingBar) {
        this.floatingBar.style.transform = 'translateY(0)';
      }
    }).catch(err => console.log("Play failed: ", err));
  },

  pause() {
    this.audio.pause();
    this.playBtn.textContent = '▶';
    if (this.floatingPlayBtn) this.floatingPlayBtn.textContent = '▶';
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
  },

  playNext() {
    const items = Array.from(this.audioPlaylistContainer?.querySelectorAll('.playlist-item') || []);
    if (!items.length) return;
    const activeItem = this.audioPlaylistContainer.querySelector('.playlist-item.active');
    const currentIndex = activeItem ? items.indexOf(activeItem) : -1;
    const nextIndex = (currentIndex + 1) % items.length;
    items[nextIndex].click();
  },

  playPrev() {
    const items = Array.from(this.audioPlaylistContainer?.querySelectorAll('.playlist-item') || []);
    if (!items.length) return;
    const activeItem = this.audioPlaylistContainer.querySelector('.playlist-item.active');
    const currentIndex = activeItem ? items.indexOf(activeItem) : 0;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = items.length - 1;
    items[prevIndex].click();
  }
};

// ---- Canonical Event Links ----
const EventUrlManager = {
  baseUrl: 'https://events.nurulquran.com/',

  eventIdFromLocation() {
    try {
      return new URL(window.location.href).searchParams.get('event') || '';
    } catch (err) {
      return '';
    }
  },

  urlForEvent(eventId) {
    const url = new URL(this.baseUrl);
    if (eventId) url.searchParams.set('event', eventId);
    url.hash = 'events';
    return url.href;
  },

  urlForTrip(tripId) {
    const url = new URL(this.baseUrl);
    if (tripId) url.searchParams.set('trip', tripId);
    url.hash = 'events';
    return url.href;
  },

  updateBrowserUrl(event) {
    if (!event?.id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('event', event.id);
    url.searchParams.delete('trip');
    url.hash = 'events';
    history.replaceState({ eventId: event.id }, '', `${url.pathname}${url.search}${url.hash}`);
    this.applyMetadata(event);
  },

  applyMetadata(event) {
    if (!event?.id) return;

    const eventUrl = this.urlForEvent(event.id);
    const title = `${event.title} | NurulQuran Events`;
    const description = event.desc || event.description || 'View event details from Nur-Ul-Quran International Institute.';
    const image = event.flyer ? new URL(event.flyer, this.baseUrl).href : `${this.baseUrl}assets/logo.png`;

    document.title = title;
    this.setMeta('meta[name="description"]', 'content', description);
    this.setMeta('meta[property="og:title"]', 'content', title);
    this.setMeta('meta[property="og:description"]', 'content', description);
    this.setMeta('meta[property="og:url"]', 'content', eventUrl);
    this.setMeta('meta[property="og:image"]', 'content', image);
    this.setMeta('link[rel="canonical"]', 'href', eventUrl);
  },

  setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }
};

window.EventUrlManager = EventUrlManager;

// ---- Device-aware Calendar Export ----
const CalendarExportManager = {
  eventsById: new Map(),
  statusTimer: null,

  register(events) {
    this.eventsById.clear();
    events.forEach(event => {
      if (event?.id) this.eventsById.set(event.id, event);
    });
  },

  addById(eventId) {
    const event = this.eventsById.get(eventId);
    if (!event) {
      this.announce('Calendar details are still loading. Please try again.');
      return;
    }
    this.add(event);
  },

  add(event) {
    if (!event?.start || !event?.end) {
      this.announce('Calendar times are unavailable for this event.');
      return;
    }

    if (this.isAppleDevice()) {
      this.announce('Opening an Apple Calendar event…');
      this.downloadIcs(event);
      return;
    }

    this.announce(this.isAndroidDevice() ? 'Opening Google Calendar on Android…' : 'Opening Google Calendar…');
    this.openGoogleCalendar(event);
  },

  isAndroidDevice() {
    return /Android/i.test(navigator.userAgent || '');
  },

  isAppleDevice() {
    if (this.isAndroidDevice()) return false;
    const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
    return /iPhone|iPad|iPod|Mac/i.test(platform) || (/Macintosh/i.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1);
  },

  toUtcStamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  },

  escapeIcs(value = '') {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  },

  calendarDescription(event) {
    return `${event.desc || event.description || ''}\n\nEvent details: ${EventUrlManager.urlForEvent(event.id)}`.trim();
  },

  downloadIcs(event) {
    const start = this.toUtcStamp(event.start);
    const end = this.toUtcStamp(event.end);
    if (!start || !end) {
      this.announce('Calendar times could not be read.');
      return;
    }

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NurulQuran//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${this.escapeIcs(event.id)}@events.nurulquran.com`,
      `DTSTAMP:${this.toUtcStamp(new Date())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${this.escapeIcs(event.title)}`,
      `DESCRIPTION:${this.escapeIcs(this.calendarDescription(event))}`,
      `LOCATION:${this.escapeIcs(event.location)}`,
      `URL:${EventUrlManager.urlForEvent(event.id)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const blobUrl = URL.createObjectURL(new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${event.id || 'nurulquran-event'}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  },

  openGoogleCalendar(event) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.toUtcStamp(event.start)}/${this.toUtcStamp(event.end)}`,
      details: this.calendarDescription(event),
      location: event.location || '',
      ctz: event.timeZone || 'UTC'
    });
    const calendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    const calendarWindow = window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    if (!calendarWindow) window.location.href = calendarUrl;
  },

  announce(message) {
    let status = document.getElementById('calendar-action-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'calendar-action-status';
      status.className = 'calendar-action-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      document.body.appendChild(status);
    }

    status.textContent = message;
    status.classList.add('is-visible');
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => status.classList.remove('is-visible'), 3200);
  }
};

window.CalendarExportManager = CalendarExportManager;

// ---- Calendar & Events Manager ----
const CalendarManager = {
  events: {},
  eventsById: {},

  async init() {
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
    this.tripsContainer = document.getElementById('trips-timeline-container');

    // Tabs
    this.tabCalendar = document.getElementById('tab-calendar');
    this.tabTrips = document.getElementById('tab-trips');
    this.panelCalendar = document.getElementById('calendar-panel');
    this.panelTrips = document.getElementById('trips-panel');

    if (!this.daysGrid) return;

    // Load events from JSON
    try {
      const response = await fetch('content/events.json');
      const data = await response.json();

      // Build events lookup object keyed by date string (array of events per date)
      this.events = {};
      this.eventsById = {};
      if (data.calendar && Array.isArray(data.calendar)) {
        data.calendar.forEach(item => {
          if (!this.events[item.date]) {
            this.events[item.date] = [];
          }
          const event = {
            id: item.id,
            date: item.date,
            start: item.start,
            end: item.end,
            timeZone: item.timeZone || 'UTC',
            title: item.title,
            type: item.type,
            time: item.time,
            location: item.location,
            desc: item.description,
            link: item.link,
            flyer: item.flyer || item.link,
            contact: item.contact || '',
            whatsapp: item.whatsapp || '',
            registrationForm: item.registrationForm || ''
          };
          this.events[item.date].push(event);
          if (event.id) this.eventsById[event.id] = event;
        });
      }

      CalendarExportManager.register(Object.values(this.eventsById));

      // Render trips timeline
      if (data.trips && Array.isArray(data.trips)) {
        this.renderTrips(data.trips);
      }
    } catch (err) {
      console.error('Failed to load events.json:', err);
    }

    // Set current active date (September 2026)
    this.currentYear = 2026;
    this.currentMonth = 8; // 0-indexed: 8 = September
    
    this.renderCalendar();
    this.setupTabs();

    this.prevBtn?.addEventListener('click', () => this.navigateMonth(-1));
    this.nextBtn?.addEventListener('click', () => this.navigateMonth(1));

    // A shared event URL takes priority; otherwise show the next scheduled event.
    const sharedEventId = EventUrlManager.eventIdFromLocation();
    if (!sharedEventId || !this.selectEventById(sharedEventId)) {
      this.autoSelectFirstUpcomingEvent();
    }
  },

  autoSelectFirstUpcomingEvent() {
    const todayStr = new Date().toISOString().split('T')[0];
    const eventDates = Object.keys(this.events).sort();
    if (eventDates.length === 0) return;

    // Pick first event on or after today, or fallback to the earliest event
    const targetDate = eventDates.find(d => d >= todayStr) || eventDates[0];
    if (!targetDate) return;

    const [y, m, d] = targetDate.split('-').map(Number);
    if (this.currentYear !== y || this.currentMonth !== m - 1) {
      this.currentYear = y;
      this.currentMonth = m - 1;
      this.renderCalendar();
    }

    const dayBtns = this.daysGrid.querySelectorAll('.cal-day.has-event');
    dayBtns.forEach(btn => {
      if (parseInt(btn.textContent.trim(), 10) === d) {
        this.showEvent(targetDate, btn, 0, false);
      }
    });
  },

  selectEventById(eventId) {
    const event = this.eventsById[eventId];
    if (!event) return false;

    const [year, month] = event.date.split('-').map(Number);
    this.currentYear = year;
    this.currentMonth = month - 1;
    this.renderCalendar();

    const dayButton = this.daysGrid.querySelector(`[data-date="${event.date}"]`);
    const eventIndex = this.events[event.date].findIndex(item => item.id === eventId);
    this.showEvent(event.date, dayButton, Math.max(eventIndex, 0), false);
    EventUrlManager.applyMetadata(event);
    this.highlightSharedEvent(eventId);
    return true;
  },

  highlightSharedEvent(eventId) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`.flyer-card[data-event-id="${eventId}"]`);
      const target = card || document.getElementById('event-detail-card');
      if (!target) return;

      card?.classList.add('deep-linked-event');
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      if (card) setTimeout(() => card.classList.remove('deep-linked-event'), 4200);
    });
  },

  renderTrips(trips) {
    if (!this.tripsContainer) return;

    this.tripsContainer.innerHTML = '';

    trips.forEach(trip => {
      const statusLabel = trip.status === 'upcoming'
        ? `Upcoming (${trip.date})`
        : 'Past Event';
      const tagClass = trip.status === 'upcoming' ? 'upcoming' : 'past';
      const btnClass = trip.status === 'upcoming' ? 'btn-outline' : 'btn-secondary';

      let flyersHtml = '';
      if (trip.flyers && Array.isArray(trip.flyers) && trip.flyers.length > 0) {
        flyersHtml = `
          <div class="trip-flyers-grid">
            ${trip.flyers.map(f => {
              const flyerShareText = `*${f.topic} (${f.city})*\n🗓️ ${f.date}\n📍 ${f.venue}\n📞 Contact: ${f.phone}\n\nJoin Ustazah Iffat Maqbool in Ireland!`;
              return `
                <div class="trip-flyer-thumb" data-event-id="${f.id || ''}" data-event-title="${f.topic}" data-event-date="${f.date}" data-flyer-src="${f.image}" data-caption="${f.city}: ${f.topic} (${f.date}) • ${f.venue} (Tel: ${f.phone})" data-share-text="${encodeURIComponent(flyerShareText)}">
                  <img src="${f.image}" alt="${f.city} Flyer" loading="lazy">
                  <span class="trip-flyer-label">${f.city} • ${f.topic}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      const tripShareText = `*${trip.title}*\n🗓️ ${trip.date}\n${trip.meta}\n\n${trip.description}`;
      const tripUrl = EventUrlManager.urlForTrip(trip.id);
      const tripMapBtn = (trip.meta && !trip.meta.toLowerCase().includes('online'))
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.meta)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm trip-map-btn" style="padding:0.35rem 0.65rem;font-size:0.75rem"><span>📍</span> <span>Map</span></a>`
        : '';

      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item reveal';
      timelineItem.dataset.tripId = trip.id || '';
      timelineItem.innerHTML = `
        <div class="timeline-badge">${trip.icon}</div>
        <div class="timeline-card glass-card">
          <span class="trip-tag ${tagClass}">${statusLabel}</span>
          <h3>${trip.title}</h3>
          <p class="trip-meta">${trip.meta}</p>
          <p class="trip-desc">${trip.description}</p>
          ${flyersHtml}
          <div class="trip-footer" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <a href="${trip.link}" class="btn ${btnClass}" ${/\.(jpe?g|png|webp)$/i.test(trip.link) ? 'data-flyer-link="true"' : ''}>${trip.linkText}</a>
            ${tripMapBtn}
            ${trip.registrationForm ? `<a href="${trip.registrationForm}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Register →</a>` : ''}
            <button type="button" class="btn-share-icon trip-share-btn" aria-label="Share" title="Share event &amp; flyer">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
            </button>
          </div>
        </div>
      `;

      // Bind click handlers on flyer thumbnails
      timelineItem.querySelectorAll('.trip-flyer-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const src = thumb.dataset.flyerSrc;
          const caption = thumb.dataset.caption;
          const shareText = thumb.dataset.shareText ? decodeURIComponent(thumb.dataset.shareText) : '';
          FlyerLightboxManager.open(src, caption, shareText, caption, thumb.dataset.eventTitle, thumb.dataset.eventDate, thumb.dataset.eventId);
        });
      });

      timelineItem.querySelector('.trip-share-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        SocialShareManager.open({
          title: trip.title,
          text: tripShareText,
          url: tripUrl,
          imgUrl: trip.flyers?.[0]?.image || '',
          date: trip.date,
          venue: trip.meta
        });
      });

      // Bind flyer link button if applicable
      const flyerLinkBtn = timelineItem.querySelector('a[data-flyer-link="true"]');
      if (flyerLinkBtn) {
        flyerLinkBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const firstFlyer = trip.flyers?.[0];
          FlyerLightboxManager.open(trip.link, trip.title, tripShareText, trip.meta, trip.title, trip.date, firstFlyer?.id || '');
        });
      }

      this.tripsContainer.appendChild(timelineItem);
    });
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
    
    // Clear selection indicator
    this.daysGrid.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
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

    const now = new Date();
    const isCurrentYear = (this.currentYear === now.getFullYear());
    const isCurrentMonth = (this.currentMonth === now.getMonth());
    const todayDate = now.getDate();

    // Days in current month
    for (let day = 1; day <= lastDay; day++) {
      const dayButton = document.createElement('button');
      dayButton.className = 'cal-day';
      dayButton.textContent = day;

      if (isCurrentYear && isCurrentMonth && day === todayDate) {
        dayButton.classList.add('is-today');
      }
      
      const dateString = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      dayButton.dataset.date = dateString;
      
      if (this.events[dateString] && this.events[dateString].length > 0) {
        dayButton.classList.add('has-event');
        const eventCount = this.events[dateString].length;
        dayButton.setAttribute('aria-label', `Day ${day}, ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`);
        
        // One neutral dot per event; the count carries meaning without a color legend.
        const dotsWrap = document.createElement('span');
        dotsWrap.className = 'cal-dots';
        dotsWrap.setAttribute('aria-hidden', 'true');
        this.events[dateString].forEach(() => {
          const dot = document.createElement('i');
          dotsWrap.appendChild(dot);
        });
        dayButton.appendChild(dotsWrap);
        
        dayButton.addEventListener('click', () => this.showEvent(dateString, dayButton, 0));
      } else {
        dayButton.setAttribute('aria-label', `Day ${day}`);
      }

      this.daysGrid.appendChild(dayButton);
    }
  },

  showEvent(dateString, element, eventIndex = 0, updateUrl = true) {
    const eventList = this.events[dateString];
    if (!eventList || !eventList.length) return;
    const event = eventList[eventIndex] || eventList[0];

    // Highlight selected day
    if (element) {
      this.daysGrid.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
    }

    // If multiple events on same date, add switcher buttons
    let multiHeader = this.detailContent.querySelector('.event-multi-switcher');
    if (eventList.length > 1) {
      if (!multiHeader) {
        multiHeader = document.createElement('div');
        multiHeader.className = 'event-multi-switcher';
        multiHeader.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;';
        this.detailContent.insertBefore(multiHeader, this.detailTag);
      }
      multiHeader.innerHTML = eventList.map((ev, idx) => `
        <button type="button" class="btn btn-sm ${idx === eventIndex ? 'btn-primary' : 'btn-outline'}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 12px; cursor: pointer;">
          Program ${idx + 1}: ${ev.time.includes('•') ? ev.time.split('•').pop().trim() : ev.time}
        </button>
      `).join('');
      multiHeader.classList.remove('hidden');

      // Bind click on multi switcher buttons
      multiHeader.querySelectorAll('button').forEach((btn, idx) => {
        btn.addEventListener('click', () => this.showEvent(dateString, document.querySelector('.cal-day.selected'), idx));
      });
    } else if (multiHeader) {
      multiHeader.classList.add('hidden');
    }

    // Fill event details
    this.detailTag.textContent = event.type;
    this.detailTitle.textContent = event.title;
    this.detailTime.textContent = event.time;
    this.detailLoc.textContent = event.location;
    this.detailDesc.textContent = event.desc;
    this.detailCta.href = event.link || '#events';
    this.detailCta.textContent = (event.link && event.link.startsWith('http')) ? 'Join Program Live →' : 'View Program Details →';

    const eventUrl = EventUrlManager.urlForEvent(event.id);
    const flyerShareText = `*${event.title}*\n🗓️ ${event.time}\n📍 ${event.location}\n📞 Contact: ${event.contact || '+353 83 025 6299'}\n\nJoin Ustazah Iffat Maqbool!`;

    // Handle flyer graphic preview inside card
    const flyerWrap = document.getElementById('event-detail-flyer-wrap');
    if (flyerWrap) {
      if (event.flyer || (event.link && (event.link.endsWith('.jpeg') || event.link.endsWith('.jpg') || event.link.endsWith('.png')))) {
        const flyerSrc = event.flyer || event.link;
        flyerWrap.innerHTML = `
          <div class="event-detail-flyer-preview" data-flyer-src="${flyerSrc}" data-caption="${event.title} • ${event.time}">
            <img src="${flyerSrc}" alt="${event.title} Flyer">
            <div class="event-detail-flyer-overlay">
              <span>☘️ In-Person Ireland Flyer</span>
              <span>🔍 Click to Expand</span>
            </div>
          </div>
        `;
        flyerWrap.classList.remove('hidden');
        flyerWrap.querySelector('.event-detail-flyer-preview')?.addEventListener('click', () => {
          FlyerLightboxManager.open(flyerSrc, `${event.title}<br><span style="font-size:0.85em;opacity:0.85">${event.location} • ${event.time}</span>`, flyerShareText, event.location, event.title, event.time, event.id);
        });
      } else {
        flyerWrap.innerHTML = '';
        flyerWrap.classList.add('hidden');
      }
    }

    // Dynamic action buttons container (program, calendar, map, share, registration)
    let actionWrap = this.detailContent.querySelector('.event-detail-actions-wrap');
    if (!actionWrap) {
      actionWrap = document.createElement('div');
      actionWrap.className = 'event-detail-actions-wrap';
      actionWrap.style.display = 'flex';
      actionWrap.style.gap = '0.5rem';
      actionWrap.style.flexWrap = 'wrap';
      actionWrap.style.alignItems = 'center';
      actionWrap.style.marginTop = '1rem';
      this.detailCta.parentNode.insertBefore(actionWrap, this.detailCta);
      actionWrap.appendChild(this.detailCta);
    }

    // Device-aware Calendar Button
    let calendarBtn = actionWrap.querySelector('.event-calendar-btn');
    if (!calendarBtn) {
      calendarBtn = document.createElement('button');
      calendarBtn.type = 'button';
      calendarBtn.className = 'btn btn-outline event-calendar-btn';
      calendarBtn.style.display = 'inline-flex';
      calendarBtn.style.alignItems = 'center';
      calendarBtn.style.gap = '0.35rem';
      calendarBtn.style.padding = '0.4rem 0.8rem';
      calendarBtn.style.fontSize = '0.85rem';
      calendarBtn.innerHTML = '<span aria-hidden="true">📅</span> <span>Add to Calendar</span>';
      actionWrap.appendChild(calendarBtn);
    }
    calendarBtn.onclick = () => CalendarExportManager.add(event);

    // Google Maps Button
    let mapBtn = actionWrap.querySelector('.event-map-btn');
    if (event.location && !event.location.toLowerCase().includes('online')) {
      if (!mapBtn) {
        mapBtn = document.createElement('a');
        mapBtn.className = 'btn btn-outline event-map-btn';
        mapBtn.target = '_blank';
        mapBtn.rel = 'noopener noreferrer';
        mapBtn.style.display = 'inline-flex';
        mapBtn.style.alignItems = 'center';
        mapBtn.style.gap = '0.35rem';
        mapBtn.style.padding = '0.4rem 0.8rem';
        mapBtn.style.fontSize = '0.85rem';
        mapBtn.innerHTML = '<span>📍</span> <span>Map</span>';
        actionWrap.appendChild(mapBtn);
      }
      mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
      mapBtn.style.display = 'inline-flex';
    } else if (mapBtn) {
      mapBtn.style.display = 'none';
    }

    // Standard Share Icon Button
    let shareBtn = actionWrap.querySelector('.event-share-btn');
    if (!shareBtn) {
      shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'btn-share-icon event-share-btn';
      shareBtn.setAttribute('aria-label', 'Share event & flyer');
      shareBtn.setAttribute('title', 'Share event & flyer');
      shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>';
      actionWrap.appendChild(shareBtn);
    }
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      SocialShareManager.open({
        title: event.title,
        text: `*${event.title}*\n🗓️ ${event.time}\n📍 ${event.location}\n📞 ${event.contact || ''}\n\nJoin Ustazah Iffat Maqbool (Nur-Ul-Quran International)!`,
        url: eventUrl,
        imgUrl: event.flyer || event.link || '',
        date: event.time,
        venue: event.location
      });
    };

    // Handle registration form button
    let regBtn = actionWrap.querySelector('.event-register-btn');
    if (event.registrationForm) {
      if (!regBtn) {
        regBtn = document.createElement('a');
        regBtn.className = 'btn btn-secondary event-register-btn';
        regBtn.target = '_blank';
        regBtn.rel = 'noopener noreferrer';
        regBtn.textContent = 'Register';
        actionWrap.appendChild(regBtn);
      }
      regBtn.href = event.registrationForm;
    } else if (regBtn) {
      regBtn.remove();
    }

    // Swap displays
    this.detailEmpty.classList.add('hidden');
    this.detailContent.classList.remove('hidden');

    if (updateUrl) EventUrlManager.updateBrowserUrl(event);
  }
};

// ---- Universal Social Share Modal Manager ----
const SocialShareManager = {
  data: {
    title: '',
    text: '',
    url: '',
    imgUrl: '',
    date: '',
    venue: ''
  },

  init() {
    this.modal = document.getElementById('social-share-modal');
    if (!this.modal) return;

    this.closeBtn = document.getElementById('close-share-modal');
    this.previewImg = document.getElementById('share-preview-img');
    this.previewTitle = document.getElementById('share-preview-title');
    this.previewMeta = document.getElementById('share-preview-meta');
    this.nativeBtn = document.getElementById('share-native-action');
    this.linkWa = document.getElementById('share-link-wa');
    this.linkFb = document.getElementById('share-link-fb');
    this.linkX = document.getElementById('share-link-x');
    this.linkTg = document.getElementById('share-link-tg');
    this.copyBtn = document.getElementById('share-copy-btn');
    this.copyLabel = document.getElementById('share-copy-label');
    this.copyIcon = document.getElementById('share-copy-icon');
    this.downloadBtn = document.getElementById('share-download-btn');

    this.closeBtn?.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });

    this.copyBtn?.addEventListener('click', () => this.copyDetails());
    this.nativeBtn?.addEventListener('click', () => this.triggerNativeShare());
  },

  openFromCard(card) {
    if (!card) return;
    const src = card.dataset.flyerSrc || card.querySelector('img')?.getAttribute('src') || '';
    const title = card.querySelector('h4')?.textContent || 'Ireland Tour 2026';
    const date = card.querySelector('.flyer-city-date')?.textContent || '';
    const venue = card.querySelector('.flyer-venue')?.textContent || '';
    const contact = card.querySelector('.flyer-contact')?.textContent || '';
    const eventId = card.dataset.eventId || '';
    
    const formattedText = `*${title}*\n🗓️ ${date}\n${venue}\n${contact}\n\nJoin Ustazah Iffat Maqbool (Nur-Ul-Quran International)!`;
    const fullUrl = EventUrlManager.urlForEvent(eventId);

    this.open({
      title: title,
      text: formattedText,
      url: fullUrl,
      imgUrl: src,
      date: date,
      venue: venue
    });
  },

  open({ title = '', text = '', url = '', imgUrl = '', date = '', venue = '' }) {
    if (!this.modal) this.init();
    if (!this.modal) return;

    this.data = { title, text, url: url || window.location.href, imgUrl, date, venue };

    // Format absolute flyer URL
    let absoluteImgUrl = '';
    if (imgUrl) {
      try {
        absoluteImgUrl = new URL(imgUrl, window.location.origin).href;
      } catch (e) {
        absoluteImgUrl = imgUrl;
      }
    }

    // Populate preview
    if (this.previewImg) {
      if (imgUrl) {
        this.previewImg.src = imgUrl;
        this.previewImg.style.display = 'block';
      } else {
        this.previewImg.style.display = 'none';
      }
    }
    if (this.previewTitle) this.previewTitle.textContent = title || 'NurulQuran Event';
    if (this.previewMeta) {
      this.previewMeta.textContent = [date, venue.replace(/^📍\s*/, '')].filter(Boolean).join(' • ') || 'Nur-Ul-Quran International';
    }

    // Include the flyer as a secondary link while keeping the event URL canonical.
    const textWithImage = absoluteImgUrl 
      ? `${text}\n\n🖼️ View Flyer: ${absoluteImgUrl}\n🔗 Site: ${this.data.url}`
      : `${text}\n\n🔗 ${this.data.url}`;

    // WhatsApp
    if (this.linkWa) {
      this.linkWa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(textWithImage)}`;
    }

    // Facebook
    if (this.linkFb) {
      this.linkFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.data.url)}&quote=${encodeURIComponent(text)}`;
    }

    // X / Twitter
    if (this.linkX) {
      const tweetText = `${title} with Ustazah Iffat Maqbool ${date ? '• ' + date : ''}`;
      this.linkX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(this.data.url)}`;
    }

    // Telegram
    if (this.linkTg) {
      this.linkTg.href = `https://t.me/share/url?url=${encodeURIComponent(this.data.url)}&text=${encodeURIComponent(text)}`;
    }

    // Download Flyer button
    if (this.downloadBtn) {
      if (imgUrl) {
        this.downloadBtn.href = imgUrl;
        this.downloadBtn.download = imgUrl.split('/').pop() || 'event-flyer.jpeg';
        this.downloadBtn.style.display = 'inline-flex';
      } else {
        this.downloadBtn.style.display = 'none';
      }
    }

    // Reset copy button state
    if (this.copyLabel) this.copyLabel.textContent = 'Copy Info';
    if (this.copyIcon) this.copyIcon.textContent = '📋';

    // Show modal
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  async triggerNativeShare() {
    const { title, text, url, imgUrl } = this.data;
    
    // Check if we can share file directly via Web Share API
    if (imgUrl && navigator.canShare) {
      try {
        const absUrl = new URL(imgUrl, window.location.origin).href;
        const res = await fetch(absUrl);
        const blob = await res.blob();
        const filename = imgUrl.split('/').pop() || 'event-flyer.jpeg';
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: text,
            url: url
          });
          return;
        }
      } catch (e) {
        console.warn('Native file share failed or canceled, falling back to text share:', e);
      }
    }

    // Fallback to text + url native share
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          this.copyDetails();
        }
      }
    } else {
      this.copyDetails();
    }
  },

  copyDetails() {
    const fullImg = this.data.imgUrl ? new URL(this.data.imgUrl, window.location.origin).href : '';
    const textToCopy = `${this.data.text}\n\n🖼️ Flyer: ${fullImg}\n🔗 Link: ${this.data.url}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showCopiedState();
      }).catch(() => {
        this.fallbackCopy(textToCopy);
      });
    } else {
      this.fallbackCopy(textToCopy);
    }
  },

  showCopiedState() {
    if (this.copyLabel) this.copyLabel.textContent = 'Copied!';
    if (this.copyIcon) this.copyIcon.textContent = '✓';
    setTimeout(() => {
      if (this.copyLabel) this.copyLabel.textContent = 'Copy Info';
      if (this.copyIcon) this.copyIcon.textContent = '📋';
    }, 2500);
  },

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      this.showCopiedState();
    } catch (e) {}
    document.body.removeChild(ta);
  },

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.SocialShareManager = SocialShareManager;

// ---- Flyer Lightbox Modal Manager ----
const FlyerLightboxManager = {
  init() {
    this.lightbox = document.getElementById('flyer-lightbox');
    this.img = document.getElementById('flyer-lightbox-img');
    this.caption = document.getElementById('flyer-lightbox-caption');
    this.shareContainer = document.getElementById('flyer-lightbox-share');
    this.closeBtn = document.getElementById('close-flyer-lightbox');

    if (!this.lightbox) return;

    // Bind all static flyer cards
    document.querySelectorAll('.flyer-card').forEach(card => {
      card.addEventListener('click', () => {
        const src = card.dataset.flyerSrc;
        const caption = card.dataset.caption;
        const title = card.querySelector('h4')?.textContent || 'Ireland Tour 2026';
        const venue = card.querySelector('.flyer-venue')?.textContent || '';
        const date = card.querySelector('.flyer-city-date')?.textContent || '';
        const phone = card.querySelector('.flyer-contact')?.textContent || '';
        const eventId = card.dataset.eventId || '';
        const shareText = `*${title}*\n🗓️ ${date}\n${venue}\n${phone}\n\nJoin Ustazah Iffat Maqbool (Nur-Ul-Quran International)!`;
        const venueQuery = venue.replace(/^📍\s*/, '').trim();
        this.open(src, caption, shareText, venueQuery, title, date, eventId);
      });
    });

    this.closeBtn?.addEventListener('click', () => this.close());
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.lightbox.classList.contains('hidden')) {
        this.close();
      }
    });
  },

  open(src, caption = '', shareText = '', mapQuery = '', eventTitle = '', eventDate = '', eventId = '') {
    if (!this.lightbox || !this.img) return;
    this.img.src = src;
    if (this.caption) this.caption.innerHTML = caption;

    if (this.shareContainer) {
      const textToShare = shareText || caption.replace(/<[^>]*>?/gm, '');
      const mapBtnHtml = (mapQuery && !mapQuery.toLowerCase().includes('online'))
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.3);padding:0.6rem 1.2rem;display:inline-flex;align-items:center;gap:0.4rem;" onclick="event.stopPropagation()">
            <span>📍</span> <span>Google Maps</span>
          </a>`
        : '';
      const calendarBtnHtml = eventId
        ? `<button type="button" class="btn btn-outline" id="flyer-lightbox-calendar-btn" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.3);padding:0.6rem 1.2rem;display:inline-flex;align-items:center;gap:0.4rem;cursor:pointer;">
            <span aria-hidden="true">📅</span> <span>Add to Calendar</span>
          </button>`
        : '';

      this.shareContainer.innerHTML = `
        <div style="display:flex;gap:0.75rem;justify-content:center;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="flyer-lightbox-share-btn" style="padding:0.6rem 1.2rem;display:inline-flex;align-items:center;gap:0.5rem;font-weight:600;cursor:pointer;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
            <span>Share Flyer</span>
          </button>
          ${calendarBtnHtml}
          ${mapBtnHtml}
        </div>
      `;

      document.getElementById('flyer-lightbox-share-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        SocialShareManager.open({
          title: eventTitle || 'Ireland Tour 2026',
          text: textToShare,
          url: EventUrlManager.urlForEvent(eventId),
          imgUrl: src,
          date: eventDate,
          venue: mapQuery
        });
      });

      document.getElementById('flyer-lightbox-calendar-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        CalendarExportManager.addById(eventId);
      });
    }

    this.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.lightbox) return;
    this.lightbox.classList.add('hidden');
    if (this.img) this.img.src = '';
    document.body.style.overflow = '';
  }
};

// ---- Video Lightbox Theater Modal ----
const VideoLightbox = {
  init() {
    this.lightbox = document.getElementById('video-lightbox');
    this.closeBtn = document.getElementById('close-lightbox');
    this.content = document.getElementById('lightbox-video-content');
    this.openBtn = document.getElementById('open-theater-mode-btn');

    if (!this.lightbox || !this.content) return;

    this.openBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.open();
    });

    this.closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });
    
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.lightbox.classList.contains('hidden')) {
        this.close();
      }
    });
  },

  open() {
    let currentId = MediaManager.currentVideoId;
    let currentUrl = MediaManager.currentVideoUrl;

    // Detect currently active playlist item if currentId is missing
    if (!currentId && !currentUrl) {
      const activeVideoItem = document.querySelector('.video-item.active');
      if (activeVideoItem) {
        currentId = activeVideoItem.dataset.youtubeId;
        currentUrl = activeVideoItem.dataset.videoUrl;
      }
    }

    // Detect from iframe if still missing
    if (!currentId && !currentUrl) {
      const iframe = document.getElementById('video-iframe');
      if (iframe && iframe.src) {
        const match = iframe.src.match(/embed\/([^?&]+)/);
        if (match) currentId = match[1];
      }
    }

    // Default fallback video
    if (!currentId && !currentUrl) {
      currentId = '8K8PqckMGiA';
    }

    if (currentUrl) {
      const nativePlayer = document.getElementById('native-video-player');
      if (nativePlayer) nativePlayer.pause();
      
      this.content.innerHTML = `
        <video controls autoplay style="width: 100%; height: 100%; object-fit: contain; background: #000;">
          <source src="${currentUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      // Pause inline player
      if (MediaManager.ytPlayer && typeof MediaManager.ytPlayer.pauseVideo === 'function') {
        try { MediaManager.ytPlayer.pauseVideo(); } catch(e) {}
      } else {
        const inlineIframe = document.getElementById('video-iframe');
        if (inlineIframe) {
          try {
            inlineIframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          } catch(e) {}
        }
      }
      
      this.content.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${currentId}?autoplay=1&enablejsapi=1&rel=0" 
                title="YouTube video player — Theater Mode" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen 
                style="width: 100%; height: 100%; border: none; display: block; border-radius: 8px;"></iframe>
      `;
    }

    this.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.lightbox) return;
    this.lightbox.classList.add('hidden');
    if (this.content) this.content.innerHTML = '';
    document.body.style.overflow = '';
  }
};

// ---- Dynamic Data Manager ----
const DynamicDataManager = {
  async init() {
    try {
      const siteRes = await fetch('content/site.json');
      const site = await siteRes.json();
      this.populateSiteDetails(site);

      const coursesRes = await fetch('content/courses.json');
      const coursesData = await coursesRes.json();
      this.courses = coursesData.courses || [];
      this.renderCourses(this.courses);
      this.setupCourseFilters();

      const resourcesRes = await fetch('content/resources.json');
      const resourcesData = await resourcesRes.json();
      this.renderResources(resourcesData.categories || []);

      const testimonialsRes = await fetch('content/testimonials.json');
      const testimonialsData = await testimonialsRes.json();
      this.renderTestimonials(testimonialsData.testimonials || []);

      const projectsRes = await fetch('content/projects.json');
      const projectsData = await projectsRes.json();
      this.renderProjects(projectsData.projects || []);

      this.injectSchemaMetadata(this.courses);

    } catch (err) {
      console.error("Failed to load dynamic data:", err);
    }
  },

  populateSiteDetails(site) {
    if (!site) return;
    const siteTitleEls = document.querySelectorAll('.logo span, footer .logo-footer h3');
    siteTitleEls.forEach(el => {
      el.textContent = site.name;
    });

    const heroTagline = document.querySelector('.hero-content p');
    if (heroTagline) heroTagline.textContent = site.tagline;

    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer && site.stats) {
      statsContainer.innerHTML = site.stats.map(s => `
        <div class="stat-card glass-card reveal">
          <div class="stat-number" data-count="${parseInt(s.number)}">${s.number}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('');
      StatCounter.init();
    }

    const footerContact = document.querySelector('.footer-col:last-child');
    if (footerContact && site.contact) {
      const emailEl = footerContact.querySelector('p:nth-of-type(1)');
      if (emailEl) emailEl.innerHTML = `<strong>Email:</strong> <a href="mailto:${site.contact.email}" style="color:var(--text-muted)">${site.contact.email}</a>`;
      
      const phoneList = footerContact.querySelector('.phone-list') || document.createElement('div');
      phoneList.className = 'phone-list';
      phoneList.style.marginTop = '0.5rem';
      phoneList.innerHTML = (site.contact.phones || []).map(p => `
        <div style="font-size:0.9rem;margin-bottom:0.25rem;color:var(--text-muted)">
          ${p.flag} ${p.region}: <a href="tel:${p.number.replace(/\D/g,'')}" style="color:inherit">${p.number}</a>
        </div>
      `).join('');
      if (!footerContact.querySelector('.phone-list')) {
        footerContact.appendChild(phoneList);
      }
    }
  },

  renderCourses(courses) {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;
    grid.innerHTML = courses.map((c, i) => {
      const isEmoji = !c.icon.startsWith('http') && !c.icon.startsWith('assets/');
      const iconHtml = isEmoji 
        ? `<div class="course-icon">${c.icon}</div>`
        : `<div class="course-icon-img-wrapper" style="width: 50px; height: 50px; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: center;"><img src="${c.icon}" alt="${c.title}" style="width:100%; height:100%; object-fit:contain; border-radius:8px;"></div>`;
      
      const arabicHtml = c.arabic ? `<div class="course-arabic" style="font-family:var(--font-arabic); font-size: 1.25rem; color: var(--accent-gold); margin-bottom: 0.35rem; font-weight: normal; direction: rtl; letter-spacing: 0;">${c.arabic}</div>` : '';
      const tagHtml = c.tag ? `<span class="course-tag" style="display: inline-block; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 12px; background: rgba(201, 162, 39, 0.15); color: var(--accent-gold); margin-bottom: 0.75rem;">${c.tag}</span>` : '';
      
      const regBtnHtml = c.registerLink 
        ? `<a href="${c.registerLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 20px;">Register Now →</a>`
        : '';
      const detailsBtnHtml = `<a href="${c.link || '#courses'}" class="btn btn-outline btn-sm" style="font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 20px;">Details →</a>`;

      return `
        <article class="course-card reveal" style="--i:${i}; border-top: 4px solid ${c.color || 'var(--primary)'}; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            ${iconHtml}
            ${arabicHtml}
            <h3 style="margin-bottom: 0.35rem;">${c.title}</h3>
            ${tagHtml}
            <p style="margin-top: 0.25rem;">${c.description}</p>
          </div>
          <div class="course-card-actions" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-top: 1.25rem;">
            ${regBtnHtml}
            ${detailsBtnHtml}
          </div>
        </article>
      `;
    }).join('');
    ScrollReveal.init();
  },

  setupCourseFilters() {
    const tabs = document.querySelectorAll('#course-filter-tabs .filter-btn');
    const searchInput = document.getElementById('course-search');

    const filterAndSearch = () => {
      const activeTab = document.querySelector('#course-filter-tabs .filter-btn.active');
      const category = activeTab ? activeTab.dataset.filter : 'all';
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

      const filtered = this.courses.filter(c => {
        let matchesCategory = true;
        if (category !== 'all') {
          if (c.category) {
            matchesCategory = c.category === category;
          } else {
            if (category === 'quran') {
              matchesCategory = c.title.toLowerCase().includes('quran') || c.description.toLowerCase().includes('quran') || c.title.toLowerCase().includes('tafseer');
            } else if (category === 'tajweed') {
              matchesCategory = c.title.toLowerCase().includes('tajweed') || c.description.toLowerCase().includes('recitation') || c.title.toLowerCase().includes('vocabulary');
            } else if (category === 'arabic') {
              matchesCategory = c.title.toLowerCase().includes('arabic') || c.description.toLowerCase().includes('grammar') || c.title.toLowerCase().includes('linguistic');
            } else if (category === 'character') {
              matchesCategory = c.title.toLowerCase().includes('character') || c.title.toLowerCase().includes('family') || c.title.toLowerCase().includes('seerah') || c.title.toLowerCase().includes('ambassadors') || c.description.toLowerCase().includes('personal growth');
            }
          }
        }

        const matchesQuery = c.title.toLowerCase().includes(query) || (c.arabic && c.arabic.includes(query)) || c.description.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
      });

      this.renderCourses(filtered);
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.background = 'transparent';
          t.style.borderColor = 'rgba(255,255,255,0.1)';
        });
        tab.classList.add('active');
        tab.style.background = 'var(--primary)';
        tab.style.borderColor = 'var(--primary)';
        filterAndSearch();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => filterAndSearch());
    }

    const active = document.querySelector('#course-filter-tabs .filter-btn.active');
    if (active) {
      active.style.background = 'var(--primary)';
      active.style.borderColor = 'var(--primary)';
    }
  },

  renderResources(categories) {
    const grid = document.getElementById('resources-grid');
    if (!grid) return;
    grid.innerHTML = categories.map((cat, i) => `
      <div class="resource-category-card reveal" style="--i:${i};">
        <h3 class="resource-category-title">
          <span>${cat.icon}</span> <span>${cat.title}</span>
        </h3>
        <ul class="resource-items-list">
          ${cat.items.map(item => `
            <li class="resource-item">
              <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="resource-item-link">
                <span>${item.icon || '📄'}</span> <span>${item.title}</span>
              </a>
              <span class="resource-item-desc">${item.description}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
    ScrollReveal.init();
  },

  renderTestimonials(testimonials) {
    const track = document.getElementById('testimonials-track');
    if (!track) return;
    track.innerHTML = testimonials.map(t => {
      const avatarHtml = t.picture 
        ? `<img src="${t.picture}" alt="${t.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">`
        : `<div class="testimonial-avatar" style="background: linear-gradient(135deg, var(--primary), var(--accent-teal)); color:#fff; font-weight:700; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center">${t.initials}</div>`;
      
      return `
        <figure class="testimonial-card glass-card">
          <blockquote>"${t.quote}"</blockquote>
          <figcaption class="testimonial-author">
            ${avatarHtml}
            <div>
              <cite class="author-name">${t.name}</cite>
              <span class="author-role">${t.role}</span>
            </div>
          </figcaption>
        </figure>
      `;
    }).join('');
    TestimonialCarousel.init();
  },

  renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = projects.map((p, i) => {
      const isEmoji = !p.icon.startsWith('http') && !p.icon.startsWith('assets/');
      const iconHtml = isEmoji 
        ? `<div class="project-icon" style="font-size:2rem;margin-bottom:1rem">${p.icon}</div>`
        : `<img src="${p.icon}" alt="${p.title}" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 1rem; border-radius: 8px;">`;
      
      return `
        <article class="project-card reveal" style="--i:${i}">
          ${iconHtml}
          <h3>${p.title}</h3>
          ${p.subtitle ? `<span style="font-size:0.85rem;color:var(--accent-teal);margin-bottom:0.5rem;display:block">${p.subtitle}</span>` : ''}
          <p>${p.description}</p>
          <a href="${p.link || '#'}" class="card-link" style="color:var(--accent-gold)">Learn More →</a>
        </article>
      `;
    }).join('');
    ScrollReveal.init();
  },

  injectSchemaMetadata(courses) {
    try {
      const schema = {
        "@context": "https://schema.org",
        "@graph": []
      };

      schema["@graph"].push({
        "@type": "EducationalOrganization",
        "@id": "https://events.nurulquran.com/#organization",
        "name": "Nur-Ul-Quran International Institute",
        "url": "https://events.nurulquran.com/",
        "logo": "https://events.nurulquran.com/assets/logo.png",
        "sameAs": [
          "https://www.youtube.com/nurulqurantv"
        ]
      });

      courses.forEach(c => {
        schema["@graph"].push({
          "@type": "Course",
          "name": c.title,
          "description": c.description,
          "provider": {
            "@type": "EducationalOrganization",
            "name": "Nur-Ul-Quran International Institute",
            "sameAs": "https://events.nurulquran.com/"
          }
        });
      });

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema, null, 2);
      document.head.appendChild(script);
    } catch (err) {
      console.error("Schema metadata generation failed:", err);
    }
  }
};

// ---- 19. Flyer 3D Tilt & Light Sheen Manager ----
const FlyerTiltManager = {
  init() {
    if (window.matchMedia && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover)').matches)) {
      return;
    }

    const cards = document.querySelectorAll('.flyer-card');
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        
        card.style.setProperty('--tilt-y', `${((x - 0.5) * 6).toFixed(2)}deg`);
        card.style.setProperty('--tilt-x', `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
};

// ---- Initialize Everything ----
document.addEventListener('DOMContentLoaded', async () => {
  ThemeManager.init();
  NavManager.init();
  StarField.init();
  ScrollReveal.init();
  StatCounter.init();
  
  // DynamicDataManager loads testimonials and calls TestimonialCarousel.init()
  DynamicDataManager.init();
  
  MediaManager.init();
  VideoLightbox.init();
  SocialShareManager.init();
  initSmoothScroll();
  initFirstVisitScroll();

  await CalendarManager.init();
  FlyerLightboxManager.init();
  FlyerTiltManager.init();
});
