/**
 * main.js — Dilshad Designs
 * Extracted from index.html | All JS logic preserved 100%
 *
 * Sections:
 *  1. EmailJS Init
 *  2. Dark Mode
 *  3. Reading Progress Bar
 *  4. Navbar Scroll Effect
 *  5. Active Nav Link (IntersectionObserver)
 *  6. Smooth Scroll
 *  7. Mobile Menu
 *  8. Reveal on Scroll
 *  9. Gallery Filter
 * 10. Gallery Slider + Fullscreen Lightbox
 * 11. Back to Top
 * 12. Contact Form (backend API + EmailJS fallback)
 * 13. Enhanced Chatbot
 * 14. Legal Modals
 */

(function () {
  'use strict';

  // ===================================================================
  // API BASE URL — automatically switches between local and production
  // ===================================================================
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://dilshad-designs.onrender.com';

  // ===================================================================
  // 1. EMAILJS INIT
  //    Key is kept here only as a fallback. For production, use the
  //    backend /api/contact route to avoid exposing credentials.
  // ===================================================================


  // ===================================================================
  // 2. DARK MODE
  // ===================================================================
  const html    = document.documentElement;
  const darkBtn = document.getElementById('darkToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';

  html.setAttribute('data-theme', savedTheme);
  updateDarkIcon(savedTheme);

  darkBtn.addEventListener('click', () => {
    const cur  = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateDarkIcon(next);
  });

  function updateDarkIcon(theme) {
    darkBtn.innerHTML = theme === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  // ===================================================================
  // 3. READING PROGRESS BAR
  // ===================================================================
  const progress = document.getElementById('page-progress');
  window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    progress.style.width = (scrolled / maxScroll * 100) + '%';
  }, { passive: true });

  // ===================================================================
  // 4. NAVBAR SCROLL EFFECT
  // ===================================================================
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ===================================================================
  // 5. ACTIVE NAV LINK (IntersectionObserver)
  // ===================================================================
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

  // ===================================================================
  // 6. SMOOTH SCROLL
  // ===================================================================
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.offsetTop - 68;
        window.scrollTo({ top: offset, behavior: 'smooth' });
        closeMenu();
      }
    });
  });

  // ===================================================================
  // 7. MOBILE MENU
  // ===================================================================
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // ===================================================================
  // 8. REVEAL ON SCROLL
  // ===================================================================
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(r => revealObserver.observe(r));

  // ===================================================================
  // 9. GALLERY FILTER
  // ===================================================================
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const galleryCards = document.querySelectorAll('.gallery-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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

  // ===================================================================
  // 10. GALLERY SLIDER + FULLSCREEN LIGHTBOX (v2 — Premium)
  // ===================================================================

  (function GallerySystem() {
    'use strict';

    /* -------- State -------- */
    let lbImages = [];  // [{src, alt}] for current open card
    let lbIndex  = 0;   // current slide index in lightbox
    let lbOpen   = false;

    /* -------- DOM refs -------- */
    const lightbox    = document.getElementById('lightbox');
    const lbTrack     = document.getElementById('lightbox-track');
    const lbTitle     = document.getElementById('lightbox-title');
    const lbCaption   = document.getElementById('lightbox-caption');
    const lbCounter   = document.getElementById('lightbox-counter');
    const lbDotsWrap  = document.getElementById('lightbox-dots');
    const lbClose     = document.getElementById('lightbox-close');
    const lbPrev      = document.getElementById('lb-prev');
    const lbNext      = document.getElementById('lb-next');

    /* ------------------------------------------------------------------ */
    /* Card Sliders (inline mini-carousel on each gallery card)            */
    /* ------------------------------------------------------------------ */
    document.querySelectorAll('.gallery-slider').forEach(function (slider) {
      const slides  = slider.querySelectorAll('.gallery-slide');
      const dots    = slider.querySelectorAll('.slider-dot');
      const prevBtn = slider.querySelector('.slider-arrow.prev');
      const nextBtn = slider.querySelector('.slider-arrow.next');
      const total   = slides.length;
      let current   = 0;
      let animating = false;

      if (total <= 1) return; // single-image card — nothing to do

      // Ensure only index 0 is active on load
      slides.forEach(function (s, i) { s.classList.toggle('active', i === 0); });
      dots.forEach(function (d, i)   { d.classList.toggle('active', i === 0); });

      function goTo(index) {
        if (animating) return;
        if (index < 0) index = total - 1;
        if (index >= total) index = 0;
        if (index === current) return;

        animating = true;
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dots[current].classList.add('active');

        // Preload next image
        const nextIdx = (current + 1) % total;
        const nextImg = slides[nextIdx].querySelector('img');
        if (nextImg && nextImg.dataset.src) {
          nextImg.src = nextImg.dataset.src;
          delete nextImg.dataset.src;
        }

        setTimeout(function () { animating = false; }, 520);
      }

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

      dots.forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(parseInt(dot.dataset.index, 10));
        });
      });

      // Touch / swipe support on card
      let touchStartX = 0, touchStartY = 0;
      slider.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });
      slider.addEventListener('touchend', function (e) {
        const dx = touchStartX - e.changedTouches[0].screenX;
        const dy = Math.abs(touchStartY - e.changedTouches[0].screenY);
        if (Math.abs(dx) > 38 && dy < 60) {
          goTo(dx > 0 ? current + 1 : current - 1);
        }
      }, { passive: true });

      slider._getIndex = function () { return current; };
    });

    /* ------------------------------------------------------------------ */
    /* Lightbox — build slides, open/close, navigate                       */
    /* ------------------------------------------------------------------ */

    function buildLbSlides(images) {
      lbTrack.innerHTML  = '';
      lbDotsWrap.innerHTML = '';
      const frag    = document.createDocumentFragment();
      const dotFrag = document.createDocumentFragment();

      images.forEach(function (img, i) {
        const slide = document.createElement('div');
        slide.className = 'lb-slide' + (i === 0 ? ' lb-active' : '');
        const image     = document.createElement('img');
        image.src       = img.src;
        image.alt       = img.alt || '';
        image.draggable = false;
        const preload   = new Image();
        preload.src     = img.src;
        slide.appendChild(image);
        frag.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = 'lb-dot' + (i === 0 ? ' lb-dot-active' : '');
        dot.setAttribute('data-index', i);
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
        dot.addEventListener('click', function () { lbGoTo(parseInt(dot.dataset.index, 10)); });
        dotFrag.appendChild(dot);
      });

      lbTrack.appendChild(frag);
      lbDotsWrap.appendChild(dotFrag);
    }

    function openLightbox(card, startIndex) {
      const slides   = card.querySelectorAll('.gallery-slide');
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

      lightbox.classList.toggle('lb-single', lbImages.length === 1);

      lbOpen = true;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { lbClose.focus(); });
    }

    function lbGoTo(index, direction) {
      if (lbImages.length <= 1) return;
      if (index < 0) index = lbImages.length - 1;
      if (index >= lbImages.length) index = 0;
      if (index === lbIndex) return;

      const slides   = lbTrack.querySelectorAll('.lb-slide');
      const dots     = lbDotsWrap.querySelectorAll('.lb-dot');
      const dir      = (direction !== undefined) ? direction : (index > lbIndex ? 'right' : 'left');
      const outSlide = slides[lbIndex];
      const inSlide  = slides[index];

      inSlide.classList.add(dir === 'right' ? 'lb-enter-right' : 'lb-enter-left');
      void inSlide.offsetWidth; // force reflow
      outSlide.classList.remove('lb-active');
      inSlide.classList.remove('lb-enter-right', 'lb-enter-left');
      inSlide.classList.add('lb-active');

      dots[lbIndex].classList.remove('lb-dot-active');
      dots[index].classList.add('lb-dot-active');

      lbIndex = index;
      updateLbUI(lbIndex);
    }

    function updateLbUI(index) {
      lbCaption.textContent = lbImages[index].alt || lbTitle.textContent;
      lbCounter.textContent = lbImages.length > 1
        ? (index + 1) + ' / ' + lbImages.length
        : '';
    }

    function closeLightbox() {
      if (!lbOpen) return;
      lbOpen = false;
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    lbClose.addEventListener('click', closeLightbox);

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

    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      if (e.key === 'Escape')          { closeLightbox(); }
      else if (e.key === 'ArrowRight') { lbGoTo(lbIndex + 1, 'right'); }
      else if (e.key === 'ArrowLeft')  { lbGoTo(lbIndex - 1, 'left'); }
    });

    let lbTouchStartX = 0, lbTouchStartY = 0;
    lbTrack.addEventListener('touchstart', function (e) {
      lbTouchStartX = e.changedTouches[0].screenX;
      lbTouchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    lbTrack.addEventListener('touchend', function (e) {
      const dx = lbTouchStartX - e.changedTouches[0].screenX;
      const dy = Math.abs(lbTouchStartY - e.changedTouches[0].screenY);
      if (Math.abs(dx) > 45 && dy < 80) {
        lbGoTo(dx > 0 ? lbIndex + 1 : lbIndex - 1, dx > 0 ? 'right' : 'left');
      }
    }, { passive: true });

    document.querySelectorAll('.gallery-card').forEach(function (card) {
      card.querySelectorAll('.gallery-zoom-icon').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
          e.stopPropagation();
          const parentSlide  = icon.closest('.gallery-slide');
          const slides       = Array.from(card.querySelectorAll('.gallery-slide'));
          const clickedIndex = slides.indexOf(parentSlide);
          openLightbox(card, clickedIndex >= 0 ? clickedIndex : 0);
        });
      });

      card.addEventListener('click', function (e) {
        if (
          e.target.closest('.slider-arrow') ||
          e.target.closest('.slider-dots') ||
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

  // ===================================================================
  // 11. BACK TO TOP
  // ===================================================================
  const btt = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btt.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ===================================================================
// ===================================================================
// 12. CONTACT FORM — only runs if form exists on this page
// ===================================================================
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const submitBtn   = document.getElementById('submitBtn');
    const submitText  = document.getElementById('submitText');
    const formSuccess = document.getElementById('formSuccess');

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

      if (contactForm.querySelector('[name="_honey"]').value) return;

      const fields = contactForm.querySelectorAll('input:not([name="_honey"]), textarea, select');
      let allValid = true;
      fields.forEach(f => { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Server error: ' + response.status);
        }

        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';

        setTimeout(() => {
          formSuccess.style.display = 'none';
          contactForm.reset();
          contactForm.style.display = 'block';
        }, 3000);

      } catch (err) {
        console.error('Form submission error:', err);
        submitText.textContent = 'Failed — try again';
        submitBtn.querySelector('i').className = 'fas fa-exclamation-triangle';
        setTimeout(() => {
          submitText.textContent = 'Send Message';
          submitBtn.querySelector('i').className = 'fas fa-paper-plane';
          submitBtn.disabled = false;
        }, 3000);
        return;
      }

      submitBtn.disabled = false;
      submitText.textContent = 'Send Message';
      submitBtn.querySelector('i').className = 'fas fa-paper-plane';
    });

  } // end if (contactForm)

  // ===================================================================
  // 13. ENHANCED CHATBOT
  // ===================================================================
  (function () {
    const chatToggle      = document.getElementById('chatToggle');
    const chatWindow      = document.getElementById('chatWindow');
    const chatClose       = document.getElementById('chatClose');
    const chatInput       = document.getElementById('chatInput');
    const chatSend        = document.getElementById('chatSend');
    const chatMessages    = document.getElementById('chatMessages');
    const quickReplies    = document.getElementById('quickReplies');
    const chatNotification = document.querySelector('.chat-notification');
    const leadCapture     = document.getElementById('leadCapture');
    const leadEmail       = document.getElementById('leadEmail');
    const leadSubmitBtn   = document.getElementById('leadSubmitBtn');

    let chatOpened        = false;
    let messageCount      = 0;
    let leadCaptureShown  = false;
    let conversationContext = null;

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

    function getBotResponse(msg) {
      const lower = msg.toLowerCase().trim();

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

      // Context-aware service recommendation
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

      const defaults = botKnowledge.default;
      return defaults[Math.floor(Math.random() * defaults.length)];
    }

    function formatBubbleText(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }

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

      if (messageCount >= 4 && !leadCaptureShown && sender === 'bot') {
        setTimeout(() => {
          leadCapture.style.display = 'block';
          leadCaptureShown = true;
        }, 1200);
      }
    }

    function showTyping() {
      const typing = document.createElement('div');
      typing.className = 'chat-msg bot';
      typing.id = 'typingIndicator';
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

    function removeTyping() {
      const t = document.getElementById('typingIndicator');
      if (t) t.remove();
    }

    function getTypingDelay(response) {
      const words     = response.split(' ').length;
      const baseDelay = 600;
      const perWord   = 35;
      const jitter    = Math.random() * 400;
      return Math.min(baseDelay + (words * perWord) + jitter, 2800);
    }

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

    // Pulse toggle after 2 seconds to attract attention
    setTimeout(() => {
      if (!chatOpened) {
        chatToggle.classList.add('chat-pulse');
      }
    }, 2000);

    chatToggle.addEventListener('click', () => {
      chatWindow.classList.toggle('show');
      chatToggle.classList.remove('chat-pulse');

      if (chatWindow.classList.contains('show') && !chatOpened) {
        chatOpened = true;
        if (chatNotification) chatNotification.style.display = 'none';

        // Greeting sequence
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
        if (chatNotification) chatNotification.style.display = 'none';
      }
    });

    chatClose.addEventListener('click', () => {
      chatWindow.classList.remove('show');
      if (messageCount > 0 && !leadCaptureShown) {
        leadCapture.style.display = 'block';
        leadCaptureShown = true;
      }
    });

    chatSend.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

    quickReplies.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
    });

    leadSubmitBtn.addEventListener('click', async () => {
      const email = leadEmail.value.trim();

      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        leadEmail.style.borderColor = '#dc2626';
        return;
      }

      // Clear error state
      leadEmail.style.borderColor = '';

      // Show sending state on button
      leadSubmitBtn.textContent = '...';
      leadSubmitBtn.disabled    = true;

      try {
        // Send email to backend lead route
        const response = await fetch(`${API_BASE}/api/contact/lead`, {
          method  : 'POST',
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify({ email })
        });

        // Show success message regardless of response
        // (we never want to show an error to the user for this)
        leadCapture.innerHTML = `
          <p style="color:var(--brand);font-size:0.85rem;font-weight:600;">
            ✔ Thanks! We'll be in touch soon.
          </p>
        `;

      } catch (err) {
        // Network error — still show success to user
        console.error('Lead capture error:', err);
        leadCapture.innerHTML = `
          <p style="color:var(--brand);font-size:0.85rem;font-weight:600;">
            ✔ Thanks! We'll be in touch soon.
          </p>
        `;
      }
    });

  })(); // End Chatbot IIFE

})(); // End main IIFE

