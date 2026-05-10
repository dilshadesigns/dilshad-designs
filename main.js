/**
 * main.js — Dilshad Designs
 * Refactored for readability, maintainability, and documentation.
 * All logic, behavior, execution order, and functionality are 100% preserved.
 *
 * Sections:
 *  1.  Configuration
 *  2.  Dark Mode
 *  3.  Reading Progress Bar
 *  4.  Navbar Scroll Effect
 *  5.  Active Nav Link (IntersectionObserver)
 *  6.  Smooth Scroll
 *  7.  Mobile Menu
 *  8.  Reveal on Scroll
 *  9.  Gallery Filter
 *  10. Gallery Slider + Fullscreen Lightbox
 *  11. Back to Top
 *  12. Contact Form (backend API)
 *  13. Enhanced Chatbot
 *  14. Legal Modals          [global scope — required for HTML onclick="" attributes]
 *  15. Easter Egg            [global scope — requires document-level keydown listener]
 *  16. Services Carousel
 */

/* =========================================================
   MAIN IIFE — wraps all private logic to avoid global pollution
   CRITICAL: Execution order inside this IIFE must be preserved.
   ========================================================= */
(function () {
  'use strict';

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  /**
   * API_BASE — automatically switches between local dev and production.
   * DEPENDENCY-SENSITIVE: used by Contact Form (section 12) and Chatbot
   * lead-capture (section 13). Must be declared before those sections.
   */
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://dilshad-designs.onrender.com';


  /* =========================================================
     DARK MODE  (section 2)
     ========================================================= */

  const html       = document.documentElement;
  const darkBtn    = document.getElementById('darkToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';

  // Apply persisted theme immediately on load (before paint)
  html.setAttribute('data-theme', savedTheme);
  updateDarkIcon(savedTheme);

  // Toggle theme on button click and persist to localStorage
  darkBtn.addEventListener('click', () => {
    const cur  = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateDarkIcon(next);
  });

  /** Swaps the dark-mode button icon between sun (dark) and moon (light). */
  function updateDarkIcon(theme) {
    darkBtn.innerHTML = theme === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }


  /* =========================================================
     READING PROGRESS BAR  (section 3)
     PERFORMANCE-SENSITIVE: passive listener — do not remove { passive: true }
     ========================================================= */

  const progress = document.getElementById('page-progress');

  window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    progress.style.width = (scrolled / maxScroll * 100) + '%';
  }, { passive: true });


  /* =========================================================
     NAVBAR SCROLL EFFECT  (section 4)
     PERFORMANCE-SENSITIVE: passive listener
     ========================================================= */

  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });


  /* =========================================================
     ACTIVE NAV LINK — IntersectionObserver  (section 5)
     TIMING-SENSITIVE: rootMargin values are tuned for the site's
     layout. Do not adjust without re-testing on all screen sizes.
     ========================================================= */

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observerNav = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observerNav.observe(s));


  /* =========================================================
     SMOOTH SCROLL  (section 6)
     EVENT-ORDER-SENSITIVE: calls closeMenu() — mobile menu must
     be initialized before this block runs (section 7 defines it).
     closeMenu is hoisted via function declaration — safe.
     ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        // 68px offset accounts for the fixed navbar height
        const offset = target.offsetTop - 68;
        window.scrollTo({ top: offset, behavior: 'smooth' });
        closeMenu();
      }
    });
  });


  /* =========================================================
     MOBILE MENU  (section 7)
     ========================================================= */

  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  /** Opens / closes the hamburger menu and locks body scroll when open. */
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  /**
   * Closes the mobile menu and restores scroll.
   * DEPENDENCY: called by smooth-scroll (section 6) and nav link clicks below.
   * Declared as a function statement so it is hoisted and available to section 6.
   */
  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Auto-close menu when any nav link inside it is tapped
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));


  /* =========================================================
     REVEAL ON SCROLL  (section 8)
     Elements with class "reveal" fade in when they enter the viewport.
     unobserve() after trigger — no wasted observation cycles.
     ========================================================= */

  const reveals = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target); // one-shot: stop watching once revealed
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(r => revealObserver.observe(r));


  /* =========================================================
     GALLERY FILTER  (section 9)
     Filters gallery cards by category and re-triggers fadeUp animation.
     ========================================================= */

  const filterBtns   = document.querySelectorAll('.filter-btn');
  const galleryCards = document.querySelectorAll('.gallery-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all filter buttons, then activate the clicked one
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galleryCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? 'block' : 'none';
        if (match) {
          card.style.animation = 'fadeUp 0.4s ease both';
        }
      });
    });
  });


  /* =========================================================
     GALLERY SLIDER + FULLSCREEN LIGHTBOX  (section 10)
     Scoped inside its own IIFE to keep lightbox state fully private.
     CRITICAL: Do not hoist lbImages / lbIndex / lbOpen outside —
     they are mutated by both the card sliders and the lightbox.
     ========================================================= */

  (function GallerySystem() {
    'use strict';

    /* ---------- Lightbox State ----------
       ASYNC-SENSITIVE: lbOpen gate prevents double-open / close race.  */
    let lbImages = [];  // Array of { src, alt } for the currently open card
    let lbIndex  = 0;   // Active slide index inside the lightbox
    let lbOpen   = false;

    /* ---------- Lightbox DOM References ---------- */
    const lightbox   = document.getElementById('lightbox');
    const lbTrack    = document.getElementById('lightbox-track');
    const lbTitle    = document.getElementById('lightbox-title');
    const lbCaption  = document.getElementById('lightbox-caption');
    const lbCounter  = document.getElementById('lightbox-counter');
    const lbDotsWrap = document.getElementById('lightbox-dots');
    const lbClose    = document.getElementById('lightbox-close');
    const lbPrev     = document.getElementById('lb-prev');
    const lbNext     = document.getElementById('lb-next');


    /* -------------------------------------------------------
       CARD SLIDERS — inline mini-carousel on each gallery card
       ------------------------------------------------------- */

    document.querySelectorAll('.gallery-slider').forEach(function (slider) {
      const slides  = slider.querySelectorAll('.gallery-slide');
      const dots    = slider.querySelectorAll('.slider-dot');
      const prevBtn = slider.querySelector('.slider-arrow.prev');
      const nextBtn = slider.querySelector('.slider-arrow.next');
      const total   = slides.length;
      let current   = 0;
      let animating = false;

      // Single-image cards need no carousel logic
      if (total <= 1) return;

      // Ensure only slide 0 is active on initial paint
      slides.forEach(function (s, i) { s.classList.toggle('active', i === 0); });
      dots.forEach(function (d, i)   { d.classList.toggle('active', i === 0); });

      /**
       * Navigate to a specific slide index.
       * TIMING-SENSITIVE: animating lock (520ms) prevents rapid double-fires
       * from stacking CSS transitions. Do not reduce below transition duration.
       */
      function goTo(index) {
        if (animating) return;
        if (index < 0)      index = total - 1;
        if (index >= total) index = 0;
        if (index === current) return;

        animating = true;
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dots[current].classList.add('active');

        // Preload the next image to reduce perceived latency
        const nextIdx = (current + 1) % total;
        const nextImg = slides[nextIdx].querySelector('img');
        if (nextImg && nextImg.dataset.src) {
          nextImg.src = nextImg.dataset.src;
          delete nextImg.dataset.src;
        }

        setTimeout(function () { animating = false; }, 520);
      }

      // Arrow button listeners — stopPropagation prevents card-click lightbox open
      if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(current - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(current + 1);
        });
      }

      // Dot navigation
      dots.forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(parseInt(dot.dataset.index, 10));
        });
      });

      // Touch / swipe support on card slider
      let touchStartX = 0, touchStartY = 0;

      slider.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      slider.addEventListener('touchend', function (e) {
        const dx = touchStartX - e.changedTouches[0].screenX;
        const dy = Math.abs(touchStartY - e.changedTouches[0].screenY);
        // Require horizontal swipe > 38px and vertical drift < 60px
        if (Math.abs(dx) > 38 && dy < 60) {
          goTo(dx > 0 ? current + 1 : current - 1);
        }
      }, { passive: true });

      // Expose current index for lightbox (used by openLightbox below)
      slider._getIndex = function () { return current; };
    });


    /* -------------------------------------------------------
       LIGHTBOX — build slides, open, close, navigate
       ------------------------------------------------------- */

    /**
     * Builds the lightbox slide track and dot navigation from an image array.
     * @param {Array<{src: string, alt: string}>} images
     */
    function buildLbSlides(images) {
      lbTrack.innerHTML    = '';
      lbDotsWrap.innerHTML = '';

      const frag    = document.createDocumentFragment();
      const dotFrag = document.createDocumentFragment();

      images.forEach(function (img, i) {
        // Build slide element
        const slide     = document.createElement('div');
        slide.className = 'lb-slide' + (i === 0 ? ' lb-active' : '');

        const image     = document.createElement('img');
        image.src       = img.src;
        image.alt       = img.alt || '';
        image.draggable = false;

        // Preload all lightbox images in background for smooth navigation
        const preload = new Image();
        preload.src   = img.src;

        slide.appendChild(image);
        frag.appendChild(slide);

        // Build dot element
        const dot = document.createElement('span');
        dot.className = 'lb-dot' + (i === 0 ? ' lb-dot-active' : '');
        dot.setAttribute('data-index', i);
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
        dot.addEventListener('click', function () {
          lbGoTo(parseInt(dot.dataset.index, 10));
        });
        dotFrag.appendChild(dot);
      });

      lbTrack.appendChild(frag);
      lbDotsWrap.appendChild(dotFrag);
    }

    /**
     * Opens the lightbox for a given gallery card, starting at startIndex.
     * Collects all .gallery-slide images from the card into lbImages.
     * ASYNC-SENSITIVE: sets lbOpen = true before adding .open class so
     * the keydown handler is immediately active.
     */
    function openLightbox(card, startIndex) {
      const slides    = card.querySelectorAll('.gallery-slide');
      const cardTitle = card.querySelector('h3');

      lbImages = [];
      slides.forEach(function (slide) {
        const img = slide.querySelector('img');
        if (img) { lbImages.push({ src: img.src, alt: img.alt || '' }); }
      });

      if (lbImages.length === 0) return;

      lbIndex = Math.max(0, Math.min(startIndex, lbImages.length - 1));
      buildLbSlides(lbImages);

      lbTitle.textContent   = cardTitle ? cardTitle.textContent : '';
      lbCaption.textContent = lbImages[lbIndex].alt || lbTitle.textContent;
      updateLbUI(lbIndex);

      // Add lb-single class when there is only one image (hides navigation)
      lightbox.classList.toggle('lb-single', lbImages.length === 1);

      lbOpen = true;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Move focus to close button for keyboard accessibility
      requestAnimationFrame(function () { lbClose.focus(); });
    }

    /**
     * Navigates the lightbox to a specific image index with slide animation.
     * ANIMATION-SENSITIVE: void inSlide.offsetWidth forces reflow to ensure
     * the enter class is applied before the transition starts. Do not remove.
     *
     * @param {number} index     - Target image index
     * @param {string} direction - 'left' or 'right' (optional; inferred if omitted)
     */
    function lbGoTo(index, direction) {
      if (lbImages.length <= 1) return;
      if (index < 0)                  index = lbImages.length - 1;
      if (index >= lbImages.length)   index = 0;
      if (index === lbIndex)          return;

      const slides   = lbTrack.querySelectorAll('.lb-slide');
      const dots     = lbDotsWrap.querySelectorAll('.lb-dot');
      const dir      = (direction !== undefined) ? direction : (index > lbIndex ? 'right' : 'left');
      const outSlide = slides[lbIndex];
      const inSlide  = slides[index];

      // Stage incoming slide off-screen, then transition in
      inSlide.classList.add(dir === 'right' ? 'lb-enter-right' : 'lb-enter-left');
      void inSlide.offsetWidth; // CRITICAL: force reflow — required for CSS transition
      outSlide.classList.remove('lb-active');
      inSlide.classList.remove('lb-enter-right', 'lb-enter-left');
      inSlide.classList.add('lb-active');

      dots[lbIndex].classList.remove('lb-dot-active');
      dots[index].classList.add('lb-dot-active');

      lbIndex = index;
      updateLbUI(lbIndex);
    }

    /**
     * Updates lightbox caption and counter text for the given index.
     * Counter is hidden when there is only one image.
     */
    function updateLbUI(index) {
      lbCaption.textContent = lbImages[index].alt || lbTitle.textContent;
      lbCounter.textContent = lbImages.length > 1
        ? (index + 1) + ' / ' + lbImages.length
        : '';
    }

    /** Closes the lightbox and restores body scroll. */
    function closeLightbox() {
      if (!lbOpen) return;
      lbOpen = false;
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    /* -- Lightbox event listeners -- */

    lbClose.addEventListener('click', closeLightbox);

    // Close when clicking the backdrop (lightbox root or inner wrapper)
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.id === 'lightbox-inner') {
        closeLightbox();
      }
    });

    lbPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      lbGoTo(lbIndex - 1, 'left');
    });

    lbNext.addEventListener('click', function (e) {
      e.stopPropagation();
      lbGoTo(lbIndex + 1, 'right');
    });

    // Keyboard navigation — only active while lightbox is open
    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      if      (e.key === 'Escape')      { closeLightbox(); }
      else if (e.key === 'ArrowRight')  { lbGoTo(lbIndex + 1, 'right'); }
      else if (e.key === 'ArrowLeft')   { lbGoTo(lbIndex - 1, 'left'); }
    });

    // Touch / swipe support inside the lightbox track
    let lbTouchStartX = 0, lbTouchStartY = 0;

    lbTrack.addEventListener('touchstart', function (e) {
      lbTouchStartX = e.changedTouches[0].screenX;
      lbTouchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    lbTrack.addEventListener('touchend', function (e) {
      const dx = lbTouchStartX - e.changedTouches[0].screenX;
      const dy = Math.abs(lbTouchStartY - e.changedTouches[0].screenY);
      // Require horizontal swipe > 45px and vertical drift < 80px
      if (Math.abs(dx) > 45 && dy < 80) {
        lbGoTo(dx > 0 ? lbIndex + 1 : lbIndex - 1, dx > 0 ? 'right' : 'left');
      }
    }, { passive: true });

    /* -- Gallery card click / zoom-icon — open lightbox -- */

    document.querySelectorAll('.gallery-card').forEach(function (card) {
      // Zoom icon click: open at the slide the icon belongs to
      card.querySelectorAll('.gallery-zoom-icon').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
          e.stopPropagation();
          const parentSlide  = icon.closest('.gallery-slide');
          const slides       = Array.from(card.querySelectorAll('.gallery-slide'));
          const clickedIndex = slides.indexOf(parentSlide);
          openLightbox(card, clickedIndex >= 0 ? clickedIndex : 0);
        });
      });

      // Card body click: open at the currently active slide
      card.addEventListener('click', function (e) {
        // Ignore clicks on interactive child elements
        if (
          e.target.closest('.slider-arrow')      ||
          e.target.closest('.slider-dots')       ||
          e.target.closest('.gallery-zoom-icon') ||
          e.target.closest('.gallery-card-body')
        ) return;

        const activeSlide = card.querySelector('.gallery-slide.active');
        if (!activeSlide) return;

        const allSlides   = Array.from(card.querySelectorAll('.gallery-slide'));
        const activeIndex = allSlides.indexOf(activeSlide);
        openLightbox(card, activeIndex >= 0 ? activeIndex : 0);
      });
    });

  })(); // End GallerySystem


  /* =========================================================
     BACK TO TOP  (section 11)
     ========================================================= */

  const btt = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    btt.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });

  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


  /* =========================================================
     CONTACT FORM  (section 12)
     Only initializes when #contactForm exists on the page.
     ASYNC-SENSITIVE: submit handler is async; error path resets
     button state after 3 s. Do not alter setTimeout values.
     ========================================================= */

  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const submitBtn   = document.getElementById('submitBtn');
    const submitText  = document.getElementById('submitText');
    const formSuccess = document.getElementById('formSuccess');

    /**
     * Validates a single form field and applies/removes the has-error class.
     * Rules: email regex, textarea ≥ 20 chars, select non-empty, text > 1 char.
     * @param {HTMLElement} input
     * @returns {boolean}
     */
    function validateField(input) {
      const group = input.closest('.form-group');
      if (!group) return true;
      let valid = true;

      if (input.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      } else if (input.tagName === 'TEXTAREA') {
        valid = input.value.trim().length >= 20;
      } else if (input.tagName === 'SELECT') {
        valid = input.value !== '';
      } else {
        valid = input.value.trim().length > 1;
      }

      group.classList.toggle('has-error', !valid);
      return valid;
    }

    // Validate on blur; re-validate on input only if field already has an error
    contactForm.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.form-group').classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot field check — silently abort if a bot filled it
      if (contactForm.querySelector('[name="_honey"]').value) return;

      // Run full validation pass before submitting
      const fields = contactForm.querySelectorAll('input:not([name="_honey"]), textarea, select');
      let allValid  = true;
      fields.forEach(f => { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      // Show loading state on submit button
      submitBtn.disabled = true;
      submitText.textContent = 'Sending...';
      submitBtn.querySelector('i').className = 'fas fa-spinner fa-spin';

      try {
        const formData = {
          name:    document.getElementById('cf-name').value.trim(),
          email:   document.getElementById('cf-email').value.trim(),
          subject: document.getElementById('cf-subject').value,
          message: document.getElementById('cf-message').value.trim()
        };

        const response = await fetch(`${API_BASE}/api/contact`, {
          method  : 'POST',
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Server error: ' + response.status);
        }

        // Success: hide form, show confirmation, then reset after 3 s
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';

        setTimeout(() => {
          formSuccess.style.display = 'none';
          contactForm.reset();
          contactForm.style.display = 'block';
        }, 3000);

      } catch (err) {
        // Error: show failure message, then restore button state after 3 s
        console.error('Form submission error:', err);
        submitText.textContent = 'Failed — try again';
        submitBtn.querySelector('i').className = 'fas fa-exclamation-triangle';

        setTimeout(() => {
          submitText.textContent = 'Send Message';
          submitBtn.querySelector('i').className = 'fas fa-paper-plane';
          submitBtn.disabled = false;
        }, 3000);
        return; // prevent the post-try button reset below from running
      }

      // Reset button state after successful submission
      submitBtn.disabled = false;
      submitText.textContent = 'Send Message';
      submitBtn.querySelector('i').className = 'fas fa-paper-plane';
    });

  } // end if (contactForm)


  /* =========================================================
     ENHANCED CHATBOT  (section 13)
     Scoped in an IIFE to keep all chat state private.
     ASYNC-SENSITIVE: greeting sequence uses nested timeouts for
     a natural typing feel. Do not reorder or merge those timeouts.
     ========================================================= */

  (function () {

    /* ---------- DOM References ---------- */
    const chatToggle       = document.getElementById('chatToggle');
    const chatWindow       = document.getElementById('chatWindow');
    const chatClose        = document.getElementById('chatClose');
    const chatInput        = document.getElementById('chatInput');
    const chatSend         = document.getElementById('chatSend');
    const chatMessages     = document.getElementById('chatMessages');
    const quickReplies     = document.getElementById('quickReplies');
    const chatNotification = document.querySelector('.chat-notification');
    const leadCapture      = document.getElementById('leadCapture');
    const leadEmail        = document.getElementById('leadEmail');
    const leadSubmitBtn    = document.getElementById('leadSubmitBtn');

    /* ---------- Chat State ---------- */
    let chatOpened         = false;
    let messageCount       = 0;
    let leadCaptureShown   = false;
    let conversationContext = null; // tracks last matched intent category

    /* ---------- Bot Knowledge Base ----------
       Each category has: triggers (keywords) and responses (randomly picked).
       'default' is a fallback array, not a category object.               */
    const botKnowledge = {
      greetings: {
        triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'hlo'],
        responses: [
          "Hey there! 👋 So glad you stopped by! I'm Dilshad's assistant. Whether you need a stunning logo, a scroll-stopping social post, or a full brand makeover — you're in the right place. What can I help you with today?",
          "Hi! 😊 Welcome to Dilshad Designs! I'm here to help you find the perfect design solution. What kind of project are you thinking about?",
          "Hello! Great to see you here! ✨ Dilshad is a top-rated freelance graphic designer in New Delhi, India. Tell me — what does your project need?"
        ]
      },
      services: {
        triggers: ['service', 'offer', 'what do you do', 'work', 'design', 'can you make', 'what can'],
        responses: [
          "Here's what Dilshad creates for clients 🎨\n\n• **Brand Identity & Logo Design**\n• **Advertising & Poster Design**\n• **Packaging Design**\n• **Social Media Creatives**\n• **Motion Graphics**\n• **Merchandise Design**\n• **Custom Website Development**\n• **High-Converting Landing Pages**\n• **UI/UX Design Solutions**\n\nWhich of these sounds like what you need? 😊"
        ]
      },
      pricing: {
        triggers: ['price', 'cost', 'how much', 'rate', 'charge', 'fee', 'budget', 'affordable', 'cheap', 'expensive', 'quote'],
        responses: [
          "Great question! 💡 Pricing is customized based on your project scope. Here's a rough idea:\n\n• Logo Design: Starting at affordable rates\n• Social Media Posts: Per post or package deals\n• Brand Identity: Full package pricing\n• Website/Landing Pages: Based on complexity\n\nThe best way to get an exact quote is to message directly on 👉 **fiverr.com/dilshadesigns** or use the contact form above.\n\nWant me to help you figure out which service fits your needs? 🎯"
        ]
      },
      delivery: {
        triggers: ['delivery', 'how fast', 'time', 'deadline', 'quick', 'urgent', 'turnaround', 'when', 'how long'],
        responses: [
          "Speed is a priority here! ⚡\n\n• **Logo Design**: 1–3 days\n• **Social Media Posts**: 24 hours\n• **Brand Identity**: 3–5 days\n• **Posters & Banners**: 24–48 hours\n• **Landing Pages**: 3–7 days\n\nFor urgent projects, just mention your deadline and Dilshad will do everything possible to meet it! Need something fast? 🚀"
        ]
      },
      revisions: {
        triggers: ['revision', 'change', 'edit', 'modify', 'redo', 'update', 'unlimited'],
        responses: [
          "Absolutely yes! Revisions are included 🔄\n\nDilshad believes in 100% client satisfaction. Most packages include multiple revision rounds — and the work continues until you're genuinely happy with the result.\n\nNo extra charges for reasonable revision requests. Your satisfaction is the goal! 😊"
        ]
      },
      fiverr: {
        triggers: ['fiverr', 'order', 'hire', 'book', 'purchase', 'buy', 'freelance'],
        responses: [
          "You can hire Dilshad directly on Fiverr! 🌟\n\n👉 **fiverr.com/dilshadesigns**\n\nWhy Fiverr?\n✅ Secure payment protection\n✅ 5-star rated seller\n✅ Verified reviews\n✅ Easy communication\n✅ Satisfaction guarantee\n\nJust click the 'Hire on Fiverr' button at the top — or I can guide you to the right gig!"
        ]
      },
      contact: {
        triggers: ['contact', 'reach', 'email', 'phone', 'call', 'message', 'talk', 'meet'],
        responses: [
          "Here's how to reach Dilshad directly 📞\n\n📧 Email: dilshadesign.co@gmail.com\n📱 Phone: +91 11499 53616\n📍 Based in New Delhi, India\n🌐 Fiverr: fiverr.com/dilshadesigns\n📸 Instagram: @dilshadesigns\n\nOr just use the **Contact Form** on this page — Dilshad typically responds within 2–4 hours! ⚡"
        ]
      },
      portfolio: {
        triggers: ['portfolio', 'gallery', 'sample', 'example', 'work', 'previous', 'see your'],
        responses: [
          "Check out the Portfolio Gallery section right here on the page! 🖼️\n\nYou'll find examples of:\n• **Advertising Posters** — Consumer electronics, food & beverage, sports\n• **Branding & Logo Design** — Visual identity work\n• **Web Development Projects** — Invoice generator, landing pages\n\nScroll up and click on any image to see it fullscreen! Want me to tell you more about a specific type of work?"
        ]
      },
      availability: {
        triggers: ['available', 'availability', 'free', 'slot', 'open', 'busy', 'schedule', 'capacity'],
        responses: [
          "Great news! ✅ Dilshad is currently **accepting new clients**!\n\nWhile slots do fill up quickly (especially for rush projects), reaching out now is the best way to secure your spot.\n\n📬 Use the contact form or Fiverr to get started. Dilshad responds within **2–4 hours** on average. Don't miss your slot! 🎯"
        ]
      },
      location: {
        triggers: ['india', 'delhi', 'location', 'based', 'where', 'country', 'city', 'remote', 'online'],
        responses: [
          "Dilshad is based in **New Delhi, India** 🇮🇳 but works with clients **worldwide**!\n\nAll communication and file delivery happens online, so location is never a barrier. Whether you're in Mumbai, London, New York, or Dubai — Dilshad's got you covered! 🌍\n\nTime zone: IST (UTC+5:30). Fast response guaranteed!"
        ]
      },
      default: [
        "That's a great question! 😊 I'm not sure I fully understood, but I can help you with Dilshad's **design services**, **pricing**, **portfolio**, or **how to get started**.\n\nWhat would you like to know more about?",
        "Interesting! I'd love to help. Could you tell me more about what you're looking for? I can share info about **services**, **turnaround times**, **pricing**, or **how to hire** Dilshad.",
        "I want to make sure I give you the right answer! Are you asking about **design services**, **pricing**, **Fiverr**, or something else? Let me know and I'll help right away! 🎯"
      ]
    };

    /**
     * Matches a user message against the knowledge base and returns a response string.
     * Checks triggers in order; first match wins. Context-aware rules for
     * need/want/looking-for phrases run after the trigger pass.
     * Falls back to a random default response if nothing matches.
     * @param {string} msg - Raw user message
     * @returns {string} Bot response text (may contain **bold** markdown)
     */
    function getBotResponse(msg) {
      const lower = msg.toLowerCase().trim();

      // Trigger-keyword matching pass
      for (const [category, data] of Object.entries(botKnowledge)) {
        if (category === 'default') continue;
        if (!data.triggers) continue;
        for (const trigger of data.triggers) {
          if (lower.includes(trigger)) {
            conversationContext = category;
            const responses = data.responses;
            return responses[Math.floor(Math.random() * responses.length)];
          }
        }
      }

      // Context-aware service recommendation for intent phrases
      if (lower.includes('need') || lower.includes('want') || lower.includes('looking for')) {
        if (lower.includes('grow') || lower.includes('audience') || lower.includes('followers')) {
          return "Based on what you're describing, **Social Media Design** would be a perfect fit! Consistent, high-quality social content builds audiences fast.\n\nWant me to tell you more about Dilshad's social media packages? 📱";
        }
        if (lower.includes('product') || lower.includes('sell') || lower.includes('shop')) {
          return "It sounds like you might need **Packaging Design** or a **High-Converting Landing Page** to help sell your product better! 🛍️\n\nWhich sounds closer to what you need?";
        }
        if (lower.includes('startup') || lower.includes('business') || lower.includes('company') || lower.includes('brand')) {
          return "For a new business or brand, **Brand Identity Design** is the most important starting point — logo, colors, typography, and brand guidelines.\n\nDilshad has helped several startups build their visual identity from scratch! Want to see the portfolio? ✨";
        }
      }

      // Fallback: pick a random default response
      const defaults = botKnowledge.default;
      return defaults[Math.floor(Math.random() * defaults.length)];
    }

    /**
     * Converts **bold** markdown and newlines to safe HTML for chat bubbles.
     * @param {string} text
     * @returns {string} HTML string
     */
    function formatBubbleText(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }

    /**
     * Appends a message bubble to the chat window.
     * Shows the lead-capture prompt after the 4th bot message (once only).
     * TIMING-SENSITIVE: lead-capture delay is 1200ms — do not reduce.
     * @param {string} text   - Message content
     * @param {string} sender - 'user' or 'bot'
     */
    function addMessage(text, sender) {
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg ' + sender;

      if (sender === 'bot') {
        wrapper.innerHTML = `
          <div class="chat-msg-avatar"><i class="fas fa-robot"></i></div>
          <div class="chat-bubble">${formatBubbleText(text)}</div>
        `;
      } else {
        wrapper.innerHTML = `<div class="chat-bubble">${text}</div>`;
      }

      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      messageCount++;

      // Show lead capture after 4th bot message (one-shot)
      if (messageCount >= 4 && !leadCaptureShown && sender === 'bot') {
        setTimeout(() => {
          leadCapture.style.display = 'block';
          leadCaptureShown = true;
        }, 1200);
      }
    }

    /** Appends an animated typing indicator to simulate bot thinking. */
    function showTyping() {
      const typing = document.createElement('div');
      typing.className = 'chat-msg bot';
      typing.id        = 'typingIndicator';
      typing.innerHTML = `
        <div class="chat-msg-avatar"><i class="fas fa-robot"></i></div>
        <div class="chat-bubble typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      `;
      chatMessages.appendChild(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /** Removes the typing indicator if present. */
    function removeTyping() {
      const t = document.getElementById('typingIndicator');
      if (t) t.remove();
    }

    /**
     * Calculates a realistic typing delay based on response word count.
     * Adds jitter so responses don't feel mechanical.
     * Max capped at 2800ms to avoid user frustration.
     * @param {string} response
     * @returns {number} Delay in milliseconds
     */
    function getTypingDelay(response) {
      const words     = response.split(' ').length;
      const baseDelay = 600;
      const perWord   = 35;
      const jitter    = Math.random() * 400;
      return Math.min(baseDelay + (words * perWord) + jitter, 2800);
    }

    /**
     * Sends a message: displays user bubble, shows typing, then displays bot reply.
     * TIMING-SENSITIVE: bot reply is delayed by getTypingDelay — do not make synchronous.
     * @param {string} [text] - Optional pre-filled text (from quick reply buttons)
     */
    function sendMessage(text) {
      const msg = text || chatInput.value.trim();
      if (!msg) return;

      chatInput.value = '';
      addMessage(msg, 'user');
      quickReplies.style.display = 'none';

      showTyping();
      const response = getBotResponse(msg);
      const delay    = getTypingDelay(response);

      setTimeout(() => {
        removeTyping();
        addMessage(response, 'bot');
      }, delay);
    }

    /* ---------- Chat Toggle / Open / Close ---------- */

    // Pulse the toggle button after 2 s if chat has never been opened
    setTimeout(() => {
      if (!chatOpened) {
        chatToggle.classList.add('chat-pulse');
      }
    }, 2000);

    /**
     * TIMING-SENSITIVE: greeting sequence uses three nested timeouts (400 / 1000 / 800 / 1200 ms)
     * to produce a natural multi-message intro. Do not flatten or reorder these.
     */
    chatToggle.addEventListener('click', () => {
      chatWindow.classList.toggle('show');
      chatToggle.classList.remove('chat-pulse');

      if (chatWindow.classList.contains('show') && !chatOpened) {
        chatOpened = true;
        if (chatNotification) chatNotification.style.display = 'none';

        // Greeting message sequence — simulated typing for each message
        setTimeout(() => {
          showTyping();
          setTimeout(() => {
            removeTyping();
            addMessage("Hey there! 👋 Welcome to Dilshad Designs! I'm here to help you with any questions about services, pricing, or how to get started.", 'bot');

            setTimeout(() => {
              showTyping();
              setTimeout(() => {
                removeTyping();
                addMessage("Dilshad is a top-rated freelance graphic designer based in New Delhi, India 🇮🇳 — working with brands globally. What can I help you with today?", 'bot');
                quickReplies.style.display = 'flex';
              }, 1200);
            }, 800);

          }, 1000);
        }, 400);

      } else if (chatWindow.classList.contains('show')) {
        // Re-opened after first visit — just hide notification
        if (chatNotification) chatNotification.style.display = 'none';
      }
    });

    chatClose.addEventListener('click', () => {
      chatWindow.classList.remove('show');
      // Show lead capture when closing if there has been conversation but no capture yet
      if (messageCount > 0 && !leadCaptureShown) {
        leadCapture.style.display = 'block';
        leadCaptureShown = true;
      }
    });

    chatSend.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

    // Quick-reply chip buttons send their data-msg value directly
    quickReplies.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
    });

    /* ---------- Lead Capture Form ---------- */

    leadSubmitBtn.addEventListener('click', async () => {
      const email = leadEmail.value.trim();

      // Basic email format validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        leadEmail.style.borderColor = '#dc2626';
        return;
      }

      // Clear error state
      leadEmail.style.borderColor = '';

      // Show sending state
      leadSubmitBtn.textContent = '...';
      leadSubmitBtn.disabled    = true;

      try {
        await fetch(`${API_BASE}/api/contact/lead`, {
          method  : 'POST',
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify({ email })
        });
      } catch (err) {
        // Network errors are intentionally swallowed — we always show success
        // to avoid discouraging users with technical error messages.
        console.error('Lead capture error:', err);
      }

      // Always show success message (regardless of network outcome)
      leadCapture.innerHTML = `
        <p style="color:var(--brand);font-size:0.85rem;font-weight:600;">
          ✔ Thanks! We'll be in touch soon.
        </p>
      `;
    });

  })(); // End Chatbot IIFE

})(); // End main IIFE


