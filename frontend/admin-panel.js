/**
 * admin-panel.js
 * Dilshad Designs — Admin Dashboard
 * Modular, premium SaaS-level JavaScript
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     CONSTANTS
  ═══════════════════════════════════════════════════════════════════ */
  const CONFIG = {
    API_BASE: window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://dilshad-designs.onrender.com',
    TOKEN_KEY:       'dd_admin_token',
    TOKEN_EXP_KEY:   'dd_admin_exp',
    THEME_KEY:       'adminTheme',
    AUTO_REFRESH_MS: 60_000,
    SESSION_WARN_S:  300,
    SESSION_DANGER_S: 60,
    TOAST_DURATION:  3400,
    PAGE_SIZE:       10,
    DEBOUNCE_DELAY:  280,
  };

  const STATUS = {
    contacts: ['new', 'read', 'replied'],
    leads:    ['new', 'contacted', 'converted'],
  };

  /* ═══════════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════════ */
  const State = {
    contacts:       [],
    leads:          [],
    pendingDelete:  null,
    undoDeleteItem: null,
    undoTimer:      null,
    currentContact: null,
    activeTab:      'contacts',
    autoRefreshTimer: null,
    sessionTimer:   null,
    toastTimer:     null,
    contactPage:    1,
    leadPage:       1,
    contactSort:    { col: 'createdAt', dir: 'desc' },
    leadSort:       { col: 'createdAt', dir: 'desc' },
    selectedContacts: new Set(),
    selectedLeads:    new Set(),
    charts:           {},
  };

  /* ═══════════════════════════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const DOM = {
    splash:             $('splashScreen'),
    splashBrand:        $('splashBrand'),
    loginScreen:        $('loginScreen'),
    dashboard:          $('dashboard'),
    passwordInput:      $('passwordInput'),
    loginBtn:           $('loginBtn'),
    loginError:         $('loginError'),
    loginErrorText:     $('loginErrorText'),
    logoutBtn:          $('logoutBtn'),
    darkToggle:         $('darkToggle'),
    liveTime:           $('liveTime'),
    sessionTimerEl:     $('sessionTimer'),
    sessionCountdown:   $('sessionCountdown'),
    mobileMenuBtn:      $('mobileMenuBtn'),
    mobileDropdown:     $('mobileDropdown'),
    mobileDarkToggle:   $('mobileDarkToggle'),
    mobileDarkLabel:    $('mobileDarkLabel'),
    mobileDarkIcon:     $('mobileDarkToggle')?.querySelector('i'),
    mobileLogoutBtn:    $('mobileLogoutBtn'),
    mobileSessionCountdown: $('mobileSessionCountdown'),
    contactsTableWrap:  $('contactsTableWrap'),
    leadsTableWrap:     $('leadsTableWrap'),
    contactsTab:        $('contactsTab'),
    leadsTab:           $('leadsTab'),
    contactsBadge:      $('contactsBadge'),
    leadsBadge:         $('leadsBadge'),
    msgModal:           $('msgModal'),
    confirmModal:       $('confirmModal'),
    toast:              $('toast'),
    lastUpdated:        $('lastUpdated'),
    refreshDot:         document.querySelector('.refresh-dot'),
    contactSearch:      $('contactSearch'),
    contactStatusFilter: $('contactStatusFilter'),
    leadSearch:         $('leadSearch'),
    leadStatusFilter:   $('leadStatusFilter'),
  };

  /* ═══════════════════════════════════════════════════════════════════
     UTILS MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Utils = {
    escHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    },

    formatDate(iso) {
      return new Date(iso).toLocaleString('en-IN', {
        timeZone:'Asia/Kolkata', day:'2-digit', month:'short',
        year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true,
      });
    },

    isRecent24h(iso) {
      return (Date.now() - new Date(iso).getTime()) < 86_400_000;
    },

    debounce(fn, delay) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    },

    getNote(id)         { return localStorage.getItem('note_' + id) || ''; },
    saveNote(id, text)  { localStorage.setItem('note_' + id, text); },

    copyToClipboard(text) {
      return navigator.clipboard.writeText(text);
    },

    exportCSV(data, filename, headers, rowFn) {
      const rows = data.map(rowFn);
      const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
      const a    = document.createElement('a');
      a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      a.download = filename;
      a.click();
    },

    animateNum(el, target) {
      const start    = parseInt(el.textContent) || 0;
      const duration = 640;
      const startT   = performance.now();
      const step = now => {
        const prog = Math.min((now - startT) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        el.textContent = Math.round(start + (target - start) * ease);
        if (prog < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    skeletonHTML(rows = 6) {
      let html = '<div class="skeleton-table">';
      for (let i = 0; i < rows; i++) {
        html += `<div class="skeleton-row">
          <div class="skeleton-cell sk-w1"></div>
          <div class="skeleton-cell sk-w2"></div>
          <div class="skeleton-cell sk-w3"></div>
          <div class="skeleton-cell sk-w4"></div>
          <div class="skeleton-cell sk-w5"></div>
        </div>`;
      }
      html += '</div>';
      return html;
    },

    statSkeletonHTML() {
      return Array(5).fill(0).map(() => `
        <div class="stat-skeleton">
          <div class="sk-icon"></div>
          <div class="sk-text">
            <div class="sk-num"></div>
            <div class="sk-lbl"></div>
          </div>
        </div>`).join('');
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     TOKEN / AUTH MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Auth = {
    getToken()       { return localStorage.getItem(CONFIG.TOKEN_KEY); },
    clearToken()     { localStorage.removeItem(CONFIG.TOKEN_KEY); localStorage.removeItem(CONFIG.TOKEN_EXP_KEY); },
    saveToken(token, expiresIn) {
      localStorage.setItem(CONFIG.TOKEN_KEY,     token);
      localStorage.setItem(CONFIG.TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000));
    },
    getSecondsRemaining() {
      const exp = parseInt(localStorage.getItem(CONFIG.TOKEN_EXP_KEY) || '0', 10);
      return Math.max(0, Math.floor((exp - Date.now()) / 1000));
    },
    isValid() { return !!this.getToken() && this.getSecondsRemaining() > 0; },
  };

  /* ═══════════════════════════════════════════════════════════════════
     API MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const API = {
    async fetch(endpoint, options = {}) {
      if (!Auth.isValid()) {
        Session.handleExpiry();
        throw new Error('No valid token');
      }
      const res = await fetch(`${CONFIG.API_BASE}/api/admin${endpoint}`, {
        method : options.method || 'GET',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`,
        },
        body: options.body || undefined,
      });

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.expired) Session.handleExpiry();
        else { UI.showToast('Unauthorized. Please log in again.', 'error'); setTimeout(App.logout, 1500); }
        throw new Error('Unauthorized');
      }
      return res.json();
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     UI MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const UI = {
    showToast(message, type = 'success', undoFn = null) {
      const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        info:    'fa-info-circle',
        warning: 'fa-exclamation-triangle',
      };
      let html = `<i class="fas ${icons[type] || icons.success}"></i><span>${message}</span>`;
      if (undoFn) {
        html += `<button class="toast-undo" id="undoBtn">Undo</button>`;
      }
      DOM.toast.innerHTML  = html;
      DOM.toast.className  = `toast ${type} show`;

      if (undoFn) {
        document.getElementById('undoBtn').addEventListener('click', () => {
          clearTimeout(State.toastTimer);
          DOM.toast.classList.remove('show');
          undoFn();
        });
      }

      clearTimeout(State.toastTimer);
      State.toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), CONFIG.TOAST_DURATION);
    },

    showConfirm(title, body, iconClass = 'danger') {
      return new Promise(resolve => {
        const box = DOM.confirmModal.querySelector('.confirm-box');
        box.querySelector('.confirm-icon').className = `confirm-icon fas fa-trash-alt ${iconClass}`;
        box.querySelector('h3').textContent = title;
        box.querySelector('p').textContent  = body;
        DOM.confirmModal.classList.add('open');

        const cleanup = () => DOM.confirmModal.classList.remove('open');
        const onConfirm = () => { cleanup(); resolve(true);  };
        const onCancel  = () => { cleanup(); resolve(false); };

        $('confirmDeleteBtn').onclick = onConfirm;
        $('confirmCancelBtn').onclick = onCancel;
      });
    },

    buildBadge(status) {
      const icons = {
        new:       'fa-circle',
        read:      'fa-eye',
        replied:   'fa-reply',
        contacted: 'fa-phone',
        converted: 'fa-check-circle',
      };
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return `<span class="badge badge-${Utils.escHtml(status)}">
        <i class="fas ${icons[status] || 'fa-circle'}"></i>${label}
      </span>`;
    },

    buildServiceBadge(subject) {
      const s   = (subject || '').toLowerCase();
      let cls   = 'svc-other';
      if      (s.includes('brand') || s.includes('logo'))       cls = 'svc-branding';
      else if (s.includes('web')   || s.includes('landing'))    cls = 'svc-web';
      else if (s.includes('market')|| s.includes('advert'))     cls = 'svc-marketing';
      else if (s.includes('social'))                             cls = 'svc-social';
      else if (s.includes('packag'))                             cls = 'svc-packaging';
      else if (s.includes('ui')    || s.includes('ux'))         cls = 'svc-ui';
      return `<span class="service-badge ${cls}">${Utils.escHtml(subject)}</span>`;
    },

    build24hBadge() {
      return `<span class="badge-24h"><i class="fas fa-clock"></i> 24h</span>`;
    },

    buildStatusSelect(type, id, current) {
      const options = STATUS[type]
        .map(s => `<option value="${s}" ${current===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`)
        .join('');
      return `<select class="status-select" data-id="${id}" data-type="${type}">${options}</select>`;
    },

    updateDarkIcon(theme) {
      const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
      DOM.darkToggle.innerHTML = `<i class="fas ${icon}"></i>`;
      if (DOM.mobileDarkLabel) DOM.mobileDarkLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      const mdi = DOM.mobileDarkToggle?.querySelector('i');
      if (mdi) mdi.className = `fas ${icon}`;
    },

    setRefreshSpinning(spinning) {
      if (!DOM.refreshDot) return;
      if (spinning) DOM.refreshDot.classList.add('spinning');
      else          DOM.refreshDot.classList.remove('spinning');
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     THEME MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Theme = {
    init() {
      const saved = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
      document.documentElement.setAttribute('data-theme', saved);
      UI.updateDarkIcon(saved);
    },
    toggle() {
      const cur  = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(CONFIG.THEME_KEY, next);
      UI.updateDarkIcon(next);
      Charts.updateTheme();
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     SESSION MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Session = {
    start() {
      clearInterval(State.sessionTimer);
      State.sessionTimer = setInterval(() => {
        const secs = Auth.getSecondsRemaining();
        const fmt  = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
        DOM.sessionCountdown.textContent      = fmt;
        if (DOM.mobileSessionCountdown) DOM.mobileSessionCountdown.textContent = fmt;

        DOM.sessionTimerEl.className = 'session-timer';
        if (secs <= 0) {
          clearInterval(State.sessionTimer);
          this.handleExpiry();
        } else if (secs <= CONFIG.SESSION_DANGER_S) {
          DOM.sessionTimerEl.classList.add('danger');
        } else if (secs <= CONFIG.SESSION_WARN_S) {
          DOM.sessionTimerEl.classList.add('warning');
        }
      }, 1000);
    },

    handleExpiry() {
      UI.showToast('Session expired. Please log in again.', 'error');
      setTimeout(App.logout, 1600);
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     CLOCK
  ═══════════════════════════════════════════════════════════════════ */
  function startClock() {
    const tick = () => {
      DOM.liveTime.textContent = new Date().toLocaleTimeString('en-IN', {
        timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true,
      }) + ' IST';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ═══════════════════════════════════════════════════════════════════
     CHARTS MODULE (lightweight Canvas)
  ═══════════════════════════════════════════════════════════════════ */
  const Charts = {
    brandColor()  { return getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#2F7A66'; },
    textMuted()   { return getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#5a7a6e'; },
    borderColor() { return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5ede9'; },

    drawLineChart(canvasId, labels, data, label) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W   = canvas.width  = canvas.offsetWidth  || 300;
      const H   = canvas.height = canvas.offsetHeight || 120;
      ctx.clearRect(0, 0, W, H);

      if (!data.length) return;

      const padL = 8, padR = 8, padT = 12, padB = 20;
      const maxVal = Math.max(...data, 1);
      const stepX  = (W - padL - padR) / Math.max(data.length - 1, 1);

      // Grid lines
      ctx.strokeStyle = this.borderColor();
      ctx.lineWidth   = 1;
      [0.25, 0.5, 0.75, 1].forEach(f => {
        const y = padT + (1 - f) * (H - padT - padB);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      });

      const pts = data.map((v, i) => ({
        x: padL + i * stepX,
        y: padT + (1 - v / maxVal) * (H - padT - padB),
      }));

      // Fill
      const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
      grad.addColorStop(0,   'rgba(47,122,102,0.22)');
      grad.addColorStop(1,   'rgba(47,122,102,0)');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, H - padB);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, H - padB);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = this.brandColor();
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = 'round';
      ctx.stroke();

      // Dots
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle   = this.brandColor();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      // Labels
      ctx.fillStyle  = this.textMuted();
      ctx.font       = '9px DM Sans, sans-serif';
      ctx.textAlign  = 'center';
      labels.forEach((lbl, i) => ctx.fillText(lbl, pts[i].x, H - 4));
    },

    drawDonutChart(canvasId, segments) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx   = canvas.getContext('2d');
      const W     = canvas.width  = canvas.offsetWidth  || 120;
      const H     = canvas.height = canvas.offsetHeight || 120;
      ctx.clearRect(0, 0, W, H);

      const total  = segments.reduce((s, seg) => s + seg.value, 0);
      if (!total) return;

      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 8, r = R * 0.55;
      let angle = -Math.PI / 2;

      segments.forEach(seg => {
        const slice = (seg.value / total) * (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        angle += slice;
      });

      // Donut hole
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fff';
      ctx.fill();

      // Center text
      ctx.fillStyle  = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#111';
      ctx.font       = `bold ${Math.round(R * 0.38)}px Syne, sans-serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, cx, cy);
    },

    buildWeeklyData(items) {
      const days    = [];
      const counts  = [];
      const labels  = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        days.push(key);
        labels.push(d.toLocaleDateString('en-IN', { weekday:'short' }));
      }
      days.forEach(d => {
        counts.push(items.filter(c => new Date(c.createdAt).toDateString() === d).length);
      });
      return { labels, counts };
    },

    renderContactChart() {
      const { labels, counts } = this.buildWeeklyData(State.contacts);
      this.drawLineChart('contactsChart', labels, counts, 'Messages');
    },

    renderLeadsChart() {
      const statusSegs = [
        { value: State.leads.filter(l => l.status==='new').length,       color:'#3b82f6' },
        { value: State.leads.filter(l => l.status==='contacted').length, color:'#d97706' },
        { value: State.leads.filter(l => l.status==='converted').length, color:'#2F7A66' },
      ];
      this.drawDonutChart('leadsChart', statusSegs);
    },

    updateTheme() {
      setTimeout(() => {
        this.renderContactChart();
        this.renderLeadsChart();
      }, 50);
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     STATS MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const StatsModule = {
    update(data) {
      Utils.animateNum($('statTotalContacts'), data.totalContacts);
      Utils.animateNum($('statNewContacts'),   data.newContacts);
      Utils.animateNum($('statTotalLeads'),    data.totalLeads);
      Utils.animateNum($('statNewLeads'),      data.newLeads);

      DOM.contactsBadge.textContent = data.newContacts;
      DOM.leadsBadge.textContent    = data.newLeads;

      const converted = State.leads.filter(l => l.status === 'converted').length;
      const total     = State.leads.length;
      $('statConvRate').textContent = total > 0
        ? Math.round((converted / total) * 100) + '%'
        : '—';

      DOM.lastUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', {
        timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:true,
      });
    },

    async load() {
      try {
        const data = await API.fetch('/stats');
        if (data.success) this.update(data.data);
      } catch(e) { /* stats are non-critical */ }
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     CONTACTS MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Contacts = {
    filter() {
      const search = (DOM.contactSearch.value || '').toLowerCase().trim();
      const status = DOM.contactStatusFilter.value;
      return State.contacts.filter(c => {
        const matchSearch = !search ||
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.subject || '').toLowerCase().includes(search);
        return matchSearch && (!status || c.status === status);
      });
    },

    sort(data) {
      const { col, dir } = State.contactSort;
      return [...data].sort((a, b) => {
        let av = a[col] ?? ''; let bv = b[col] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        return dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    },

    render() {
      const filtered = this.sort(this.filter());
      const total    = filtered.length;
      const pages    = Math.ceil(total / CONFIG.PAGE_SIZE) || 1;
      State.contactPage = Math.min(State.contactPage, pages);

      const start   = (State.contactPage - 1) * CONFIG.PAGE_SIZE;
      const paged   = filtered.slice(start, start + CONFIG.PAGE_SIZE);

      this.renderBulkToolbar();

      if (!paged.length) {
        DOM.contactsTableWrap.innerHTML = State.contacts.length
          ? `<div class="no-results"><i class="fas fa-search"></i>No matching messages found.</div>`
          : `<div class="empty-state"><i class="fas fa-inbox"></i><p>No contact form submissions yet.</p></div>`;
        return;
      }

      const allChecked = paged.length > 0 && paged.every(c => State.selectedContacts.has(c._id));

      const rows = paged.map(c => {
        const note    = Utils.getNote(c._id);
        const recent  = Utils.isRecent24h(c.createdAt);
        const rowCls  = [
          'clickable-row',
          c.status === 'new' ? 'row-new' : '',
          recent ? 'row-recent' : '',
          State.selectedContacts.has(c._id) ? 'row-selected' : '',
        ].filter(Boolean).join(' ');

        return `<tr class="${rowCls}"
            data-id="${c._id}" data-name="${Utils.escHtml(c.name)}" data-email="${Utils.escHtml(c.email)}"
            data-subject="${Utils.escHtml(c.subject)}" data-message="${Utils.escHtml(c.message)}" data-date="${Utils.escHtml(Utils.formatDate(c.createdAt))}">
          <td class="td-checkbox" data-label="" onclick="event.stopPropagation()">
            <input type="checkbox" class="row-checkbox" data-id="${c._id}" ${State.selectedContacts.has(c._id)?'checked':''}>
          </td>
          <td data-label="From" class="td-email">
            <div class="flex-center gap-sm">
              <a href="mailto:${Utils.escHtml(c.email)}" onclick="event.stopPropagation()">${Utils.escHtml(c.email)}</a>
              <button class="copy-btn" onclick="event.stopPropagation();App.copyText('${Utils.escHtml(c.email)}')" title="Copy email"><i class="fas fa-copy"></i></button>
            </div>
            <span class="td-name">${Utils.escHtml(c.name)}</span>
          </td>
          <td data-label="Service">${UI.buildServiceBadge(c.subject)}${recent ? UI.build24hBadge() : ''}</td>
          <td data-label="Message" class="td-message">${Utils.escHtml(c.message)}</td>
          <td data-label="Note" class="note-cell">
            ${note
              ? `<span class="note-text" title="${Utils.escHtml(note)}">${Utils.escHtml(note)}</span>`
              : `<span class="note-empty">No note</span>`}
          </td>
          <td data-label="Status">${UI.buildBadge(c.status)}</td>
          <td data-label="Update" onclick="event.stopPropagation()">
            ${UI.buildStatusSelect('contacts', c._id, c.status)}
          </td>
          <td data-label="Date" class="td-date">${Utils.formatDate(c.createdAt)}</td>
          <td data-label="" onclick="event.stopPropagation()">
            <button class="delete-btn" data-id="${c._id}" data-type="contacts" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>`;
      }).join('');

      DOM.contactsTableWrap.innerHTML = `
        <table>
          <thead><tr>
            <th class="th-checkbox"><input type="checkbox" class="row-checkbox" id="selectAllContacts" ${allChecked?'checked':''}></th>
            <th class="sortable ${State.contactSort.col==='email'?'sort-'+State.contactSort.dir:''}" data-col="email">From</th>
            <th>Service</th>
            <th>Message</th>
            <th>Note</th>
            <th>Status</th>
            <th>Update</th>
            <th class="sortable ${State.contactSort.col==='createdAt'?'sort-'+State.contactSort.dir:''}" data-col="createdAt">Date</th>
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${this.paginationHTML(total, State.contactPage, 'contacts')}`;

      this.bindTableEvents();
    },

    paginationHTML(total, page, type) {
      const pages = Math.ceil(total / CONFIG.PAGE_SIZE) || 1;
      if (pages <= 1) return '';
      const start = (page - 1) * CONFIG.PAGE_SIZE + 1;
      const end   = Math.min(page * CONFIG.PAGE_SIZE, total);
      let btns = `<button class="page-btn" data-type="${type}" data-page="${page-1}" ${page<=1?'disabled':''}>‹ Prev</button>`;
      for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
          btns += `<button class="page-btn ${i===page?'active':''}" data-type="${type}" data-page="${i}">${i}</button>`;
        } else if (Math.abs(i - page) === 2) {
          btns += `<span style="color:var(--text-subtle);padding:0 2px">…</span>`;
        }
      }
      btns += `<button class="page-btn" data-type="${type}" data-page="${page+1}" ${page>=pages?'disabled':''}>Next ›</button>`;
      return `<div class="pagination"><span>Showing ${start}–${end} of ${total}</span><div class="pagination-btns">${btns}</div></div>`;
    },

    bindTableEvents() {
      DOM.contactsTableWrap.querySelectorAll('.status-select').forEach(sel =>
        sel.addEventListener('change', () => StatusModule.update('contacts', sel.dataset.id, sel.value)));

      DOM.contactsTableWrap.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); DeleteModule.confirm(btn.dataset.type, btn.dataset.id); }));

      DOM.contactsTableWrap.querySelectorAll('.clickable-row').forEach(row =>
        row.addEventListener('click', () => Modal.openMsg(row.dataset)));

      DOM.contactsTableWrap.querySelectorAll('.row-checkbox:not(#selectAllContacts)').forEach(cb =>
        cb.addEventListener('change', () => {
          if (cb.checked) State.selectedContacts.add(cb.dataset.id);
          else            State.selectedContacts.delete(cb.dataset.id);
          this.renderBulkToolbar();
        }));

      const selectAll = $('selectAllContacts');
      if (selectAll) {
        selectAll.addEventListener('change', () => {
          DOM.contactsTableWrap.querySelectorAll('.row-checkbox:not(#selectAllContacts)').forEach(cb => {
            cb.checked = selectAll.checked;
            if (selectAll.checked) State.selectedContacts.add(cb.dataset.id);
            else                   State.selectedContacts.delete(cb.dataset.id);
          });
          this.renderBulkToolbar();
        });
      }

      // Sort headers
      DOM.contactsTableWrap.querySelectorAll('th.sortable[data-col]').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.dataset.col;
          if (State.contactSort.col === col) State.contactSort.dir = State.contactSort.dir === 'asc' ? 'desc' : 'asc';
          else { State.contactSort.col = col; State.contactSort.dir = 'desc'; }
          this.render();
        });
      });

      // Pagination
      DOM.contactsTableWrap.querySelectorAll('.page-btn[data-type="contacts"]').forEach(btn => {
        btn.addEventListener('click', () => {
          State.contactPage = parseInt(btn.dataset.page);
          this.render();
        });
      });

      // Mobile swipe-to-delete
      this.bindSwipe();
    },

    bindSwipe() {
      DOM.contactsTableWrap.querySelectorAll('tr.clickable-row').forEach(row => {
        let startX = 0, dx = 0;
        row.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive:true });
        row.addEventListener('touchmove',  e => {
          dx = e.touches[0].clientX - startX;
          if (dx < -40) row.classList.add('swiping-left');
          else           row.classList.remove('swiping-left');
        }, { passive:true });
        row.addEventListener('touchend', () => {
          if (dx < -80) DeleteModule.confirm('contacts', row.dataset.id);
          row.classList.remove('swiping-left');
          dx = 0;
        });
      });
    },

    renderBulkToolbar() {
      const toolbar = $('contactsBulkToolbar');
      const count   = State.selectedContacts.size;
      if (!toolbar) return;
      if (count > 0) {
        toolbar.classList.add('visible');
        $('bulkSelectedCount').textContent = `${count} selected`;
      } else {
        toolbar.classList.remove('visible');
      }
    },

    async load(showLoader = true) {
      if (showLoader) DOM.contactsTableWrap.innerHTML = Utils.skeletonHTML(6);
      UI.setRefreshSpinning(true);
      try {
        const data = await API.fetch('/contacts');
        if (!data.success) {
          DOM.contactsTableWrap.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>No contact form submissions yet.</p></div>`;
          return;
        }
        State.contacts = data.data;
        this.render();
        Charts.renderContactChart();
        StatsModule.load();
      } catch(e) {
        if (e.message !== 'Unauthorized' && e.message !== 'No valid token')
          DOM.contactsTableWrap.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load messages. <a href="#" onclick="Contacts.load()" style="color:var(--brand)">Try again</a></p></div>`;
      } finally {
        UI.setRefreshSpinning(false);
      }
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     LEADS MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const LeadsModule = {
    filter() {
      const search = (DOM.leadSearch.value || '').toLowerCase().trim();
      const status = DOM.leadStatusFilter.value;
      return State.leads.filter(l =>
        (!search || l.email.toLowerCase().includes(search)) &&
        (!status || l.status === status)
      );
    },

    sort(data) {
      const { col, dir } = State.leadSort;
      return [...data].sort((a, b) => {
        let av = a[col] ?? ''; let bv = b[col] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        return dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    },

    render() {
      const filtered = this.sort(this.filter());
      const total    = filtered.length;
      const pages    = Math.ceil(total / CONFIG.PAGE_SIZE) || 1;
      State.leadPage = Math.min(State.leadPage, pages);

      const start    = (State.leadPage - 1) * CONFIG.PAGE_SIZE;
      const paged    = filtered.slice(start, start + CONFIG.PAGE_SIZE);

      this.renderBulkToolbar();

      if (!paged.length) {
        DOM.leadsTableWrap.innerHTML = State.leads.length
          ? `<div class="no-results"><i class="fas fa-search"></i>No matching leads found.</div>`
          : `<div class="empty-state"><i class="fas fa-bolt"></i><p>No chatbot leads captured yet.</p></div>`;
        return;
      }

      const allChecked = paged.every(l => State.selectedLeads.has(l._id));

      const rows = paged.map(l => {
        const recent = Utils.isRecent24h(l.createdAt);
        const rowCls = [
          l.status === 'new' ? 'row-new' : '',
          recent ? 'row-recent' : '',
          State.selectedLeads.has(l._id) ? 'row-selected' : '',
        ].filter(Boolean).join(' ');

        return `<tr class="${rowCls}">
          <td class="td-checkbox" data-label="">
            <input type="checkbox" class="row-checkbox" data-id="${l._id}" ${State.selectedLeads.has(l._id)?'checked':''}>
          </td>
          <td data-label="Email" class="td-email">
            <div class="flex-center gap-sm">
              <a href="mailto:${Utils.escHtml(l.email)}">${Utils.escHtml(l.email)}</a>
              <button class="copy-btn" onclick="App.copyText('${Utils.escHtml(l.email)}')" title="Copy email"><i class="fas fa-copy"></i></button>
            </div>
            ${recent ? UI.build24hBadge() : ''}
          </td>
          <td data-label="Status">${UI.buildBadge(l.status)}</td>
          <td data-label="Update">${UI.buildStatusSelect('leads', l._id, l.status)}</td>
          <td data-label="Date Captured" class="td-date">${Utils.formatDate(l.createdAt)}</td>
          <td data-label="">
            <button class="delete-btn" data-id="${l._id}" data-type="leads" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>`;
      }).join('');

      DOM.leadsTableWrap.innerHTML = `
        <table>
          <thead><tr>
            <th class="th-checkbox"><input type="checkbox" class="row-checkbox" id="selectAllLeads" ${allChecked?'checked':''}></th>
            <th>Email</th>
            <th>Status</th>
            <th>Update Status</th>
            <th class="sortable ${State.leadSort.col==='createdAt'?'sort-'+State.leadSort.dir:''}" data-col="createdAt">Date Captured</th>
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${Contacts.paginationHTML(total, State.leadPage, 'leads')}`;

      this.bindTableEvents();
    },

    bindTableEvents() {
      DOM.leadsTableWrap.querySelectorAll('.status-select').forEach(sel =>
        sel.addEventListener('change', () => StatusModule.update('leads', sel.dataset.id, sel.value)));

      DOM.leadsTableWrap.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => DeleteModule.confirm(btn.dataset.type, btn.dataset.id)));

      DOM.leadsTableWrap.querySelectorAll('.row-checkbox:not(#selectAllLeads)').forEach(cb =>
        cb.addEventListener('change', () => {
          if (cb.checked) State.selectedLeads.add(cb.dataset.id);
          else            State.selectedLeads.delete(cb.dataset.id);
          this.renderBulkToolbar();
        }));

      const selectAll = $('selectAllLeads');
      if (selectAll) {
        selectAll.addEventListener('change', () => {
          DOM.leadsTableWrap.querySelectorAll('.row-checkbox:not(#selectAllLeads)').forEach(cb => {
            cb.checked = selectAll.checked;
            if (selectAll.checked) State.selectedLeads.add(cb.dataset.id);
            else                   State.selectedLeads.delete(cb.dataset.id);
          });
          this.renderBulkToolbar();
        });
      }

      // Sort headers
      DOM.leadsTableWrap.querySelectorAll('th.sortable[data-col]').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.dataset.col;
          if (State.leadSort.col === col) State.leadSort.dir = State.leadSort.dir === 'asc' ? 'desc' : 'asc';
          else { State.leadSort.col = col; State.leadSort.dir = 'desc'; }
          this.render();
        });
      });

      // Pagination
      DOM.leadsTableWrap.querySelectorAll('.page-btn[data-type="leads"]').forEach(btn => {
        btn.addEventListener('click', () => {
          State.leadPage = parseInt(btn.dataset.page);
          this.render();
        });
      });
    },

    renderBulkToolbar() {
      const toolbar = $('leadsBulkToolbar');
      const count   = State.selectedLeads.size;
      if (!toolbar) return;
      if (count > 0) { toolbar.classList.add('visible'); $('leadsBulkCount').textContent = `${count} selected`; }
      else            toolbar.classList.remove('visible');
    },

    async load(showLoader = true) {
      if (showLoader) DOM.leadsTableWrap.innerHTML = Utils.skeletonHTML(6);
      UI.setRefreshSpinning(true);
      try {
        const data = await API.fetch('/leads');
        if (!data.success) {
          DOM.leadsTableWrap.innerHTML = `<div class="empty-state"><i class="fas fa-bolt"></i><p>No chatbot leads captured yet.</p></div>`;
          return;
        }
        State.leads = data.data;
        this.render();
        Charts.renderLeadsChart();
        StatsModule.load();
      } catch(e) {
        if (e.message !== 'Unauthorized' && e.message !== 'No valid token')
          DOM.leadsTableWrap.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load leads.</p></div>`;
      } finally {
        UI.setRefreshSpinning(false);
      }
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     STATUS MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const StatusModule = {
    async update(type, id, status) {
      const endpoint = `/${type}/${id}`;
      try {
        const result = await API.fetch(endpoint, { method:'PATCH', body:JSON.stringify({ status }) });
        if (!result.success) { UI.showToast('Failed to update status', 'error'); return; }

        UI.showToast(`Status → "${status}" ✓`);
        if (type === 'contacts') {
          const c = State.contacts.find(x => x._id === id);
          if (c) c.status = status;
          Contacts.render();
        } else {
          const l = State.leads.find(x => x._id === id);
          if (l) l.status = status;
          LeadsModule.render();
          Charts.renderLeadsChart();
        }
        StatsModule.load();
      } catch(e) {
        if (e.message !== 'Unauthorized') UI.showToast('Failed to update status', 'error');
      }
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     DELETE MODULE (with undo)
  ═══════════════════════════════════════════════════════════════════ */
  const DeleteModule = {
    async confirm(type, id) {
      const confirmed = await UI.showConfirm(
        'Delete this entry?',
        'This action cannot be undone. The entry will be permanently removed.'
      );
      if (!confirmed) return;
      await this.execute(type, id);
    },

    async execute(type, id) {
      // Optimistic remove with undo
      let removedItem, removedIdx;
      if (type === 'contacts') {
        removedIdx  = State.contacts.findIndex(c => c._id === id);
        removedItem = State.contacts[removedIdx];
        State.contacts.splice(removedIdx, 1);
        Contacts.render();
      } else {
        removedIdx  = State.leads.findIndex(l => l._id === id);
        removedItem = State.leads[removedIdx];
        State.leads.splice(removedIdx, 1);
        LeadsModule.render();
      }

      UI.showToast('Entry deleted', 'success', async () => {
        // Undo — restore item
        if (type === 'contacts') {
          State.contacts.splice(removedIdx, 0, removedItem);
          Contacts.render();
        } else {
          State.leads.splice(removedIdx, 0, removedItem);
          LeadsModule.render();
        }
        StatsModule.load();
        UI.showToast('Deletion undone', 'info');
      });

      // Actual delete after short delay (allows undo)
      await new Promise(r => setTimeout(r, CONFIG.TOAST_DURATION));
      // Re-check: if item was restored (undo clicked), skip delete
      const stillGone = type === 'contacts'
        ? !State.contacts.find(c => c._id === id)
        : !State.leads.find(l => l._id === id);

      if (stillGone) {
        try {
          await API.fetch(`/${type}/${id}`, { method:'DELETE' });
          StatsModule.load();
        } catch(e) {
          if (e.message !== 'Unauthorized') UI.showToast('Failed to delete entry', 'error');
        }
      }
    },

    async bulkDelete(type, ids) {
      const confirmed = await UI.showConfirm(
        `Delete ${ids.size} entries?`,
        'All selected entries will be permanently removed.'
      );
      if (!confirmed) return;
      for (const id of ids) await this.execute(type, id);
      if (type === 'contacts') State.selectedContacts.clear();
      else                     State.selectedLeads.clear();
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     MODAL MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Modal = {
    openMsg(dataset) {
      State.currentContact = dataset;
      $('modalName').textContent    = dataset.name;
      $('modalMeta').textContent    = dataset.email + '  ·  ' + dataset.date;
      $('modalSubject').textContent = dataset.subject;
      $('modalMessage').textContent = dataset.message;
      $('modalNoteInput').value     = Utils.getNote(dataset.id);
      $('modalReplyBtn').href =
        `mailto:${dataset.email}?subject=Re: ${encodeURIComponent(dataset.subject)}`;
      DOM.msgModal.classList.add('open');
    },
    close() { DOM.msgModal.classList.remove('open'); },
  };

  /* ═══════════════════════════════════════════════════════════════════
     EXPORT MODULE
  ═══════════════════════════════════════════════════════════════════ */
  const Export = {
    contacts(data = State.contacts) {
      Utils.exportCSV(
        data,
        `contacts-${new Date().toISOString().slice(0,10)}.csv`,
        ['Name','Email','Service','Message','Status','Date','Note'],
        c => [
          `"${c.name}"`, `"${c.email}"`, `"${c.subject}"`,
          `"${(c.message||'').replace(/"/g,'""')}"`, c.status,
          Utils.formatDate(c.createdAt),
          `"${Utils.getNote(c._id).replace(/"/g,'""')}"`
        ]
      );
      UI.showToast('CSV downloaded!', 'info');
    },
    leads(data = State.leads) {
      Utils.exportCSV(
        data,
        `leads-${new Date().toISOString().slice(0,10)}.csv`,
        ['Email','Status','Date Captured'],
        l => [`"${l.email}"`, l.status, Utils.formatDate(l.createdAt)]
      );
      UI.showToast('CSV downloaded!', 'info');
    },
  };

  /* ═══════════════════════════════════════════════════════════════════
     AUTO REFRESH
  ═══════════════════════════════════════════════════════════════════ */
  function startAutoRefresh() {
    clearInterval(State.autoRefreshTimer);
    State.autoRefreshTimer = setInterval(() => {
      if (!Auth.isValid()) return;
      StatsModule.load();
      if (State.activeTab === 'contacts') Contacts.load(false);
      else                                LeadsModule.load(false);
    }, CONFIG.AUTO_REFRESH_MS);
  }

  /* ═══════════════════════════════════════════════════════════════════
     SPLASH SCREEN
  ═══════════════════════════════════════════════════════════════════ */
  function runSplash(callback) {
    const text    = 'Dilshadesigns';
    const goldEnd = 7;
    text.split('').forEach((ch, i) => {
      const span   = document.createElement('span');
      span.className = 'splash-char ' + (i < goldEnd ? 'gold' : 'green');
      span.textContent = ch;
      span.style.animationDelay = (0.05 + i * 0.06) + 's';
      DOM.splashBrand.appendChild(span);
    });
    setTimeout(() => {
      DOM.splash.classList.add('fade-out');
      setTimeout(() => { DOM.splash.style.display = 'none'; callback(); }, 600);
    }, 1900);
  }

  function showLoginScreen() {
    DOM.loginScreen.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      DOM.loginScreen.classList.add('fade-in');
      DOM.passwordInput.focus();
    }));
  }

  /* ═══════════════════════════════════════════════════════════════════
     LOGIN
  ═══════════════════════════════════════════════════════════════════ */
  async function handleLogin() {
    const password = DOM.passwordInput.value.trim();
    if (!password) return;

    DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    DOM.loginBtn.disabled  = true;
    DOM.loginError.style.display = 'none';

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/admin/login`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Auth.saveToken(data.token, data.expiresIn || 3600);
        DOM.loginScreen.style.display = 'none';
        DOM.dashboard.style.display   = 'block';
        DOM.passwordInput.value        = '';
        Session.start();
        startClock();
        StatsModule.load();
        Contacts.load();
        startAutoRefresh();
      } else {
        DOM.loginErrorText.textContent   = data.message || 'Invalid credentials.';
        DOM.loginError.style.display     = 'flex';
        DOM.loginError.style.alignItems  = 'center';
        DOM.loginError.style.gap         = '0.4rem';
        DOM.loginError.style.justifyContent = 'center';
        // Re-trigger shake
        DOM.loginError.style.animation  = 'none';
        DOM.loginError.offsetHeight;
        DOM.loginError.style.animation  = '';
        DOM.passwordInput.value = '';
        DOM.passwordInput.focus();
      }
    } catch(err) {
      DOM.loginErrorText.textContent = 'Cannot connect to server. Please try again.';
      DOM.loginError.style.display   = 'flex';
    }

    DOM.loginBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
    DOM.loginBtn.disabled  = false;
  }

  /* ═══════════════════════════════════════════════════════════════════
     APP MODULE (public interface, logout, init)
  ═══════════════════════════════════════════════════════════════════ */
  const App = {
    logout() {
      Auth.clearToken();
      clearInterval(State.autoRefreshTimer);
      clearInterval(State.sessionTimer);
      State.contacts = [];
      State.leads    = [];
      State.selectedContacts.clear();
      State.selectedLeads.clear();
      DOM.dashboard.style.display   = 'none';
      DOM.loginScreen.style.display = 'flex';
      DOM.loginScreen.style.opacity = '1';
      DOM.passwordInput.value        = '';
    },

    async confirmLogout() {
      const confirmed = await UI.showConfirm(
        'Log out?',
        'You will be returned to the login screen.',
        'warn'
      );
      if (confirmed) this.logout();
    },

    copyText(text) {
      Utils.copyToClipboard(text)
        .then(() => UI.showToast('Copied to clipboard!', 'info'))
        .catch(() => UI.showToast('Copy failed', 'error'));
    },

    init() {
      Theme.init();
      this.bindEvents();

      if (Auth.isValid()) {
        DOM.splash.style.display      = 'none';
        DOM.loginScreen.style.display = 'none';
        DOM.dashboard.style.display   = 'block';
        Session.start();
        startClock();
        StatsModule.load();
        Contacts.load();
        startAutoRefresh();
      } else {
        runSplash(showLoginScreen);
      }
    },

    bindEvents() {
      // Login
      DOM.loginBtn.addEventListener('click', function(e) {
        const rect   = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size   = Math.max(rect.width, rect.height);
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 550);
        handleLogin();
      });
      DOM.passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

      // Logout with confirm
      DOM.logoutBtn.addEventListener('click', () => App.confirmLogout());
      DOM.mobileLogoutBtn?.addEventListener('click', () => { DOM.mobileDropdown.classList.remove('open'); App.confirmLogout(); });

      // Dark mode
      DOM.darkToggle.addEventListener('click', Theme.toggle.bind(Theme));
      DOM.mobileDarkToggle?.addEventListener('click', () => { Theme.toggle(); DOM.mobileDropdown.classList.remove('open'); });

      // Mobile menu
      DOM.mobileMenuBtn?.addEventListener('click', e => { e.stopPropagation(); DOM.mobileDropdown.classList.toggle('open'); });
      document.addEventListener('click', e => {
        if (!DOM.mobileDropdown?.contains(e.target) && e.target !== DOM.mobileMenuBtn)
          DOM.mobileDropdown?.classList.remove('open');
      });

      // Modal close
      $('modalCloseBtn').addEventListener('click', Modal.close);
      DOM.msgModal.addEventListener('click', e => { if (e.target === DOM.msgModal) Modal.close(); });

      // Save note
      $('modalSaveNoteBtn').addEventListener('click', () => {
        if (!State.currentContact) return;
        Utils.saveNote(State.currentContact.id, $('modalNoteInput').value.trim());
        Contacts.render();
        UI.showToast('Note saved ✓');
      });

      // Confirm modal cancel
      $('confirmCancelBtn').addEventListener('click', () => DOM.confirmModal.classList.remove('open'));

      // Tabs
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          State.activeTab = btn.dataset.tab;
          DOM.contactsTab.style.display = State.activeTab === 'contacts' ? 'block' : 'none';
          DOM.leadsTab.style.display    = State.activeTab === 'leads'    ? 'block' : 'none';
          if (State.activeTab === 'leads' && !State.leads.length) LeadsModule.load();
          else if (State.activeTab === 'leads') LeadsModule.render();
        });
      });

      // Refresh buttons
      $('refreshContacts').addEventListener('click', () => Contacts.load());
      $('refreshLeads').addEventListener('click',   () => LeadsModule.load());

      // Search (debounced)
      const debouncedContactRender = Utils.debounce(() => Contacts.render(),    CONFIG.DEBOUNCE_DELAY);
      const debouncedLeadRender    = Utils.debounce(() => LeadsModule.render(), CONFIG.DEBOUNCE_DELAY);
      DOM.contactSearch.addEventListener('input', debouncedContactRender);
      DOM.contactStatusFilter.addEventListener('change', () => Contacts.render());
      DOM.leadSearch.addEventListener('input', debouncedLeadRender);
      DOM.leadStatusFilter.addEventListener('change', () => LeadsModule.render());

      // Export
      $('exportContactsBtn').addEventListener('click', () => Export.contacts(Contacts.filter()));
      $('exportLeadsBtn').addEventListener('click',    () => Export.leads(LeadsModule.filter()));

      // Bulk delete
      $('bulkDeleteContacts')?.addEventListener('click', () =>
        DeleteModule.bulkDelete('contacts', new Set(State.selectedContacts)));
      $('bulkExportContacts')?.addEventListener('click', () => {
        const selected = State.contacts.filter(c => State.selectedContacts.has(c._id));
        Export.contacts(selected);
      });
      $('bulkDeleteLeads')?.addEventListener('click', () =>
        DeleteModule.bulkDelete('leads', new Set(State.selectedLeads)));
      $('bulkExportLeads')?.addEventListener('click', () => {
        const selected = State.leads.filter(l => State.selectedLeads.has(l._id));
        Export.leads(selected);
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          DOM.msgModal.classList.remove('open');
          DOM.confirmModal.classList.remove('open');
          DOM.mobileDropdown?.classList.remove('open');
        }
        if (DOM.dashboard.style.display === 'none') return;
        if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
        if (e.key === 'r' || e.key === 'R') {
          if (State.activeTab === 'contacts') Contacts.load();
          else LeadsModule.load();
          UI.showToast('Refreshing…', 'info');
        }
      });

      // Resize — redraw charts
      window.addEventListener('resize', Utils.debounce(() => {
        Charts.renderContactChart();
        Charts.renderLeadsChart();
      }, 200));
    },
  };

  // Expose only what's needed globally
  window.App = App;

  // Kick off
  App.init();

})();