// ===================================================================
// 14. LEGAL MODALS
//    These functions are global because they are called via onclick=""
//    in the HTML (Privacy Policy & Terms of Service buttons).
// ===================================================================

function openLegalModal(type) {
  const overlay = document.getElementById(type === 'privacy' ? 'privacyModal' : 'tosModal');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const closeBtn = overlay.querySelector('.legal-modal-close');
  if (closeBtn) {
    setTimeout(function () { closeBtn.focus(); }, 50);
  }
}

function closeLegalModal(type) {
  const overlay = document.getElementById(type === 'privacy' ? 'privacyModal' : 'tosModal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close legal modals on backdrop click
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

// ===================== EASTER EGG =====================
let eggBuffer = '';
const eggCode = 'dilshad';

document.addEventListener('keydown', e => {
  eggBuffer += e.key.toLowerCase();
  if (eggBuffer.length > eggCode.length) eggBuffer = eggBuffer.slice(-eggCode.length);
  if (eggBuffer === eggCode) {
    triggerEasterEgg();
    eggBuffer = '';
  }
});

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

// ===================================================================
// 15. SERVICES CAROUSEL
// ===================================================================
(function ServicesCarousel() {
  var stage    = document.getElementById('svcStage');
  if (!stage) return;

  var cards     = Array.from(stage.querySelectorAll('.svc-card'));
  var dotsWrap  = document.getElementById('svcDots');
  var prevBtn   = document.getElementById('svcPrev');
  var nextBtn   = document.getElementById('svcNext');
  var total     = cards.length;
  var current   = 0;
  var autoTimer = null;
  var isAnimating = false;
  var isPaused  = false;
  var AUTOPLAY_INTERVAL = 3500;
  var ANIM_DURATION     = 600;

  // ── Build dots ──────────────────────────────────────────────────
  cards.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'svc-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to service ' + (i + 1));
    dot.addEventListener('click', function () {
      if (i !== current) goTo(i);
    });
    dotsWrap.appendChild(dot);
  });

  // ── Render ──────────────────────────────────────────────────────
  function render(idx) {
    var prevIdx = (idx - 1 + total) % total;
    var nextIdx = (idx + 1) % total;

    cards.forEach(function (card, i) {
      card.classList.remove('svc-center', 'svc-left', 'svc-right');
      if      (i === idx)     card.classList.add('svc-center');
      else if (i === prevIdx) card.classList.add('svc-left');
      else if (i === nextIdx) card.classList.add('svc-right');
    });

    var dots = dotsWrap.querySelectorAll('.svc-dot');
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === idx);
    });
  }

  // ── Navigate ────────────────────────────────────────────────────
  function goTo(idx) {
    if (isAnimating) return;
    isAnimating = true;
    current = ((idx % total) + total) % total;
    render(current);
    setTimeout(function () { isAnimating = false; }, ANIM_DURATION);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // ── Autoplay ────────────────────────────────────────────────────
  function startAutoplay() {
    // Always clear before starting to prevent duplicate timers
    clearInterval(autoTimer);
    if (isPaused) return;
    autoTimer = setInterval(function () {
      if (!isPaused && !isAnimating) next();
    }, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  // ── Pause on hover / focus ───────────────────────────────────────
  stage.addEventListener('mouseenter', function () {
    isPaused = true;
    stopAutoplay();
  });
  stage.addEventListener('mouseleave', function () {
    isPaused = false;
    startAutoplay();
  });
  stage.addEventListener('focusin', function () {
    isPaused = true;
    stopAutoplay();
  });
  stage.addEventListener('focusout', function () {
    isPaused = false;
    startAutoplay();
  });

  // ── Pause when tab is hidden ─────────────────────────────────────
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopAutoplay();
    } else if (!isPaused) {
      startAutoplay();
    }
  });

  // ── Arrow buttons ────────────────────────────────────────────────
  prevBtn.addEventListener('click', function () {
    prev();
    // Brief pause after manual interaction, then resume
    stopAutoplay();
    setTimeout(function () {
      if (!isPaused) startAutoplay();
    }, AUTOPLAY_INTERVAL);
  });

  nextBtn.addEventListener('click', function () {
    next();
    stopAutoplay();
    setTimeout(function () {
      if (!isPaused) startAutoplay();
    }, AUTOPLAY_INTERVAL);
  });

  // ── Click side cards to advance ──────────────────────────────────
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      if (card.classList.contains('svc-left'))  { prev(); stopAutoplay(); setTimeout(function () { if (!isPaused) startAutoplay(); }, AUTOPLAY_INTERVAL); }
      if (card.classList.contains('svc-right')) { next(); stopAutoplay(); setTimeout(function () { if (!isPaused) startAutoplay(); }, AUTOPLAY_INTERVAL); }
    });
  });

  // ── Touch / swipe ────────────────────────────────────────────────
  var touchStartX = 0;
  var touchStartY = 0;
  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var dx = touchStartX - e.changedTouches[0].screenX;
    var dy = Math.abs(touchStartY - e.changedTouches[0].screenY);
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx > 0) next(); else prev();
      stopAutoplay();
      setTimeout(function () { if (!isPaused) startAutoplay(); }, AUTOPLAY_INTERVAL);
    }
  }, { passive: true });

  // ── Dot clicks pause briefly then resume ────────────────────────
  dotsWrap.querySelectorAll('.svc-dot').forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      stopAutoplay();
      setTimeout(function () { if (!isPaused) startAutoplay(); }, AUTOPLAY_INTERVAL);
    });
  });

  // ── Init ─────────────────────────────────────────────────────────
  render(0);
  startAutoplay();

})(); // End ServicesCarousel