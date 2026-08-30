/* ============================================================
   NurulQuran — Archive Page Logic
   Handles: Filter tabs, keyword search, and rendering past events/trips
   ============================================================ */

const ArchiveManager = {
  items: [],
  activeFilter: 'all',
  searchQuery: '',

  async init() {
    this.grid = document.getElementById('archive-grid');
    this.filterTabs = document.querySelectorAll('.archive-filter-btn');
    this.searchInput = document.getElementById('archive-search');
    this.countEl = document.getElementById('archive-count');

    if (!this.grid) return;

    try {
      const res = await fetch('content/events.json');
      const data = await res.json();
      this.items = data.archive || [];
      this.render();
    } catch (err) {
      console.error('Failed to load archive data:', err);
    }

    this.setupListeners();
  },

  setupListeners() {
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.filter || 'all';
        this.render();
      });
    });

    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.render();
    });
  },

  getFilteredItems() {
    return this.items.filter(item => {
      const matchesFilter = this.activeFilter === 'all' || item.category === this.activeFilter;
      const matchesSearch = !this.searchQuery || 
        item.title.toLowerCase().includes(this.searchQuery) ||
        item.location.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery) ||
        (item.highlights && item.highlights.some(h => h.toLowerCase().includes(this.searchQuery)));
      return matchesFilter && matchesSearch;
    });
  },

  render() {
    if (!this.grid) return;

    const filtered = this.getFilteredItems();

    if (this.countEl) {
      this.countEl.textContent = `Showing ${filtered.length} of ${this.items.length} records`;
    }

    if (filtered.length === 0) {
      this.grid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🔍</span>
          <h3>No matching records found</h3>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">Try adjusting your search keyword or filter tab.</p>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = filtered.map(item => {
      const shareText = `*${item.title}* (${item.date})\n📍 ${item.location}\n${item.description}\n\nArchived from Nur-Ul-Quran International:\nhttps://nurulquran.web.app/archive.html`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

      const highlightsHtml = item.highlights && item.highlights.length > 0
        ? `<ul class="archive-highlights">${item.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`
        : '';

      return `
        <article class="archive-card glass-card reveal">
          <div class="archive-card-header">
            <span style="font-size: 2rem;">${item.icon || '📜'}</span>
            <span class="archive-badge">${item.tag || 'Past Program'}</span>
          </div>
          <h3>${item.title}</h3>
          <div class="archive-meta">
            <span>🗓️ ${item.date}</span>
            <span style="opacity: 0.5;">•</span>
            <span>📍 ${item.location}</span>
          </div>
          <p class="archive-desc">${item.description}</p>
          ${highlightsHtml}
          <div class="archive-footer">
            <a href="${item.link}" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">${item.linkText || 'View Details →'}</a>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp btn-whatsapp-sm" aria-label="Share ${item.title} on WhatsApp">
              <span>💬</span> <span>Share</span>
            </a>
          </div>
        </article>
      `;
    }).join('');

    if (window.ScrollReveal) {
      ScrollReveal.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  StarField.init();
  ArchiveManager.init();
});
