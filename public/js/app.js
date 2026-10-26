(function () {
  'use strict';

  var CATEGORIES = ['All', 'Dresses', 'Tops', 'Accessories'];
  var AUTOPLAY_MS = 5500;

  var slides = [];
  var currentSlide = 0;
  var isPlaying = true;
  var slideTimer = null;
  var progressTimer = null;
  var progress = 0;
  var touchStartX = null;

  var allItems = [];
  var activeCategory = 'All';

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function scrollTo(selector) {
    var el = $(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- Navbar ---------- */
  var navbar = $('#navbar');
  var navToggle = $('#navToggle');
  var navToggleIcon = $('#navToggleIcon');
  var navMobile = $('#navMobile');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  navToggle.addEventListener('click', function () {
    navMobile.classList.toggle('open');
    var open = navMobile.classList.contains('open');
    navToggleIcon.innerHTML = open
      ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
      : '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
  });

  $$('[data-scroll]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      navMobile.classList.remove('open');
      navToggleIcon.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
      scrollTo(btn.getAttribute('data-scroll'));
    });
  });

  $('#navLogo').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#heroExploreBtn').addEventListener('click', function () {
    scrollTo('#gallery');
  });

  /* ---------- Hero Slideshow ---------- */
  var heroSlidesEl = $('#heroSlides');
  var heroDotsEl = $('#heroDots');
  var heroLabel = $('#heroLabel');
  var heroTitle = $('#heroTitle');
  var heroPlayBtn = $('#heroPlayBtn');
  var heroPlayIcon = $('#heroPlayIcon');

  function fetchSlides() {
    fetch('/api/slides')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.length > 0) {
          slides = data;
          renderSlides();
          renderDots();
          startAutoplay();
        }
      })
      .catch(function () {});
  }

  function renderSlides() {
    heroSlidesEl.innerHTML = '';
    slides.forEach(function (slide, i) {
      var div = document.createElement('div');
      div.className = 'hero-slide' + (i === 0 ? ' active' : '');
      div.innerHTML = '<div class="hero-slide-bg" style="background-image: url(' + slide.image_url + ')"></div>';
      heroSlidesEl.appendChild(div);
    });
  }

  function renderDots() {
    heroDotsEl.innerHTML = '';
    slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) {
        var prog = document.createElement('span');
        prog.className = 'hero-dot-progress';
        dot.appendChild(prog);
      }
      dot.addEventListener('click', function () { goToSlide(i); });
      heroDotsEl.appendChild(dot);
    });
  }

  function goToSlide(index) {
    currentSlide = index;
    updateSlide();
    resetProgress();
    if (isPlaying) restartAutoplay();
  }

  function updateSlide() {
    var slideEls = heroSlidesEl.querySelectorAll('.hero-slide');
    slideEls.forEach(function (el, i) {
      el.classList.toggle('active', i === currentSlide);
    });

    heroDotsEl.querySelectorAll('.hero-dot').forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentSlide);
      dot.innerHTML = '';
      if (i === currentSlide) {
        var prog = document.createElement('span');
        prog.className = 'hero-dot-progress';
        prog.style.width = '0%';
        dot.appendChild(prog);
      }
    });

    if (slides[currentSlide]) {
      heroLabel.textContent = slides[currentSlide].category + ' — Made in Rwanda';
      heroTitle.textContent = slides[currentSlide].name;
      heroLabel.style.animation = 'none';
      heroTitle.style.animation = 'none';
      void heroLabel.offsetHeight;
      heroLabel.style.animation = 'fadeInUp 0.7s ease-out';
      heroTitle.style.animation = 'fadeInUp 0.7s ease-out';
    }
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlide();
    resetProgress();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlide();
    resetProgress();
  }

  function startAutoplay() {
    stopAutoplay();
    if (!isPlaying || slides.length <= 1) return;
    slideTimer = setInterval(function () {
      nextSlide();
    }, AUTOPLAY_MS);
    progressTimer = setInterval(function () {
      progress = Math.min(progress + (50 / AUTOPLAY_MS) * 100, 100);
      var progEl = heroDotsEl.querySelector('.hero-dot.active .hero-dot-progress');
      if (progEl) progEl.style.width = progress + '%';
    }, 50);
  }

  function stopAutoplay() {
    if (slideTimer) clearInterval(slideTimer);
    if (progressTimer) clearInterval(progressTimer);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  function resetProgress() {
    progress = 0;
  }

  $('#heroNext').addEventListener('click', function () { nextSlide(); });
  $('#heroPrev').addEventListener('click', function () { prevSlide(); });

  heroPlayBtn.addEventListener('click', function () {
    isPlaying = !isPlaying;
    if (isPlaying) {
      heroPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      startAutoplay();
    } else {
      heroPlayIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
      stopAutoplay();
    }
  });

  // Touch swipe
  var heroEl = $('#hero');
  heroEl.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  });
  heroEl.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide(); else prevSlide();
    }
    touchStartX = null;
  });

  // Keyboard nav
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });

  /* ---------- Gallery ---------- */
  var galleryFiltersEl = $('#galleryFilters');
  var galleryContentEl = $('#galleryContent');

  function renderFilters() {
    galleryFiltersEl.innerHTML = '';
    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'gallery-filter' + (cat === activeCategory ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        activeCategory = cat;
        renderFilters();
        renderGallery();
      });
      galleryFiltersEl.appendChild(btn);
    });
  }

  function fetchGallery() {
    galleryContentEl.innerHTML = '<div class="gallery-loading"><span class="spinner"></span></div>';
    fetch('/api/inventory')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          galleryContentEl.innerHTML = '<div class="gallery-error"><p>Unable to load the collection right now. Please check back later.</p></div>';
          return;
        }
        allItems = data;
        renderGallery();
      })
      .catch(function () {
        galleryContentEl.innerHTML = '<div class="gallery-error"><p>Unable to load the collection right now. Please check back later.</p></div>';
      });
  }

  function renderGallery() {
    var filtered = activeCategory === 'All'
      ? allItems
      : allItems.filter(function (item) { return item.category === activeCategory; });

    if (filtered.length === 0) {
      galleryContentEl.innerHTML = '<div class="gallery-empty"><p>No items in this category yet.</p></div>';
      return;
    }

    galleryContentEl.innerHTML = '<div class="gallery-grid"></div>';
    var grid = galleryContentEl.querySelector('.gallery-grid');

    filtered.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'gallery-card';

      var priceHtml = item.price
        ? '<span class="gallery-card-price">' + item.price.toLocaleString() + ' RWF</span>'
        : '<span class="gallery-card-price-na">Price on request</span>';

      var sizeHtml = item.size
        ? '<span class="gallery-card-size"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/></svg>' + item.size + '</span>'
        : '';

      var soldBadge = item.status === 'Sold'
        ? '<div class="gallery-card-badge">Sold</div>'
        : '';

      card.innerHTML =
        '<div class="gallery-card-img">' +
          '<img src="' + item.image_url + '" alt="' + escapeHtml(item.name) + '" loading="lazy" />' +
          soldBadge +
          '<div class="gallery-card-overlay"><span class="gallery-card-overlay-text">View Details</span></div>' +
        '</div>' +
        '<div class="gallery-card-body">' +
          '<p class="gallery-card-cat">' + escapeHtml(item.category) + '</p>' +
          '<h3 class="gallery-card-name">' + escapeHtml(item.name) + '</h3>' +
          '<div class="gallery-card-meta">' + priceHtml + sizeHtml + '</div>' +
        '</div>';

      card.addEventListener('click', function () { openModal(item); });
      grid.appendChild(card);
    });
  }

  /* ---------- Modal ---------- */
  var modalContainer = $('#modalContainer');

  function openModal(item) {
    var priceText = item.price
      ? item.price.toLocaleString() + ' RWF'
      : 'Price on request';

    var badgeHtml = item.status === 'Sold'
      ? '<div class="modal-badge modal-badge-sold"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Sold</div>'
      : '<div class="modal-badge modal-badge-available"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Available</div>';

    var sizeHtml = item.size
      ? '<div class="modal-detail"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/></svg><span>Size: ' + escapeHtml(item.size) + '</span></div>'
      : '';

    var inquireBtn = item.status !== 'Sold'
      ? '<button class="modal-inquire" id="modalInquire">Inquire About This Piece</button>'
      : '';

    modalContainer.innerHTML =
      '<div class="modal-overlay" id="modalOverlay">' +
        '<div class="modal" id="modalBox">' +
          '<div class="modal-img"><img src="' + item.image_url + '" alt="' + escapeHtml(item.name) + '" /></div>' +
          '<div class="modal-body">' +
            '<div>' +
              '<div class="modal-header">' +
                '<div>' +
                  '<p class="modal-cat">' + escapeHtml(item.category) + '</p>' +
                  '<h3 class="modal-name">' + escapeHtml(item.name) + '</h3>' +
                '</div>' +
                '<button class="modal-close" id="modalClose"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
              '</div>' +
              badgeHtml +
              (item.description ? '<p class="modal-desc">' + escapeHtml(item.description) + '</p>' : '') +
              '<div class="modal-details">' +
                sizeHtml +
                '<div class="modal-detail"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg><span>' + priceText + '</span></div>' +
              '</div>' +
            '</div>' +
            inquireBtn +
          '</div>' +
        '</div>' +
      '</div>';

    $('#modalOverlay').addEventListener('click', function (e) {
      if (e.target === $('#modalOverlay')) closeModal();
    });
    $('#modalClose').addEventListener('click', closeModal);

    var inquireEl = $('#modalInquire');
    if (inquireEl) {
      inquireEl.addEventListener('click', function () {
        closeModal();
        scrollTo('#contact');
        setTimeout(function () {
          var itemField = $('#contactItem');
          if (itemField) itemField.value = item.name;
        }, 600);
      });
    }
  }

  function closeModal() {
    modalContainer.innerHTML = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- Contact Form ---------- */
  var form = $('#contactForm');
  var formAlert = $('#formAlert');
  var submitBtn = $('#formSubmit');
  var submitText = $('#submitText');
  var submitIcon = $('#submitIcon');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formAlert.innerHTML = '';

    var name = $('#contactName').value.trim();
    var email = $('#contactEmail').value.trim();
    var message = $('#contactMessage').value.trim();
    var itemName = $('#contactItem').value.trim();

    if (!name || !email || !message) return;

    submitBtn.disabled = true;
    submitText.textContent = 'Sending...';
    submitIcon.innerHTML = '<path d="M21 12a9 9 0 1 1-6.219-8.56"/><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message, item_name: itemName }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          showAlert('error');
        } else {
          showAlert('success');
          form.reset();
        }
      })
      .catch(function () { showAlert('error'); })
      .finally(function () {
        submitBtn.disabled = false;
        submitText.textContent = 'Send Message';
        submitIcon.innerHTML = '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>';
      });
  });

  function showAlert(type) {
    if (type === 'success') {
      formAlert.innerHTML = '<div class="form-alert form-alert-success"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Thank you! Your message has been sent. We will be in touch soon.</p></div>';
    } else {
      formAlert.innerHTML = '<div class="form-alert form-alert-error"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Something went wrong. Please try again or email us directly.</p></div>';
    }
    setTimeout(function () { formAlert.innerHTML = ''; }, 5000);
  }

  /* ---------- Utils ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Init ---------- */
  $('#year').textContent = new Date().getFullYear();
  renderFilters();
  fetchSlides();
  fetchGallery();
})();
