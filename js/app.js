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

// ---- Calendar & Events Manager ----
const CalendarManager = {
  events: {},

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
      if (data.calendar && Array.isArray(data.calendar)) {
        data.calendar.forEach(item => {
          if (!this.events[item.date]) {
            this.events[item.date] = [];
          }
          this.events[item.date].push({
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
          });
        });
      }

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

    // Auto-select and highlight first upcoming event with side flyer
    this.autoSelectFirstUpcomingEvent();
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
        this.showEvent(targetDate, btn);
      }
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
              const flyerShareText = `*${f.topic} (${f.city})*\n🗓️ ${f.date}\n📍 ${f.venue}\n📞 Contact: ${f.phone}\n\nJoin Ustazah Iffat Maqbool in Ireland!\nDetails: https://nurulquran.web.app/#events`;
              return `
                <div class="trip-flyer-thumb" data-flyer-src="${f.image}" data-caption="${f.city}: ${f.topic} (${f.date}) • ${f.venue} (Tel: ${f.phone})" data-share-text="${encodeURIComponent(flyerShareText)}">
                  <img src="${f.image}" alt="${f.city} Flyer" loading="lazy">
                  <span class="trip-flyer-label">${f.city} • ${f.topic}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      const tripShareText = `*${trip.title}*\n🗓️ ${trip.date}\n${trip.meta}\n\n${trip.description}\n\nMore details: https://nurulquran.web.app/#events`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(tripShareText)}`;
      const tripMapBtn = (trip.meta && !trip.meta.toLowerCase().includes('online'))
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.meta)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm trip-map-btn" style="padding:0.35rem 0.65rem;font-size:0.75rem"><span>📍</span> <span>Map</span></a>`
        : '';

      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item reveal';
      timelineItem.innerHTML = `
        <div class="timeline-badge">${trip.icon}</div>
        <div class="timeline-card glass-card">
          <span class="trip-tag ${tagClass}">${statusLabel}</span>
          <h3>${trip.title}</h3>
          <p class="trip-meta">${trip.meta}</p>
          <p class="trip-desc">${trip.description}</p>
          ${flyersHtml}
          <div class="trip-footer" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <a href="${trip.link}" class="btn ${btnClass}" ${trip.link.endsWith('.jpeg') || trip.link.endsWith('.jpg') ? 'data-flyer-link="true"' : ''}>${trip.linkText}</a>
            ${tripMapBtn}
            ${trip.registrationForm ? `<a href="${trip.registrationForm}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Register →</a>` : ''}
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp btn-whatsapp-sm">
              <span>💬</span> <span>Share</span>
            </a>
          </div>
        </div>
      `;

      // Bind click handlers on flyer thumbnails
      timelineItem.querySelectorAll('.trip-flyer-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const src = thumb.dataset.flyerSrc;
          const caption = thumb.dataset.caption;
          const shareText = thumb.dataset.shareText ? decodeURIComponent(thumb.dataset.shareText) : '';
          FlyerLightboxManager.open(src, caption, shareText, caption);
        });
      });

      // Bind flyer link button if applicable
      const flyerLinkBtn = timelineItem.querySelector('a[data-flyer-link="true"]');
      if (flyerLinkBtn) {
        flyerLinkBtn.addEventListener('click', (e) => {
          e.preventDefault();
          FlyerLightboxManager.open(trip.link, trip.title, tripShareText, trip.meta);
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

    // Days in current month
    for (let day = 1; day <= lastDay; day++) {
      const dayButton = document.createElement('button');
      dayButton.className = 'cal-day';
      dayButton.textContent = day;
      
      const dateString = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      if (this.events[dateString] && this.events[dateString].length > 0) {
        dayButton.classList.add('has-event');
        dayButton.setAttribute('aria-label', `Day ${day}, has ${this.events[dateString].length} event(s)`);
        
        // Add dot marker (renders 2 dots on Sept 6, 1 dot for single event days)
        const dotsWrap = document.createElement('span');
        dotsWrap.className = 'event-dots-wrap';
        for (let k = 0; k < this.events[dateString].length; k++) {
          const dot = document.createElement('span');
          dot.className = 'event-dot';
          dotsWrap.appendChild(dot);
        }
        dayButton.appendChild(dotsWrap);
        
        dayButton.addEventListener('click', () => this.showEvent(dateString, dayButton, 0));
      } else {
        dayButton.setAttribute('aria-label', `Day ${day}`);
      }

      this.daysGrid.appendChild(dayButton);
    }
  },

  showEvent(dateString, element, eventIndex = 0) {
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
          Program ${idx + 1}: ${idx === 0 ? '12:30 PM' : '4:30 PM'}
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

    const flyerShareText = `*${event.title}*\n🗓️ ${event.time}\n📍 ${event.location}\n📞 Contact: ${event.contact || '+353 83 025 6299'}\n\nJoin Ustazah Iffat Maqbool!\nMore details: https://nurulquran.web.app/#events`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(flyerShareText)}`;

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
          FlyerLightboxManager.open(flyerSrc, `${event.title}<br><span style="font-size:0.85em;opacity:0.85">${event.location} • ${event.time}</span>`, flyerShareText, event.location);
        });
      } else {
        flyerWrap.innerHTML = '';
        flyerWrap.classList.add('hidden');
      }
    }

    // Dynamic action buttons container (Registration + Google Maps + WhatsApp Share)
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

    // WhatsApp Share Button
    let waBtn = actionWrap.querySelector('.event-wa-btn');
    if (!waBtn) {
      waBtn = document.createElement('a');
      waBtn.className = 'btn-whatsapp event-wa-btn';
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.innerHTML = '<span>💬</span> <span>Share</span>';
      actionWrap.appendChild(waBtn);
    }
    waBtn.href = waUrl;

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
  }
};

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
        const shareText = `*${title}*\n🗓️ ${date}\n${venue}\n${phone}\n\nJoin Ustazah Iffat Maqbool (Nur-Ul-Quran International)!\nMore info: https://nurulquran.web.app/#events`;
        const venueQuery = venue.replace(/^📍\s*/, '').trim();
        this.open(src, caption, shareText, venueQuery);
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

  open(src, caption = '', shareText = '', mapQuery = '') {
    if (!this.lightbox || !this.img) return;
    this.img.src = src;
    if (this.caption) this.caption.innerHTML = caption;

    if (this.shareContainer) {
      const textToShare = shareText || caption.replace(/<[^>]*>?/gm, '');
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
      const mapBtnHtml = (mapQuery && !mapQuery.toLowerCase().includes('online'))
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.3);padding:0.6rem 1.2rem;display:inline-flex;align-items:center;gap:0.4rem;" onclick="event.stopPropagation()">
            <span>📍</span> <span>Google Maps</span>
          </a>`
        : '';

      this.shareContainer.innerHTML = `
        <div style="display:flex;gap:0.75rem;justify-content:center;align-items:center;flex-wrap:wrap;">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" onclick="event.stopPropagation()">
            <span>💬</span> <span>Share on WhatsApp</span>
          </a>
          ${mapBtnHtml}
        </div>
      `;
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

    const aboutMission = document.querySelector('#about p');
    if (aboutMission && site.mission) {
      aboutMission.textContent = site.mission;
    }

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
      const detailsBtnHtml = `<a href="${c.link || 'https://nurulquran.com/courses/'}" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 20px;">Details →</a>`;

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
      <div class="resource-category-card glass-card reveal" style="--i:${i}; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-light); background: var(--surface);">
        <h3 style="margin-top:0; color:var(--accent-teal); display:flex; align-items:center; gap:0.5rem; font-size:1.35rem">
          <span>${cat.icon}</span> <span>${cat.title}</span>
        </h3>
        <ul style="list-style:none; padding:0; margin:1.5rem 0 0 0; display:flex; flex-direction:column; gap:1rem">
          ${cat.items.map(item => `
            <li style="display:flex; flex-direction:column; gap:0.25rem">
              <a href="${item.link}" target="_blank" style="text-decoration:none; color:var(--text); font-weight:600; font-size:1rem; transition:color 0.3s; display:inline-flex; align-items:center; gap:0.35rem">
                <span>${item.icon || '📄'}</span> <span>${item.title}</span>
              </a>
              <span style="font-size:0.85rem; color:var(--text-muted, #94a3b8); line-height:1.4">${item.description}</span>
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
        "@id": "https://nurulquran.com/#organization",
        "name": "Nur-Ul-Quran International Institute",
        "url": "https://nurulquran.com",
        "logo": "https://nurulquran.com/assets/logo.png",
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
            "sameAs": "https://nurulquran.com"
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

// ---- Initialize Everything ----
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  StarField.init();
  ScrollReveal.init();
  StatCounter.init();
  
  // DynamicDataManager loads testimonials and calls TestimonialCarousel.init()
  DynamicDataManager.init();
  
  MediaManager.init();
  CalendarManager.init();
  FlyerLightboxManager.init();
  VideoLightbox.init();
  initSmoothScroll();
});