/* =========================================================
   LEGAL MODALS  (section 14)
   CRITICAL: These functions MUST remain in global scope.
   They are invoked via onclick="" attributes in the HTML
   (Privacy Policy & Terms of Service buttons).
   Moving them inside an IIFE will break those buttons.
   ========================================================= */

/**
 * Opens a legal modal overlay and focuses the close button.
 * @param {'privacy'|'tos'} type
 */
function openLegalModal(type) {
  const overlay = document.getElementById(type === 'privacy' ? 'privacyModal' : 'tosModal');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const closeBtn = overlay.querySelector('.legal-modal-close');
  if (closeBtn) {
    // Small delay ensures the modal is visible before focus (screen readers)
    setTimeout(function () { closeBtn.focus(); }, 50);
  }
}

/**
 * Closes a legal modal overlay and restores body scroll.
 * @param {'privacy'|'tos'} type
 */
function closeLegalModal(type) {
  const overlay = document.getElementById(type === 'privacy' ? 'privacyModal' : 'tosModal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close legal modals when clicking the backdrop (outside the modal content)
document.addEventListener('DOMContentLoaded', function () {
  ['privacyModal', 'tosModal'].forEach(function (id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
});


/* =========================================================
   EASTER EGG  (section 15)
   CRITICAL: Must remain in global scope — requires a document-
   level keydown listener. The buffer is intentionally global
   so it persists across any UI interaction.
   Type "dilshad" anywhere on the page to trigger.
   ========================================================= */

let eggBuffer = '';
const eggCode = 'dilshad';

document.addEventListener('keydown', e => {
  eggBuffer += e.key.toLowerCase();
  // Keep only the last N characters to avoid unbounded buffer growth
  if (eggBuffer.length > eggCode.length) {
    eggBuffer = eggBuffer.slice(-eggCode.length);
  }
  if (eggBuffer === eggCode) {
    triggerEasterEgg();
    eggBuffer = '';
  }
});

/** Displays a fun branded toast notification for ~3.5 seconds. */
function triggerEasterEgg() {
  const msg = document.createElement('div');
  msg.innerHTML = 'You found the secret! Welcome to Dilshad Designs ✦';
  msg.style.cssText = `
    position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
    background:var(--gold); color:#1a2e26; padding:1rem 2rem;
    border-radius:99px; font-weight:700; font-size:0.95rem;
    z-index:999999; animation:eggFade 3.5s ease forwards;
    white-space:nowrap; box-shadow:0 8px 32px rgba(245,198,44,0.4);
  `;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3500);
}


/* =========================================================
   SERVICES CAROUSEL  (section 16)
   Scoped in an IIFE to keep carousel state private.
   RESPONSIVE: switches between absolute-position (desktop)
   and scroll-snap (mobile) strategies at 767px breakpoint.
   TIMING-SENSITIVE: ANIM_LOCK_MS must match the CSS transition
   duration on .svc-card. AUTOPLAY_MS controls slide interval.
   ========================================================= */

(function ServicesCarousel() {
  'use strict';

  /* ---------- DOM References ---------- */
  const stage   = document.getElementById('svcStage');
  if (!stage) return; // carousel not present on this page

  const wrap    = stage.closest('.svc-carousel-wrap'); // eslint-disable-line no-unused-vars
  const cards   = Array.from(stage.querySelectorAll('.svc-card'));
  const dotsWrap = document.getElementById('svcDots');
  const prevBtn  = document.getElementById('svcPrev');
  const nextBtn  = document.getElementById('svcNext');
  const total    = cards.length;

  /* ---------- Carousel State ---------- */
  let current    = 0;
  let autoTimer  = null;
  let isPaused   = false;
  let isAnimating = false;
  let isMobile   = false;

  /* ---------- Configuration ---------- */
  const AUTOPLAY_MS  = 3500; // ms between auto-advances
  const ANIM_LOCK_MS = 580;  // ms to lock navigation during CSS transition
  const MOBILE_BP    = 767;  // px breakpoint for mobile layout

  /* ---------- Build Dots ---------- */
  cards.forEach(function (_, i) {
    const dot = document.createElement('button');
    dot.className = 'svc-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to service ' + (i + 1));
    dot.setAttribute('type', 'button');
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.svc-dot'));

  /** Updates dot active state to match idx. */
  function setDot(idx) {
    dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
  }

  /* ---------- Render Strategies ---------- */

  /**
   * Desktop render: positions cards using absolute CSS classes
   * (svc-center, svc-left, svc-right). Cards not in those three
   * positions receive no class and are hidden by CSS.
   */
  function renderDesktop(idx) {
    const left  = (idx - 1 + total) % total;
    const right = (idx + 1) % total;
    cards.forEach(function (card, i) {
      card.classList.remove('svc-center', 'svc-left', 'svc-right');
      if      (i === idx)   card.classList.add('svc-center');
      else if (i === left)  card.classList.add('svc-left');
      else if (i === right) card.classList.add('svc-right');
    });
    setDot(idx);
  }

  /**
   * Mobile render: uses scroll-snap. Updates the svc-center accent class
   * and smooth-scrolls the target card into the center of the stage.
   * PERFORMANCE-SENSITIVE: scrollTo with behavior:'smooth' — do not change
   * to 'instant' as that defeats the mobile UX.
   */
  function renderMobile(idx) {
    cards.forEach(function (card, i) {
      card.classList.toggle('svc-center', i === idx);
      card.classList.remove('svc-left', 'svc-right');
    });
    setDot(idx);

    const target = cards[idx];
    if (target) {
      const cardLeft  = target.offsetLeft;
      const stageW    = stage.clientWidth;
      const cardW     = target.offsetWidth;
      const scrollTo  = cardLeft - (stageW / 2) + (cardW / 2);
      stage.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }

  /** Unified render dispatcher — delegates to mobile or desktop strategy. */
  function render(idx) {
    if (isMobile) renderMobile(idx);
    else          renderDesktop(idx);
  }

  /* ---------- Navigation ---------- */

  /**
   * Navigates to a specific carousel index with animation lock.
   * TIMING-SENSITIVE: isAnimating lock prevents rapid double-fires.
   * Lock duration must match or exceed the CSS transition duration.
   */
  function goTo(idx) {
    if (isAnimating) return;
    idx = ((idx % total) + total) % total; // wrap around safely
    if (idx === current && !isMobile) return;
    isAnimating = true;
    current = idx;
    render(current);
    setTimeout(function () { isAnimating = false; }, ANIM_LOCK_MS);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* ---------- Autoplay ---------- */

  function startAutoplay() {
    clearInterval(autoTimer);
    if (isPaused) return;
    autoTimer = setInterval(function () {
      if (!isPaused && !isAnimating) next();
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  /**
   * Temporarily stops autoplay after manual interaction, then resumes.
   * Delay matches AUTOPLAY_MS so the user-selected card has time to display.
   */
  function pauseAndResume() {
    stopAutoplay();
    setTimeout(function () {
      if (!isPaused) startAutoplay();
    }, AUTOPLAY_MS);
  }

  /* ---------- Event Listeners ---------- */

  // Pause autoplay on desktop hover
  stage.addEventListener('mouseenter', function () {
    if (isMobile) return;
    isPaused = true;
    stopAutoplay();
  });
  stage.addEventListener('mouseleave', function () {
    if (isMobile) return;
    isPaused = false;
    startAutoplay();
  });

  // Pause when tab is hidden; resume when visible again
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopAutoplay(); }
    else if (!isPaused)  { startAutoplay(); }
  });

  // Arrow buttons
  prevBtn.addEventListener('click', function () { prev(); pauseAndResume(); });
  nextBtn.addEventListener('click', function () { next(); pauseAndResume(); });

  // Side-card click to navigate (desktop only)
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      if (isMobile) return;
      if (card.classList.contains('svc-left'))  { prev(); pauseAndResume(); }
      if (card.classList.contains('svc-right')) { next(); pauseAndResume(); }
    });
  });

  /* ---------- Mobile: Scroll-Snap Sync ----------
     Detect which card is centred after a native scroll gesture and
     update the dot/class state to match. Debounced at 80ms.          */
  let scrollEndTimer = null;

  stage.addEventListener('scroll', function () {
    if (!isMobile) return;
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(function () {
      // Find the card whose midpoint is closest to the stage midpoint
      const stageMid = stage.scrollLeft + stage.clientWidth / 2;
      let closest    = 0;
      let minDist    = Infinity;

      cards.forEach(function (card, i) {
        const cardMid = card.offsetLeft + card.offsetWidth / 2;
        const dist    = Math.abs(stageMid - cardMid);
        if (dist < minDist) { minDist = dist; closest = i; }
      });

      if (closest !== current) {
        current = closest;
        setDot(current);
        cards.forEach(function (card, i) {
          card.classList.toggle('svc-center', i === current);
        });
      }
    }, 80);
  }, { passive: true });

  /* ---------- Responsive: Desktop ↔ Mobile Mode Switch ---------- */

  function checkMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= MOBILE_BP;

    if (isMobile === wasMobile) return; // no change — do nothing

    if (isMobile) {
      // Switching to mobile: clear desktop positioning classes first
      cards.forEach(function (card) {
        card.classList.remove('svc-center', 'svc-left', 'svc-right');
      });
      renderMobile(current);
    } else {
      // Switching to desktop: reset scroll position, apply absolute classes
      stage.scrollLeft = 0;
      renderDesktop(current);
    }
  }

  // Debounce resize handler to avoid thrashing during drag-resize
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkMobile, 150);
  }, { passive: true });

  /* ---------- Initialization ---------- */
  isMobile = window.innerWidth <= MOBILE_BP;
  render(0);
  startAutoplay();

})(); // End ServicesCarousel