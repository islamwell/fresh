/* ============================================================
   NurulQuran — Admin Dashboard Logic
   Handles Authentication, CRUD for JSON files, Export/Import
   ============================================================ */

const adminApp = {
  // Hardcoded hash for 'nurulquran2026'
  // SHA-256 hash for basic client-side protection
  targetHash: 'f2d79fd24bb1f3d1901fac7768435deb0dd467b2cf56aa901dc9444cfcee53fb',
  
  // Data State
  data: {
    events: null,
    courses: null,
    media: null,
    resources: null,
    projects: null,
    testimonials: null,
    site: null
  },
  
  hasUnsavedChanges: false,
  
  // Current Editing Context
  currentEditType: null,
  currentEditId: null,
  currentEditSubList: null,

  async init() {
    this.bindLogin();
    this.checkAuth();
  },

  /* ---- Authentication ---- */
  async hashPassword(password) {
    try {
      if (!crypto || !crypto.subtle) {
        alert("Web Crypto API is not available in this browser context (it requires localhost or HTTPS). Falling back to insecure login for local testing.");
        // Fallback for local testing without HTTPS/localhost
        return password === 'nurulquran2026' ? this.targetHash : 'invalid';
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      console.error("Hashing error:", e);
      alert("Error processing password: " + e.message);
      return 'error';
    }
  },

  bindLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwdInput = document.getElementById('admin-password').value;
      const hashed = await this.hashPassword(pwdInput);
      
      if (hashed === this.targetHash) {
        sessionStorage.setItem('nq-admin-auth', 'true');
        this.showDashboard();
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      sessionStorage.removeItem('nq-admin-auth');
      window.location.reload();
    });
  },

  checkAuth() {
    if (sessionStorage.getItem('nq-admin-auth') === 'true') {
      this.showDashboard();
    }
  },

  showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    this.bindDashboardEvents();
    this.loadAllData();
  },

  /* ---- Dashboard Logic ---- */
  bindDashboardEvents() {
    // Tabs
    const tabs = document.querySelectorAll('.nav-btn[data-tab]');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });

    // Modal close
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Form submit
    document.getElementById('modal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveModalData();
    });

    // Export / Import
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
    document.getElementById('import-file')?.addEventListener('change', (e) => this.importData(e));
    
    // Warn before leaving if unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  },

  setUnsavedChanges(status) {
    this.hasUnsavedChanges = status;
    const badge = document.getElementById('save-status');
    if (status) {
      badge.className = 'status-badge unsaved';
      badge.innerHTML = '⚠️ Unsaved Changes (Export to save)';
    } else {
      badge.className = 'status-badge saved';
      badge.innerHTML = '✔️ All Changes Saved';
    }
    
    // Auto-save to localStorage as backup
    if (status) {
      localStorage.setItem('nq-admin-backup', JSON.stringify(this.data));
    }
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✔️';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /* ---- Data Loading ---- */
  async loadAllData() {
    try {
      // Check for backup first
      const backup = localStorage.getItem('nq-admin-backup');
      if (backup) {
        if (confirm('Found unsaved changes from a previous session. Would you like to restore them?')) {
          try {
            this.data = JSON.parse(backup);
            this.setUnsavedChanges(true);
            this.renderAll();
            return;
          } catch (e) {
            console.error('Failed to parse backup:', e);
            localStorage.removeItem('nq-admin-backup');
            this.showToast('Failed to restore backup (corrupted data). Loading fresh data.', 'error');
          }
        } else {
          localStorage.removeItem('nq-admin-backup');
        }
      }

      // Fetch fresh data
      const fetchJson = async (url) => {
        const res = await fetch(url + '?t=' + Date.now()); // Prevent caching
        return res.json();
      };

      const [events, courses, media, resources, projects, testimonials, site] = await Promise.all([
        fetchJson('content/events.json'),
        fetchJson('content/courses.json'),
        fetchJson('content/media.json'),
        fetchJson('content/resources.json'),
        fetchJson('content/projects.json'),
        fetchJson('content/testimonials.json'),
        fetchJson('content/site.json')
      ]);

      this.data = { events, courses, media, resources, projects, testimonials, site };
      this.renderAll();
      
    } catch (err) {
      console.error('Error loading data:', err);
      this.showToast('Failed to load site data. Are the JSON files accessible?', 'error');
    }
  },

  renderAll() {
    this.renderEvents();
    this.renderCourses();
    this.renderMedia();
    this.renderResources();
    this.renderProjects();
    this.renderTestimonials();
    this.renderSettings();
  },

  /* ---- Specific Rendering Methods ---- */
  
  // Helper to generate a card
  generateCardHTML(title, subtitle, meta, desc, actionsHtml) {
    return `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <h4 class="item-title">${title}</h4>
            ${subtitle ? `<span class="item-subtitle">${subtitle}</span>` : ''}
          </div>
        </div>
        ${meta ? `<div class="item-meta">${meta}</div>` : ''}
        ${desc ? `<div class="item-desc">${desc}</div>` : ''}
        <div class="item-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
  },

  renderEvents() {
    if (!this.data.events) return;
    const d = this.data.events;
    
    // Calendar
    const calList = document.getElementById('list-events-calendar');
    calList.innerHTML = (d.calendar || []).map((e, i) => this.generateCardHTML(
      e.title, e.type, `${e.date} | ${e.time} | ${e.location}`, e.description,
      `<button class="action-btn" onclick="adminApp.openModal('event', ${i}, 'calendar')">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('event', ${i}, 'calendar')">Delete</button>`
    )).join('');

    // Trips
    const tripsList = document.getElementById('list-events-trips');
    tripsList.innerHTML = (d.trips || []).map((e, i) => this.generateCardHTML(
      `${e.icon} ${e.title}`, e.status, `${e.date} | ${e.meta}`, e.description,
      `<button class="action-btn" onclick="adminApp.openModal('event', ${i}, 'trips')">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('event', ${i}, 'trips')">Delete</button>`
    )).join('');

    // Upcoming General
    const upcomingList = document.getElementById('list-events-upcoming');
    upcomingList.innerHTML = (d.upcoming || []).map((e, i) => this.generateCardHTML(
      `${e.icon} ${e.title}`, e.status, e.date, e.description,
      `<button class="action-btn" onclick="adminApp.openModal('event', ${i}, 'upcoming')">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('event', ${i}, 'upcoming')">Delete</button>`
    )).join('');

    // Past General
    const pastList = document.getElementById('list-events-past');
    pastList.innerHTML = (d.past || []).map((e, i) => this.generateCardHTML(
      `${e.icon} ${e.title}`, e.status, e.date, e.description,
      `<button class="action-btn" onclick="adminApp.openModal('event', ${i}, 'past')">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('event', ${i}, 'past')">Delete</button>`
    )).join('');
  },

  renderCourses() {
    if (!this.data.courses) return;
    const list = document.getElementById('list-courses');
    list.innerHTML = this.data.courses.courses.map((c, i) => this.generateCardHTML(
      `${c.icon} ${c.title}`, `ID: ${c.id}`, `Color: ${c.color}`, c.description,
      `<button class="action-btn" onclick="adminApp.openModal('course', ${i})">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('course', ${i})">Delete</button>`
    )).join('');
  },

  renderMedia() {
    if (!this.data.media) return;
    const d = this.data.media;
    
    // Audio
    const audioList = document.getElementById('list-media-audio');
    audioList.innerHTML = (d.audio?.tracks || []).map((t, i) => this.generateCardHTML(
      t.title, `Surah: ${t.surahNumber}`, `Artist: ${t.artist} | Duration: ${t.duration}`, null,
      `<button class="action-btn" onclick="adminApp.openModal('audio', ${i})">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('audio', ${i})">Delete</button>`
    )).join('');

    // Video
    const videoList = document.getElementById('list-media-video');
    videoList.innerHTML = (d.video?.items || []).map((v, i) => this.generateCardHTML(
      v.title, `YouTube ID: ${v.youtubeId}`, null, v.description,
      `<button class="action-btn" onclick="adminApp.openModal('video', ${i})">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('video', ${i})">Delete</button>`
    )).join('');
  },

  renderResources() {
    // Simplified for admin view: just show structure
    if (!this.data.resources) return;
    const container = document.getElementById('list-resources-categories');
    container.innerHTML = this.data.resources.categories.map((c, catIdx) => `
      <section class="admin-section">
        <h3>${c.icon} ${c.title}</h3>
        <div class="item-list">
          ${c.items.map((item, itemIdx) => this.generateCardHTML(
            `${item.icon} ${item.title}`, null, `<a href="${item.link}" target="_blank" style="color:var(--accent-teal)">${item.link}</a>`, item.description,
            `<button class="action-btn" onclick="adminApp.openModal('resource', ${itemIdx}, ${catIdx})">Edit</button>
             <button class="action-btn delete" onclick="adminApp.deleteItem('resource', ${itemIdx}, ${catIdx})">Delete</button>`
          )).join('')}
          <div class="item-card" style="justify-content:center;align-items:center;border-style:dashed;cursor:pointer" onclick="adminApp.openModal('resource', null, ${catIdx})">
             + Add Resource
          </div>
        </div>
      </section>
    `).join('');
  },

  renderProjects() {
    if (!this.data.projects) return;
    const list = document.getElementById('list-projects');
    list.innerHTML = this.data.projects.projects.map((p, i) => this.generateCardHTML(
      `${p.icon} ${p.title}`, p.subtitle || p.status, null, p.description,
      `<button class="action-btn" onclick="adminApp.openModal('project', ${i})">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('project', ${i})">Delete</button>`
    )).join('');
  },

  renderTestimonials() {
    if (!this.data.testimonials) return;
    const list = document.getElementById('list-testimonials');
    list.innerHTML = this.data.testimonials.testimonials.map((t, i) => this.generateCardHTML(
      t.name, t.role, `Initials: ${t.initials}`, `"${t.quote}"`,
      `<button class="action-btn" onclick="adminApp.openModal('testimonial', ${i})">Edit</button>
       <button class="action-btn delete" onclick="adminApp.deleteItem('testimonial', ${i})">Delete</button>`
    )).join('');
  },

  renderSettings() {
    if (!this.data.site) return;
    const s = this.data.site;
    const c = document.getElementById('settings-form-container');
    
    // Basic flat settings form
    c.innerHTML = `
      <div class="form-group">
        <label>Site Name</label>
        <input type="text" id="setting-name" value="${s.name || ''}">
      </div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="setting-fullName" value="${s.fullName || ''}">
      </div>
      <div class="form-group">
        <label>Tagline</label>
        <input type="text" id="setting-tagline" value="${s.tagline || ''}">
      </div>
      <div class="form-group">
        <label>Mission Statement</label>
        <textarea id="setting-mission">${s.mission || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Email Contact</label>
        <input type="email" id="setting-email" value="${s.contact?.email || ''}">
      </div>
      <div class="form-group">
        <label>YouTube Link</label>
        <input type="url" id="setting-youtube" value="${s.social?.youtube || ''}">
      </div>
    `;
  },

  saveSettings() {
    if (!this.data.site) return;
    this.data.site.name = document.getElementById('setting-name').value;
    this.data.site.fullName = document.getElementById('setting-fullName').value;
    this.data.site.tagline = document.getElementById('setting-tagline').value;
    this.data.site.mission = document.getElementById('setting-mission').value;
    this.data.site.contact.email = document.getElementById('setting-email').value;
    this.data.site.social.youtube = document.getElementById('setting-youtube').value;
    
    this.setUnsavedChanges(true);
    this.showToast('Settings updated');
  },

  /* ---- Modal / Forms ---- */
  
  openModal(type, id = null, subList = null) {
    this.currentEditType = type;
    this.currentEditId = id;
    this.currentEditSubList = subList;
    
    const isNew = id === null;
    document.getElementById('modal-title').textContent = isNew ? `Add New ${type}` : `Edit ${type}`;
    
    const form = document.getElementById('modal-form');
    let item = {};
    
    // Fetch item if editing
    if (!isNew) {
      if (type === 'event') item = this.data.events[subList][id];
      if (type === 'course') item = this.data.courses.courses[id];
      if (type === 'audio') item = this.data.media.audio.tracks[id];
      if (type === 'video') item = this.data.media.video.items[id];
      if (type === 'resource') item = this.data.resources.categories[subList].items[id];
      if (type === 'project') item = this.data.projects.projects[id];
      if (type === 'testimonial') item = this.data.testimonials.testimonials[id];
    }
    
    // Build Form HTML based on type
    let html = '';
    
    if (type === 'event' && subList === 'calendar') {
      html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Date (YYYY-MM-DD)</label><input type="date" name="date" value="${item.date || ''}" required></div>
        <div class="form-group"><label>Type (e.g., Weekly Circle, Seminar)</label><input type="text" name="type" value="${item.type || ''}" required></div>
        <div class="form-group"><label>Time</label><input type="text" name="time" value="${item.time || ''}" required></div>
        <div class="form-group"><label>Location</label><input type="text" name="location" value="${item.location || ''}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>Event Link (Zoom/Live)</label><input type="url" name="link" value="${item.link || ''}"></div>
        <div class="form-group"><label>Registration Form (Google Form URL)</label><input type="url" name="registrationForm" value="${item.registrationForm || ''}"></div>
      `;
    } else if (type === 'event' && subList === 'trips') {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Date/Month</label><input type="text" name="date" value="${item.date || ''}" required></div>
        <div class="form-group"><label>Status</label><select name="status"><option value="upcoming" ${item.status === 'upcoming' ? 'selected' : ''}>Upcoming</option><option value="past" ${item.status === 'past' ? 'selected' : ''}>Past</option></select></div>
        <div class="form-group"><label>Icon Emoji</label><input type="text" name="icon" value="${item.icon || ''}" required></div>
        <div class="form-group"><label>Meta Info (Location | Duration)</label><input type="text" name="meta" value="${item.meta || ''}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>More Info Link</label><input type="url" name="link" value="${item.link || ''}"></div>
        <div class="form-group"><label>Link Text</label><input type="text" name="linkText" value="${item.linkText || 'Details →'}"></div>
        <div class="form-group"><label>Registration Form (Google Form URL)</label><input type="url" name="registrationForm" value="${item.registrationForm || ''}"></div>
      `;
    } else if (type === 'event' && (subList === 'upcoming' || subList === 'past')) {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Date/Year</label><input type="text" name="date" value="${item.date || ''}" required></div>
        <div class="form-group"><label>Status</label><input type="text" name="status" value="${item.status || ''}" required></div>
        <div class="form-group"><label>Icon Emoji</label><input type="text" name="icon" value="${item.icon || ''}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>Link</label><input type="url" name="link" value="${item.link || ''}"></div>
      `;
    } else if (type === 'course') {
      html = `
        <div class="form-group"><label>ID (unique string)</label><input type="text" name="id" value="${item.id || ''}" required></div>
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Icon Emoji</label><input type="text" name="icon" value="${item.icon || ''}" required></div>
        <div class="form-group"><label>Color CSS Var</label><input type="text" name="color" value="${item.color || 'var(--primary)'}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>Course Link</label><input type="url" name="link" value="${item.link || ''}" required></div>
      `;
    } else if (type === 'audio') {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Artist</label><input type="text" name="artist" value="${item.artist || 'Mishary Rashid Alafasy'}" required></div>
        <div class="form-group"><label>Surah Number</label><input type="text" name="surahNumber" value="${item.surahNumber || ''}"></div>
        <div class="form-group"><label>Duration (MM:SS)</label><input type="text" name="duration" value="${item.duration || ''}"></div>
        <div class="form-group"><label>Audio URL (.mp3)</label><input type="url" name="src" value="${item.src || ''}" required></div>
      `;
    } else if (type === 'video') {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>YouTube Video ID</label><input type="text" name="youtubeId" value="${item.youtubeId || ''}" required placeholder="e.g. 5Hw0Q7yJigw"></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
      `;
    } else if (type === 'resource') {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Icon Emoji</label><input type="text" name="icon" value="${item.icon || ''}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>URL Link</label><input type="url" name="link" value="${item.link || ''}" required></div>
      `;
    } else if (type === 'project') {
       html = `
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${item.title || ''}" required></div>
        <div class="form-group"><label>Subtitle</label><input type="text" name="subtitle" value="${item.subtitle || ''}"></div>
        <div class="form-group"><label>Status (active/seasonal)</label><input type="text" name="status" value="${item.status || 'active'}"></div>
        <div class="form-group"><label>Icon Emoji</label><input type="text" name="icon" value="${item.icon || ''}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description" required>${item.description || ''}</textarea></div>
        <div class="form-group"><label>Project Link</label><input type="url" name="link" value="${item.link || ''}" required></div>
      `;
    } else if (type === 'testimonial') {
       html = `
        <div class="form-group"><label>Student Name</label><input type="text" name="name" value="${item.name || ''}" required></div>
        <div class="form-group"><label>Role / Course</label><input type="text" name="role" value="${item.role || ''}" required></div>
        <div class="form-group"><label>Initials</label><input type="text" name="initials" value="${item.initials || ''}" required maxlength="2"></div>
        <div class="form-group"><label>Quote</label><textarea name="quote" required>${item.quote || ''}</textarea></div>
      `;
    }
    
    form.innerHTML = html;
    document.getElementById('admin-modal').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('admin-modal').classList.add('hidden');
    document.getElementById('modal-form').innerHTML = '';
  },

  saveModalData() {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const newItem = Object.fromEntries(formData.entries());
    
    // Auto-generate IDs where needed
    if (this.currentEditType === 'audio' && this.currentEditId === null) {
        newItem.id = Date.now();
    }
    if (this.currentEditType === 'video' && this.currentEditId === null) {
        newItem.id = Date.now();
    }
    
    const type = this.currentEditType;
    const id = this.currentEditId;
    const subList = this.currentEditSubList;
    const isNew = id === null;
    
    // Determine target array
    let targetArr;
    if (type === 'event') targetArr = this.data.events[subList];
    else if (type === 'course') targetArr = this.data.courses.courses;
    else if (type === 'audio') targetArr = this.data.media.audio.tracks;
    else if (type === 'video') targetArr = this.data.media.video.items;
    else if (type === 'resource') targetArr = this.data.resources.categories[subList].items;
    else if (type === 'project') targetArr = this.data.projects.projects;
    else if (type === 'testimonial') targetArr = this.data.testimonials.testimonials;

    // Apply change
    if (isNew) {
      if (!targetArr) targetArr = [];
      targetArr.push(newItem);
    } else {
      targetArr[id] = { ...targetArr[id], ...newItem };
    }

    this.setUnsavedChanges(true);
    this.renderAll();
    this.closeModal();
    this.showToast(`${isNew ? 'Added' : 'Updated'} successfully`);
  },

  deleteItem(type, id, subList = null) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    let targetArr;
    if (type === 'event') targetArr = this.data.events[subList];
    else if (type === 'course') targetArr = this.data.courses.courses;
    else if (type === 'audio') targetArr = this.data.media.audio.tracks;
    else if (type === 'video') targetArr = this.data.media.video.items;
    else if (type === 'resource') targetArr = this.data.resources.categories[subList].items;
    else if (type === 'project') targetArr = this.data.projects.projects;
    else if (type === 'testimonial') targetArr = this.data.testimonials.testimonials;

    targetArr.splice(id, 1);
    
    this.setUnsavedChanges(true);
    this.renderAll();
    this.showToast('Item deleted', 'warning');
  },

  /* ---- Export / Import ---- */
  exportData() {
    // For simplicity without JSZip, we trigger individual downloads for the files
    const files = [
      { name: 'events.json', content: this.data.events },
      { name: 'courses.json', content: this.data.courses },
      { name: 'media.json', content: this.data.media },
      { name: 'resources.json', content: this.data.resources },
      { name: 'projects.json', content: this.data.projects },
      { name: 'testimonials.json', content: this.data.testimonials },
      { name: 'site.json', content: this.data.site }
    ];

    // Download them with a slight delay between each to bypass browser multi-download blockers
    files.forEach((file, index) => {
      setTimeout(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(file.content, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = file.name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }, index * 300);
    });

    this.setUnsavedChanges(false);
    this.showToast('JSON files generated. Replace them in content/ folder and redeploy.');
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = file.name;
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        
        // Naive routing based on filename
        if (fileName === 'events.json') this.data.events = json;
        else if (fileName === 'courses.json') this.data.courses = json;
        else if (fileName === 'media.json') this.data.media = json;
        else if (fileName === 'resources.json') this.data.resources = json;
        else if (fileName === 'projects.json') this.data.projects = json;
        else if (fileName === 'testimonials.json') this.data.testimonials = json;
        else if (fileName === 'site.json') this.data.site = json;
        else {
          throw new Error("Unknown file name. Must match standard content files.");
        }
        
        this.setUnsavedChanges(true);
        this.renderAll();
        this.showToast(`Imported ${fileName} successfully`);
      } catch (err) {
        console.error(err);
        this.showToast(`Failed to parse ${fileName}`, 'error');
      }
      
      // Reset input
      e.target.value = '';
    };
    
    reader.readAsText(file);
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
  adminApp.init();
});
