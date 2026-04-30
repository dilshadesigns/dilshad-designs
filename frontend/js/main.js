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
 * 13. AI-Powered Chatbot (OpenRouter via secure backend)
 * 14. Legal Modals
 */

(function () {
  'use strict';

  // ===================================================================
  // API BASE URL — automatically switches between local and production
  // ===================================================================
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://dilshad-designs.onrender.com';

  // ===================================================================
  // 1. EMAILJS INIT
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
    let lbImages = [];
    let lbIndex  = 0;
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

    /* Card Sliders */
    document.querySelectorAll('.gallery-slider').forEach(function (slider) {
      const slides  = slider.querySelectorAll('.gallery-slide');
      const dots    = slider.querySelectorAll('.slider-dot');
      const prevBtn = slider.querySelector('.slider-arrow.prev');
      const nextBtn = slider.querySelector('.slider-arrow.next');
      const total   = slides.length;
      let current   = 0;
      let animating = false;

      if (total <= 1) return;

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

    /* Lightbox */
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
      void inSlide.offsetWidth;
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
  // 13. AI-POWERED CHATBOT
  //
  // WHAT CHANGED vs old chatbot:
  //   REMOVED: botKnowledge object, getBotResponse() rule-based function
  //   REMOVED: All pattern-matching trigger arrays
  //   KEPT:    All UI functions (addMessage, showTyping, removeTyping, etc.)
  //   KEPT:    All DOM interactions, lead capture, quick replies
  //   ADDED:   callAI() — async function calling /api/chat on your backend
  //   ADDED:   conversationHistory[] — maintains context across messages
  //   ADDED:   Realistic typing delay tied to response length
  //   ADDED:   Graceful error fallback (never shows a broken bot)
  // ===================================================================
  (function () {

    // ── DOM refs (unchanged) ─────────────────────────────────────────
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

    // ── State ────────────────────────────────────────────────────────
    let chatOpened       = false;
    let messageCount     = 0;
    let leadCaptureShown = false;
    let isAITyping       = false; // prevent double-sends while AI responds

    /**
     * conversationHistory — kept in memory for the session.
     * Sent to backend with each request so AI has full context.
     * Format: [{ role: 'user'|'assistant', content: '...' }]
     */
    let conversationHistory = [];

    // ── callAI() — the core replacement for getBotResponse() ─────────
    /**
     * Sends message + history to your backend /api/chat endpoint.
     * Backend calls OpenRouter with your secure API key.
     * Returns the AI's reply string.
     */
    async function callAI(userMessage) {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory, // send conversation context
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // If backend returned a fallback reply even on error, use it
        if (data.reply) return data.reply;
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.reply) throw new Error('Empty AI response');
      return data.reply;
    }

    // ── UI Helpers (unchanged from original) ─────────────────────────

    function formatBubbleText(text) {
      // Convert newlines to <br>, leave plain text otherwise
      // AI responses don't use markdown bold (**) — server strips it
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // strip bold markers gracefully
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

      // Show lead capture after 4th message exchange
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

    /**
     * Calculates a realistic display delay based on response length.
     * Short responses appear faster; long responses get a bit more time.
     * Min: 400ms  Max: 1800ms (AI already took real time to respond)
     */
    function getDisplayDelay(responseText) {
      const words = responseText.split(' ').length;
      return Math.min(400 + words * 20, 1800);
    }

    // ── sendMessage() — upgraded to use AI ───────────────────────────

    async function sendMessage(text) {
      const msg = (text || chatInput.value).trim();
      if (!msg || isAITyping) return;

      chatInput.value = '';
      isAITyping = true;

      // Disable input while waiting for AI
      chatInput.disabled = true;
      chatSend.disabled  = true;

      addMessage(msg, 'user');
      quickReplies.style.display = 'none';

      // Add to history immediately
      conversationHistory.push({ role: 'user', content: msg });

      showTyping();

      try {
        // Call AI backend
        const reply = await callAI(msg);

        // Small display delay for realism (AI already did real work)
        await new Promise(resolve => setTimeout(resolve, getDisplayDelay(reply)));

        removeTyping();
        addMessage(reply, 'bot');

        // Add AI reply to conversation history
        conversationHistory.push({ role: 'assistant', content: reply });

        // Keep history from growing too large (last 20 messages)
        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-20);
        }

      } catch (err) {
        console.error('AI chat error:', err);
        removeTyping();

        // Graceful fallback — chatbot never appears broken
        const fallback = "I'm having a quick moment of trouble, but I'll be right back! 😊\n\nIn the meantime, you can reach Dilshad directly:\n• Email: dilshadesign.co@gmail.com\n• Fiverr: fiverr.com/dilshadesigns\n• Or use the Contact form on this page!";
        addMessage(fallback, 'bot');
      } finally {
        isAITyping       = false;
        chatInput.disabled = false;
        chatSend.disabled  = false;
        chatInput.focus();
      }
    }

    // ── Chat open/close (unchanged logic) ────────────────────────────

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

        // Opening greeting sequence — hardcoded for instant feel (no AI delay on first open)
        setTimeout(() => {
          showTyping();
          setTimeout(() => {
            removeTyping();
            addMessage("Hey there! 👋 Welcome to Dilshad Designs! I'm your AI assistant — ask me anything about services, pricing, turnaround times, or how to get started.", 'bot');

            setTimeout(() => {
              showTyping();
              setTimeout(() => {
                removeTyping();
                addMessage("Dilshad is a top-rated freelance graphic designer and web developer based in New Delhi, India 🇮🇳 — working with brands globally. What can I help you with today?", 'bot');
                quickReplies.style.display = 'flex';

                // Pre-fill history so AI has context from the start
                conversationHistory = [
                  { role: 'assistant', content: "Hey there! I'm your AI assistant for Dilshad Designs — ask me anything about services, pricing, turnaround, or how to get started." },
                  { role: 'assistant', content: "Dilshad is a top-rated freelance graphic designer and web developer based in New Delhi, India — working with brands globally." },
                ];
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
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    quickReplies.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
    });

    // ── Lead Capture (unchanged) ──────────────────────────────────────

    leadSubmitBtn.addEventListener('click', async () => {
      const email = leadEmail.value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        leadEmail.style.borderColor = '#dc2626';
        return;
      }

      leadEmail.style.borderColor = '';
      leadSubmitBtn.textContent = '...';
      leadSubmitBtn.disabled    = true;

      try {
        await fetch(`${API_BASE}/api/contact/lead`, {
          method  : 'POST',
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify({ email }),
        });
      } catch (err) {
        console.error('Lead capture error:', err);
      }

      // Always show success (never frustrate the user)
      leadCapture.innerHTML = `
        <p style="color:var(--brand);font-size:0.85rem;font-weight:600;">
          ✔ Thanks! We'll be in touch soon.
        </p>
      `;
    });

  })(); // End AI Chatbot IIFE

})(); // End main IIFE

// ===================================================================
// 14. LEGAL MODALS
//    Global scope — called via onclick="" in HTML
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