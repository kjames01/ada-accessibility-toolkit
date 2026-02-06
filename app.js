(function() {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function announce(message) {
    const el = $('#announcer');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 100);
  }

  // ============================================================
  // Named CSS Colors Map
  // ============================================================
  const NAMED_COLORS = {
    aliceblue: { r: 240, g: 248, b: 255 },
    antiquewhite: { r: 250, g: 235, b: 215 },
    aqua: { r: 0, g: 255, b: 255 },
    aquamarine: { r: 127, g: 255, b: 212 },
    beige: { r: 245, g: 245, b: 220 },
    black: { r: 0, g: 0, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    brown: { r: 165, g: 42, b: 42 },
    coral: { r: 255, g: 127, b: 80 },
    crimson: { r: 220, g: 20, b: 60 },
    cyan: { r: 0, g: 255, b: 255 },
    darkblue: { r: 0, g: 0, b: 139 },
    darkgray: { r: 169, g: 169, b: 169 },
    darkgreen: { r: 0, g: 100, b: 0 },
    darkred: { r: 139, g: 0, b: 0 },
    gold: { r: 255, g: 215, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    green: { r: 0, g: 128, b: 0 },
    hotpink: { r: 255, g: 105, b: 180 },
    indigo: { r: 75, g: 0, b: 130 },
    ivory: { r: 255, g: 255, b: 240 },
    lavender: { r: 230, g: 230, b: 250 },
    lime: { r: 0, g: 255, b: 0 },
    magenta: { r: 255, g: 0, b: 255 },
    maroon: { r: 128, g: 0, b: 0 },
    navy: { r: 0, g: 0, b: 128 },
    olive: { r: 128, g: 128, b: 0 },
    orange: { r: 255, g: 165, b: 0 },
    orchid: { r: 218, g: 112, b: 214 },
    pink: { r: 255, g: 192, b: 203 },
    plum: { r: 221, g: 160, b: 221 },
    purple: { r: 128, g: 0, b: 128 },
    red: { r: 255, g: 0, b: 0 },
    salmon: { r: 250, g: 128, b: 114 },
    silver: { r: 192, g: 192, b: 192 },
    teal: { r: 0, g: 128, b: 128 },
    tomato: { r: 255, g: 99, b: 71 },
    violet: { r: 238, g: 130, b: 238 },
    white: { r: 255, g: 255, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    yellowgreen: { r: 154, g: 205, b: 50 }
  };

  // ============================================================
  // Color Utilities
  // ============================================================
  function parseColor(str) {
    if (!str) return null;
    str = str.trim().toLowerCase();

    // Named color
    if (NAMED_COLORS[str]) {
      return { ...NAMED_COLORS[str] };
    }

    // Hex color
    var hexMatch = str.match(/^#?([0-9a-f]{3,8})$/);
    if (hexMatch) {
      var hex = hexMatch[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
      }
      if (hex.length === 6 || hex.length === 8) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
      }
    }

    // rgb(r, g, b)
    var rgbMatch = str.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
    if (rgbMatch) {
      var r = parseInt(rgbMatch[1], 10);
      var g = parseInt(rgbMatch[2], 10);
      var b = parseInt(rgbMatch[3], 10);
      if (r <= 255 && g <= 255 && b <= 255) {
        return { r: r, g: g, b: b };
      }
    }

    return null;
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(v) {
      var h = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function sRGBtoLinear(val) {
    val = val / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(r, g, b) {
    return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
  }

  function contrastRatio(lum1, lum2) {
    var lighter = Math.max(lum1, lum2);
    var darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ============================================================
  // 1. Page Navigation
  // ============================================================
  function initNavigation() {
    var navBtns = $$('.nav-btn');
    var pages = $$('.page');

    function navigateTo(pageId) {
      navBtns.forEach(function(btn) {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      });
      pages.forEach(function(page) {
        page.classList.remove('active');
        page.setAttribute('hidden', '');
      });

      var targetBtn = navBtns.find(function(btn) {
        return btn.getAttribute('data-page') === pageId;
      });
      var targetPage = $('#page-' + pageId);

      if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-current', 'page');
      }
      if (targetPage) {
        targetPage.classList.add('active');
        targetPage.removeAttribute('hidden');
      }

      var pageName = targetBtn ? targetBtn.querySelector('span').textContent : pageId;
      announce('Navigated to ' + pageName);

      // Close mobile sidebar on navigation
      var sidebar = $('.sidebar');
      var mobileToggle = $('#mobile-nav-toggle');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      }
    }

    navBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pageId = btn.getAttribute('data-page');
        if (pageId) navigateTo(pageId);
      });
    });

    // Dashboard card navigation
    $$('.dashboard-card[data-goto]').forEach(function(card) {
      card.addEventListener('click', function() {
        var pageId = card.getAttribute('data-goto');
        if (pageId) navigateTo(pageId);
      });
    });
  }

  // ============================================================
  // 2. Theme Toggle
  // ============================================================
  function initTheme() {
    var toggle = $('#theme-toggle');
    var savedTheme = localStorage.getItem('ada-toolkit-theme');

    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (toggle) {
      toggle.addEventListener('click', function() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('ada-toolkit-theme', 'light');
          announce('Dark mode disabled');
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('ada-toolkit-theme', 'dark');
          announce('Dark mode enabled');
        }
      });
    }
  }

  // ============================================================
  // 3. Mobile Navigation
  // ============================================================
  function initMobileNav() {
    var toggle = $('#mobile-nav-toggle');
    var sidebar = $('.sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', function() {
      var isOpen = sidebar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== toggle &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ============================================================
  // 4. Color Contrast Checker
  // ============================================================
  function initContrastChecker() {
    var fgInput = $('#fg-color');
    var bgInput = $('#bg-color');
    var fgPicker = $('#fg-color-picker');
    var bgPicker = $('#bg-color-picker');
    var swapBtn = $('#swap-colors');
    var ratioDisplay = $('#contrast-ratio');
    var preview = $('#contrast-preview');
    var suggestionsSection = $('#color-suggestions');
    var suggestionList = $('#suggestion-list');

    if (!fgInput || !bgInput) return;

    function updateContrast() {
      var fg = parseColor(fgInput.value);
      var bg = parseColor(bgInput.value);

      if (!fg || !bg) return;

      var fgHex = rgbToHex(fg.r, fg.g, fg.b);
      var bgHex = rgbToHex(bg.r, bg.g, bg.b);

      // Sync pickers
      if (fgPicker) fgPicker.value = fgHex;
      if (bgPicker) bgPicker.value = bgHex;

      var fgLum = relativeLuminance(fg.r, fg.g, fg.b);
      var bgLum = relativeLuminance(bg.r, bg.g, bg.b);
      var ratio = contrastRatio(fgLum, bgLum);

      // Update ratio display
      if (ratioDisplay) {
        ratioDisplay.textContent = ratio.toFixed(2) + ':1';
      }

      // Update preview
      if (preview) {
        preview.style.color = fgHex;
        preview.style.backgroundColor = bgHex;
      }

      // Update compliance badges
      updateBadge('#aa-normal', ratio >= 4.5);
      updateBadge('#aa-large', ratio >= 3);
      updateBadge('#aaa-normal', ratio >= 7);
      updateBadge('#aaa-large', ratio >= 4.5);

      // Color suggestions
      if (ratio < 4.5 && suggestionsSection && suggestionList) {
        suggestionsSection.removeAttribute('hidden');
        generateSuggestions(fg, bg, suggestionList);
      } else if (suggestionsSection) {
        suggestionsSection.setAttribute('hidden', '');
      }
    }

    function updateBadge(selector, pass) {
      var item = $(selector);
      if (!item) return;
      var badge = $('.compliance-badge', item);
      if (!badge) return;
      badge.className = 'compliance-badge ' + (pass ? 'pass' : 'fail');
      badge.textContent = pass ? 'PASS' : 'FAIL';
    }

    function generateSuggestions(fg, bg, container) {
      container.innerHTML = '';
      var bgLum = relativeLuminance(bg.r, bg.g, bg.b);
      var suggestions = [];

      // Try darkening
      for (var i = 1; i <= 20; i++) {
        var factor = 1 - (i * 0.05);
        var nr = Math.round(fg.r * factor);
        var ng = Math.round(fg.g * factor);
        var nb = Math.round(fg.b * factor);
        var lum = relativeLuminance(nr, ng, nb);
        var ratio = contrastRatio(lum, bgLum);
        if (ratio >= 4.5) {
          suggestions.push({ r: nr, g: ng, b: nb, ratio: ratio });
          break;
        }
      }

      // Try lightening
      for (var i = 1; i <= 20; i++) {
        var factor = i * 0.05;
        var nr = Math.round(fg.r + (255 - fg.r) * factor);
        var ng = Math.round(fg.g + (255 - fg.g) * factor);
        var nb = Math.round(fg.b + (255 - fg.b) * factor);
        var lum = relativeLuminance(nr, ng, nb);
        var ratio = contrastRatio(lum, bgLum);
        if (ratio >= 4.5) {
          suggestions.push({ r: nr, g: ng, b: nb, ratio: ratio });
          break;
        }
      }

      // Generate intermediate variations
      for (var angle = 0; angle < 360; angle += 60) {
        if (suggestions.length >= 5) break;
        var rad = angle * Math.PI / 180;
        for (var step = 1; step <= 20; step++) {
          var shift = step * 8;
          var nr = Math.max(0, Math.min(255, Math.round(fg.r + Math.cos(rad) * shift)));
          var ng = Math.max(0, Math.min(255, Math.round(fg.g + Math.sin(rad) * shift)));
          var nb = Math.max(0, Math.min(255, Math.round(fg.b + Math.cos(rad + 2) * shift)));
          var lum = relativeLuminance(nr, ng, nb);
          var ratio = contrastRatio(lum, bgLum);
          if (ratio >= 4.5) {
            var hex = rgbToHex(nr, ng, nb);
            var isDuplicate = suggestions.some(function(s) {
              return rgbToHex(s.r, s.g, s.b) === hex;
            });
            if (!isDuplicate) {
              suggestions.push({ r: nr, g: ng, b: nb, ratio: ratio });
            }
            break;
          }
        }
      }

      suggestions.slice(0, 5).forEach(function(s) {
        var hex = rgbToHex(s.r, s.g, s.b);
        var item = document.createElement('button');
        item.className = 'suggestion-item';
        item.setAttribute('type', 'button');
        item.setAttribute('aria-label', 'Apply suggested color ' + hex);
        item.innerHTML =
          '<span class="suggestion-swatch" style="background-color:' + hex + '"></span>' +
          '<span class="suggestion-hex">' + hex + '</span>' +
          '<span class="suggestion-ratio">' + s.ratio.toFixed(2) + ':1</span>';
        item.addEventListener('click', function() {
          fgInput.value = hex;
          if (fgPicker) fgPicker.value = hex;
          updateContrast();
        });
        container.appendChild(item);
      });
    }

    // Event listeners
    fgInput.addEventListener('input', updateContrast);
    bgInput.addEventListener('input', updateContrast);

    if (fgPicker) {
      fgPicker.addEventListener('input', function() {
        fgInput.value = fgPicker.value;
        updateContrast();
      });
    }
    if (bgPicker) {
      bgPicker.addEventListener('input', function() {
        bgInput.value = bgPicker.value;
        updateContrast();
      });
    }

    if (swapBtn) {
      swapBtn.addEventListener('click', function() {
        var tmp = fgInput.value;
        fgInput.value = bgInput.value;
        bgInput.value = tmp;
        updateContrast();
      });
    }

    // Initial calculation
    updateContrast();
  }

  // ============================================================
  // 5. HTML Accessibility Validator
  // ============================================================
  function initValidator() {
    var validateBtn = $('#validate-btn');
    var clearBtn = $('#clear-html-btn');
    var loadSampleBtn = $('#load-sample-btn');
    var textarea = $('#html-input');
    var resultsList = $('#results-list');
    var resultsSummary = $('#results-summary');
    var errorCount = $('#error-count');
    var warningCount = $('#warning-count');
    var infoCount = $('#info-count');

    if (!validateBtn || !textarea) return;

    var sampleHTML = '<html>\n<head><title></title></head>\n<body>\n  <img src="photo.jpg">\n  <h1>Welcome</h1>\n  <h3>About Us</h3>\n  <input type="text">\n  <a href="/page"></a>\n  <div onclick="doSomething()">Click me</div>\n  <table><tr><td>Data</td></tr></table>\n  <a href="https://example.com" target="_blank">External Link</a>\n  <video autoplay src="video.mp4"></video>\n</body>\n</html>';

    function runValidation(html) {
      var issues = [];
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');

      // 1. Images missing alt
      $$('img', doc).forEach(function(img) {
        if (!img.hasAttribute('alt')) {
          issues.push({
            severity: 'error',
            message: 'Image missing alt attribute',
            element: '<img src="' + (img.getAttribute('src') || '') + '">'
          });
        }
      });

      // 2. Form controls missing labels
      $$('input, select, textarea', doc).forEach(function(ctrl) {
        if (ctrl.type === 'hidden') return;
        var hasLabel = ctrl.hasAttribute('aria-label') ||
                       ctrl.hasAttribute('aria-labelledby') ||
                       ctrl.hasAttribute('title');
        if (!hasLabel && ctrl.id) {
          hasLabel = !!$('label[for="' + ctrl.id + '"]', doc);
        }
        if (!hasLabel) {
          // Check parent label
          var parent = ctrl.closest('label');
          if (parent) hasLabel = true;
        }
        if (!hasLabel) {
          var tag = ctrl.tagName.toLowerCase();
          var type = ctrl.getAttribute('type');
          var desc = '<' + tag + (type ? ' type="' + type + '"' : '') + '>';
          issues.push({
            severity: 'error',
            message: 'Form control missing label',
            element: desc
          });
        }
      });

      // 3. Heading level skips
      var headings = $$('h1, h2, h3, h4, h5, h6', doc);
      for (var i = 1; i < headings.length; i++) {
        var prev = parseInt(headings[i - 1].tagName.substring(1), 10);
        var curr = parseInt(headings[i].tagName.substring(1), 10);
        if (curr > prev + 1) {
          issues.push({
            severity: 'warning',
            message: 'Heading level skipped (h' + prev + ' to h' + curr + ')',
            element: '<' + headings[i].tagName.toLowerCase() + '>'
          });
        }
      }

      // 4. Missing lang attribute on html
      var htmlEl = $('html', doc);
      if (htmlEl && !htmlEl.getAttribute('lang')) {
        issues.push({
          severity: 'warning',
          message: 'Document missing lang attribute',
          element: '<html>'
        });
      }

      // 5. Empty links
      $$('a', doc).forEach(function(a) {
        var text = (a.textContent || '').trim();
        var ariaLabel = a.getAttribute('aria-label') || '';
        var ariaLabelledBy = a.getAttribute('aria-labelledby') || '';
        var imgAlt = a.querySelector('img[alt]');
        if (!text && !ariaLabel && !ariaLabelledBy && !imgAlt) {
          issues.push({
            severity: 'error',
            message: 'Empty link — no accessible text',
            element: '<a href="' + (a.getAttribute('href') || '') + '">'
          });
        }
      });

      // 6. Clickable div/span without keyboard access
      $$('div[onclick], span[onclick]', doc).forEach(function(el) {
        var hasRole = el.getAttribute('role') === 'button';
        var hasTabindex = el.hasAttribute('tabindex');
        if (!hasRole && !hasTabindex) {
          issues.push({
            severity: 'warning',
            message: 'Clickable element not keyboard accessible',
            element: '<' + el.tagName.toLowerCase() + ' onclick="...">'
          });
        }
      });

      // 7. Missing or empty title
      var titleEl = $('title', doc);
      if (!titleEl || !(titleEl.textContent || '').trim()) {
        issues.push({
          severity: 'warning',
          message: 'Document missing or empty title',
          element: '<title>'
        });
      }

      // 8. Tables without caption or aria-label
      $$('table', doc).forEach(function(table) {
        var caption = $('caption', table);
        var ariaLabel = table.getAttribute('aria-label');
        var ariaLabelledBy = table.getAttribute('aria-labelledby');
        if (!caption && !ariaLabel && !ariaLabelledBy) {
          issues.push({
            severity: 'info',
            message: 'Table missing caption or aria-label',
            element: '<table>'
          });
        }
      });

      // 9. Auto-playing media
      $$('video[autoplay], audio[autoplay]', doc).forEach(function(media) {
        issues.push({
          severity: 'warning',
          message: 'Auto-playing media detected',
          element: '<' + media.tagName.toLowerCase() + ' autoplay>'
        });
      });

      // 10. Missing main landmark
      if (!$('main', doc) && !$('[role="main"]', doc)) {
        issues.push({
          severity: 'info',
          message: 'No main landmark found',
          element: '(document)'
        });
      }

      // 11. Links opening new window without warning
      $$('a[target="_blank"]', doc).forEach(function(a) {
        var text = (a.textContent || '').toLowerCase();
        var ariaLabel = (a.getAttribute('aria-label') || '').toLowerCase();
        var hasWarning = text.indexOf('new window') !== -1 ||
                         text.indexOf('new tab') !== -1 ||
                         text.indexOf('opens in') !== -1 ||
                         ariaLabel.indexOf('new window') !== -1 ||
                         ariaLabel.indexOf('new tab') !== -1;
        if (!hasWarning) {
          issues.push({
            severity: 'info',
            message: 'Link opens in new window without warning',
            element: '<a target="_blank" href="' + (a.getAttribute('href') || '') + '">'
          });
        }
      });

      return issues;
    }

    function renderResults(issues) {
      resultsList.innerHTML = '';

      var errors = issues.filter(function(i) { return i.severity === 'error'; }).length;
      var warnings = issues.filter(function(i) { return i.severity === 'warning'; }).length;
      var infos = issues.filter(function(i) { return i.severity === 'info'; }).length;

      if (resultsSummary) {
        resultsSummary.removeAttribute('hidden');
      }
      if (errorCount) errorCount.textContent = errors;
      if (warningCount) warningCount.textContent = warnings;
      if (infoCount) infoCount.textContent = infos;

      if (issues.length === 0) {
        var successEl = document.createElement('div');
        successEl.className = 'result-item result-item--info';
        successEl.innerHTML = '<span class="result-severity">&#10003;</span>' +
          '<span class="result-message">No accessibility issues found. Great work!</span>';
        resultsList.appendChild(successEl);
        announce('Validation complete: no issues found');
        return;
      }

      issues.forEach(function(issue) {
        var item = document.createElement('div');
        item.className = 'result-item result-item--' + issue.severity;
        item.innerHTML =
          '<span class="result-severity">' + issue.severity.toUpperCase() + '</span>' +
          '<span class="result-message">' + escapeHtml(issue.message) + '</span>' +
          '<code class="result-element">' + escapeHtml(issue.element) + '</code>';
        resultsList.appendChild(item);
      });

      announce('Validation complete: ' + errors + ' errors, ' + warnings + ' warnings, ' + infos + ' info');
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    validateBtn.addEventListener('click', function() {
      var html = textarea.value.trim();
      if (!html) {
        resultsList.innerHTML = '<p class="results-placeholder">Please enter HTML to validate.</p>';
        if (resultsSummary) resultsSummary.setAttribute('hidden', '');
        return;
      }
      var issues = runValidation(html);
      renderResults(issues);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        textarea.value = '';
        resultsList.innerHTML = '<p class="results-placeholder">Results will appear here after validation.</p>';
        if (resultsSummary) resultsSummary.setAttribute('hidden', '');
      });
    }

    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', function() {
        textarea.value = sampleHTML;
        announce('Sample HTML loaded');
      });
    }
  }

  // ============================================================
  // 6. WCAG 2.1 Checklist
  // ============================================================
  var WCAG_CRITERIA = [
    // Perceivable
    { id: '1.1.1', title: 'Non-text Content', level: 'A', principle: 'Perceivable', description: 'All non-text content has a text alternative that serves the equivalent purpose.' },
    { id: '1.2.1', title: 'Audio-only and Video-only (Prerecorded)', level: 'A', principle: 'Perceivable', description: 'Alternatives are provided for prerecorded audio-only and video-only media.' },
    { id: '1.2.2', title: 'Captions (Prerecorded)', level: 'A', principle: 'Perceivable', description: 'Captions are provided for all prerecorded audio content in synchronized media.' },
    { id: '1.2.3', title: 'Audio Description or Media Alternative', level: 'A', principle: 'Perceivable', description: 'An alternative for time-based media or audio description of prerecorded video content is provided.' },
    { id: '1.2.4', title: 'Captions (Live)', level: 'AA', principle: 'Perceivable', description: 'Captions are provided for all live audio content in synchronized media.' },
    { id: '1.2.5', title: 'Audio Description (Prerecorded)', level: 'AA', principle: 'Perceivable', description: 'Audio description is provided for all prerecorded video content in synchronized media.' },
    { id: '1.3.1', title: 'Info and Relationships', level: 'A', principle: 'Perceivable', description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.' },
    { id: '1.3.2', title: 'Meaningful Sequence', level: 'A', principle: 'Perceivable', description: 'When the sequence of content affects its meaning, a correct reading sequence can be programmatically determined.' },
    { id: '1.3.3', title: 'Sensory Characteristics', level: 'A', principle: 'Perceivable', description: 'Instructions do not rely solely on sensory characteristics such as shape, color, size, visual location, orientation, or sound.' },
    { id: '1.3.4', title: 'Orientation', level: 'AA', principle: 'Perceivable', description: 'Content does not restrict its view and operation to a single display orientation unless essential.' },
    { id: '1.3.5', title: 'Identify Input Purpose', level: 'AA', principle: 'Perceivable', description: 'The purpose of each input field collecting user information can be programmatically determined.' },
    { id: '1.4.1', title: 'Use of Color', level: 'A', principle: 'Perceivable', description: 'Color is not used as the only visual means of conveying information or distinguishing elements.' },
    { id: '1.4.2', title: 'Audio Control', level: 'A', principle: 'Perceivable', description: 'If audio plays automatically for more than 3 seconds, a mechanism is available to pause, stop, or control volume.' },
    { id: '1.4.3', title: 'Contrast (Minimum)', level: 'AA', principle: 'Perceivable', description: 'Text and images of text have a contrast ratio of at least 4.5:1 (3:1 for large text).' },
    { id: '1.4.4', title: 'Resize Text', level: 'AA', principle: 'Perceivable', description: 'Text can be resized up to 200% without loss of content or functionality.' },
    { id: '1.4.5', title: 'Images of Text', level: 'AA', principle: 'Perceivable', description: 'If technologies can achieve the visual presentation, text is used rather than images of text.' },
    { id: '1.4.10', title: 'Reflow', level: 'AA', principle: 'Perceivable', description: 'Content can be presented without loss of information at 320 CSS pixels wide without horizontal scrolling.' },
    { id: '1.4.11', title: 'Non-text Contrast', level: 'AA', principle: 'Perceivable', description: 'Visual presentation of UI components and graphical objects have a contrast ratio of at least 3:1.' },
    { id: '1.4.12', title: 'Text Spacing', level: 'AA', principle: 'Perceivable', description: 'No loss of content or functionality when adjusting line height, paragraph, letter, and word spacing.' },
    { id: '1.4.13', title: 'Content on Hover or Focus', level: 'AA', principle: 'Perceivable', description: 'Additional content triggered by hover or focus is dismissible, hoverable, and persistent.' },

    // Operable
    { id: '2.1.1', title: 'Keyboard', level: 'A', principle: 'Operable', description: 'All functionality is operable through a keyboard interface without requiring specific timings.' },
    { id: '2.1.2', title: 'No Keyboard Trap', level: 'A', principle: 'Operable', description: 'If keyboard focus can be moved to a component, focus can be moved away using only a keyboard.' },
    { id: '2.1.4', title: 'Character Key Shortcuts', level: 'A', principle: 'Operable', description: 'If character key shortcuts exist, they can be turned off, remapped, or are only active on focus.' },
    { id: '2.2.1', title: 'Timing Adjustable', level: 'A', principle: 'Operable', description: 'Users can turn off, adjust, or extend time limits set by the content.' },
    { id: '2.2.2', title: 'Pause, Stop, Hide', level: 'A', principle: 'Operable', description: 'Moving, blinking, scrolling, or auto-updating content can be paused, stopped, or hidden.' },
    { id: '2.3.1', title: 'Three Flashes or Below Threshold', level: 'A', principle: 'Operable', description: 'Content does not contain anything that flashes more than three times in one second.' },
    { id: '2.4.1', title: 'Bypass Blocks', level: 'A', principle: 'Operable', description: 'A mechanism is available to bypass blocks of content that are repeated on multiple pages.' },
    { id: '2.4.2', title: 'Page Titled', level: 'A', principle: 'Operable', description: 'Web pages have titles that describe topic or purpose.' },
    { id: '2.4.3', title: 'Focus Order', level: 'A', principle: 'Operable', description: 'Focusable components receive focus in an order that preserves meaning and operability.' },
    { id: '2.4.4', title: 'Link Purpose (In Context)', level: 'A', principle: 'Operable', description: 'The purpose of each link can be determined from the link text alone or its context.' },
    { id: '2.4.5', title: 'Multiple Ways', level: 'AA', principle: 'Operable', description: 'More than one way is available to locate a page within a set of pages.' },
    { id: '2.4.6', title: 'Headings and Labels', level: 'AA', principle: 'Operable', description: 'Headings and labels describe topic or purpose.' },
    { id: '2.4.7', title: 'Focus Visible', level: 'AA', principle: 'Operable', description: 'Any keyboard operable user interface has a mode of operation where the focus indicator is visible.' },

    // Understandable
    { id: '3.1.1', title: 'Language of Page', level: 'A', principle: 'Understandable', description: 'The default human language of each web page can be programmatically determined.' },
    { id: '3.1.2', title: 'Language of Parts', level: 'AA', principle: 'Understandable', description: 'The language of each passage or phrase can be programmatically determined.' },
    { id: '3.2.1', title: 'On Focus', level: 'A', principle: 'Understandable', description: 'Receiving focus does not initiate a change of context.' },
    { id: '3.2.2', title: 'On Input', level: 'A', principle: 'Understandable', description: 'Changing the setting of a user interface component does not cause a change of context unless advised.' },
    { id: '3.2.3', title: 'Consistent Navigation', level: 'AA', principle: 'Understandable', description: 'Navigation mechanisms repeated on multiple pages occur in the same relative order each time.' },
    { id: '3.2.4', title: 'Consistent Identification', level: 'AA', principle: 'Understandable', description: 'Components with the same functionality are identified consistently within a set of pages.' },
    { id: '3.3.1', title: 'Error Identification', level: 'A', principle: 'Understandable', description: 'If an input error is detected, the item in error is identified and described to the user in text.' },
    { id: '3.3.2', title: 'Labels or Instructions', level: 'A', principle: 'Understandable', description: 'Labels or instructions are provided when content requires user input.' },
    { id: '3.3.3', title: 'Error Suggestion', level: 'AA', principle: 'Understandable', description: 'If an input error is detected and suggestions are known, they are provided to the user.' },
    { id: '3.3.4', title: 'Error Prevention (Legal, Financial, Data)', level: 'AA', principle: 'Understandable', description: 'For pages with legal commitments or financial transactions, submissions are reversible, checked, or confirmed.' },

    // Robust
    { id: '4.1.1', title: 'Parsing', level: 'A', principle: 'Robust', description: 'In content using markup languages, elements have complete start/end tags, are nested properly, and have unique IDs.' },
    { id: '4.1.2', title: 'Name, Role, Value', level: 'A', principle: 'Robust', description: 'For all UI components, name and role can be programmatically determined; states and values can be programmatically set.' },
    { id: '4.1.3', title: 'Status Messages', level: 'AA', principle: 'Robust', description: 'Status messages can be programmatically determined through role or properties so they are presented by assistive technologies without receiving focus.' }
  ];

  function initChecklist() {
    var container = $('#checklist-container');
    var progressFill = $('#progress-fill');
    var progressText = $('#progress-text');
    var levelFilter = $('#level-filter');
    var statusFilter = $('#status-filter');
    var resetBtn = $('#reset-checklist');

    if (!container) return;

    var STORAGE_KEY = 'ada-toolkit-checklist';
    var checkedState = {};

    // Load saved state
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) checkedState = JSON.parse(saved);
    } catch (e) {
      checkedState = {};
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
      } catch (e) { /* ignore */ }
    }

    function updateProgress() {
      var total = WCAG_CRITERIA.length;
      var checked = Object.keys(checkedState).filter(function(k) { return checkedState[k]; }).length;
      var pct = total > 0 ? Math.round((checked / total) * 100) : 0;

      if (progressFill) progressFill.style.width = pct + '%';
      if (progressText) progressText.textContent = checked + ' / ' + total + ' completed (' + pct + '%)';

      var progressBar = $('.checklist-progress');
      if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
    }

    function renderChecklist() {
      container.innerHTML = '';

      var principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
      var levelVal = levelFilter ? levelFilter.value : 'all';
      var statusVal = statusFilter ? statusFilter.value : 'all';

      principles.forEach(function(principle) {
        var items = WCAG_CRITERIA.filter(function(c) {
          if (c.principle !== principle) return false;
          if (levelVal !== 'all' && c.level !== levelVal) return false;
          if (statusVal === 'checked' && !checkedState[c.id]) return false;
          if (statusVal === 'unchecked' && checkedState[c.id]) return false;
          return true;
        });

        if (items.length === 0) return;

        var group = document.createElement('div');
        group.className = 'checklist-group';

        var title = document.createElement('h3');
        title.className = 'checklist-group-title';
        title.textContent = principle;
        group.appendChild(title);

        items.forEach(function(criterion) {
          var item = document.createElement('div');
          item.className = 'checklist-item';

          var label = document.createElement('label');
          label.className = 'checklist-label';

          var checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'checklist-checkbox';
          checkbox.checked = !!checkedState[criterion.id];
          checkbox.setAttribute('aria-label', criterion.id + ' ' + criterion.title);

          checkbox.addEventListener('change', function() {
            checkedState[criterion.id] = checkbox.checked;
            saveState();
            updateProgress();
          });

          var idSpan = document.createElement('span');
          idSpan.className = 'checklist-id';
          idSpan.textContent = criterion.id;

          var titleSpan = document.createElement('span');
          titleSpan.className = 'checklist-title';
          titleSpan.textContent = criterion.title;

          var levelSpan = document.createElement('span');
          levelSpan.className = 'checklist-level';
          levelSpan.textContent = 'Level ' + criterion.level;

          label.appendChild(checkbox);
          label.appendChild(idSpan);
          label.appendChild(titleSpan);
          label.appendChild(levelSpan);
          item.appendChild(label);

          var desc = document.createElement('p');
          desc.className = 'checklist-desc';
          desc.textContent = criterion.description;
          item.appendChild(desc);

          group.appendChild(item);
        });

        container.appendChild(group);
      });
    }

    // Filters
    if (levelFilter) {
      levelFilter.addEventListener('change', function() {
        renderChecklist();
        announce('Filtered by level: ' + levelFilter.value);
      });
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', function() {
        renderChecklist();
        announce('Filtered by status: ' + statusFilter.value);
      });
    }

    // Reset
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        checkedState = {};
        saveState();
        renderChecklist();
        updateProgress();
        announce('Checklist reset');
      });
    }

    renderChecklist();
    updateProgress();
  }

  // ============================================================
  // 7. Typography Checker
  // ============================================================
  function initTypography() {
    var fontSizeInput = $('#typo-font-size');
    var lineHeightInput = $('#typo-line-height');
    var letterSpacingInput = $('#typo-letter-spacing');
    var wordSpacingInput = $('#typo-word-spacing');
    var paragraphSpacingInput = $('#typo-paragraph-spacing');
    var fontFamilyInput = $('#typo-font-family');
    var maxWidthInput = $('#typo-max-width');
    var preview = $('#typo-preview');
    var compliance = $('#typo-compliance');

    if (!fontSizeInput || !preview || !compliance) return;

    function getValues() {
      return {
        fontSize: parseFloat(fontSizeInput.value) || 16,
        lineHeight: parseFloat(lineHeightInput.value) || 1.5,
        letterSpacing: parseFloat(letterSpacingInput.value) || 0,
        wordSpacing: parseFloat(wordSpacingInput.value) || 0,
        paragraphSpacing: parseFloat(paragraphSpacingInput.value) || 1.5,
        fontFamily: fontFamilyInput ? fontFamilyInput.value : 'system-ui, sans-serif',
        maxWidth: parseFloat(maxWidthInput.value) || 80
      };
    }

    function updatePreview() {
      var v = getValues();

      preview.style.fontSize = v.fontSize + 'px';
      preview.style.lineHeight = String(v.lineHeight);
      preview.style.letterSpacing = v.letterSpacing + 'em';
      preview.style.wordSpacing = v.wordSpacing + 'em';
      preview.style.fontFamily = v.fontFamily;
      preview.style.maxWidth = v.maxWidth + 'ch';

      // Set paragraph spacing on child p elements
      $$('p', preview).forEach(function(p) {
        p.style.marginBottom = v.paragraphSpacing + 'em';
      });
    }

    function updateCompliance() {
      var v = getValues();
      compliance.innerHTML = '';

      var checks = [
        {
          label: 'Font Size',
          pass: v.fontSize >= 16,
          value: v.fontSize + 'px'
        },
        {
          label: 'Line Height (\u2265 1.5)',
          pass: v.lineHeight >= 1.5,
          value: String(v.lineHeight)
        },
        {
          label: 'Letter Spacing (\u2265 0.12em)',
          pass: v.letterSpacing >= 0.12,
          value: v.letterSpacing + 'em'
        },
        {
          label: 'Word Spacing (\u2265 0.16em)',
          pass: v.wordSpacing >= 0.16,
          value: v.wordSpacing + 'em'
        },
        {
          label: 'Paragraph Spacing (\u2265 2\u00d7 font size)',
          pass: v.paragraphSpacing >= 2,
          value: v.paragraphSpacing + 'em'
        },
        {
          label: 'Line Width (\u2264 80ch)',
          pass: v.maxWidth <= 80,
          value: v.maxWidth + 'ch'
        }
      ];

      var passCount = 0;
      checks.forEach(function(check) {
        if (check.pass) passCount++;

        var el = document.createElement('div');
        el.className = 'typo-check ' + (check.pass ? 'typo-check--pass' : 'typo-check--fail');

        var icon = document.createElement('span');
        icon.className = 'typo-check-icon';
        icon.textContent = check.pass ? '\u2713' : '\u2717';

        var label = document.createElement('span');
        label.className = 'typo-check-label';
        label.textContent = check.label;

        var value = document.createElement('span');
        value.className = 'typo-check-value';
        value.textContent = check.value;

        el.appendChild(icon);
        el.appendChild(label);
        el.appendChild(value);
        compliance.appendChild(el);
      });

      announce(passCount + ' of ' + checks.length + ' typography checks passing');
    }

    function update() {
      updatePreview();
      updateCompliance();
    }

    // Attach event listeners
    var inputs = [fontSizeInput, lineHeightInput, letterSpacingInput, wordSpacingInput, paragraphSpacingInput, maxWidthInput];
    inputs.forEach(function(input) {
      if (input) input.addEventListener('input', update);
    });

    if (fontFamilyInput) {
      fontFamilyInput.addEventListener('change', update);
    }

    // Initial render
    update();
  }

  // ============================================================
  // 8. PDF Accessibility Analyzer
  // ============================================================
  function initFileAnalyzer() {
    var dropZone = $('#analyzer-drop-zone');
    var fileInput = $('#analyzer-file-input');
    var fileInfo = $('#analyzer-file-info');
    var fileName = $('#analyzer-file-name');
    var fileMeta = $('#analyzer-file-meta');
    var removeBtn = $('#analyzer-remove-btn');
    var analyzeBtn = $('#analyzer-analyze-btn');
    var loading = $('#analyzer-loading');
    var loadingText = $('#analyzer-loading-text');
    var results = $('#analyzer-results');
    var resultsSummary = $('#analyzer-results-summary');
    var errorCountEl = $('#analyzer-error-count');
    var warningCountEl = $('#analyzer-warning-count');
    var infoCountEl = $('#analyzer-info-count');
    var resultsList = $('#analyzer-results-list');
    var generateSection = $('#analyzer-generate-section');
    var generateBtn = $('#analyzer-generate-btn');
    var generateLoading = $('#analyzer-generate-loading');
    var previewSection = $('#analyzer-preview-section');
    var renderedTab = $('#analyzer-tab-rendered');
    var sourceTab = $('#analyzer-tab-source');
    var previewIframe = $('#analyzer-preview-iframe');
    var sourceView = $('#analyzer-source-view');
    var previewSource = $('#analyzer-preview-source');
    var downloadBtn = $('#analyzer-download-btn');
    var copyBtn = $('#analyzer-copy-btn');

    if (!dropZone) return;

    // State
    var extractedText = '';
    var currentFilename = '';
    var currentIssues = [];
    var generatedHtml = '';

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function extractPdfText(arrayBuffer) {
      return pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdf) {
        var fullText = '';
        var pageCount = pdf.numPages;
        var chain = Promise.resolve();
        for (var i = 1; i <= pageCount; i++) {
          (function(pageNum) {
            chain = chain.then(function() {
              return pdf.getPage(pageNum).then(function(page) {
                return page.getTextContent().then(function(content) {
                  var pageText = content.items.map(function(item) { return item.str; }).join(' ');
                  fullText += pageText + '\n';
                });
              });
            });
          })(i);
        }
        return chain.then(function() {
          return { text: fullText.trim(), pageCount: pageCount };
        });
      });
    }

    function resetState() {
      extractedText = '';
      currentFilename = '';
      currentIssues = [];
      generatedHtml = '';
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (fileInfo) fileInfo.setAttribute('hidden', '');
      if (results) results.setAttribute('hidden', '');
      if (generateSection) generateSection.setAttribute('hidden', '');
      if (previewSection) previewSection.setAttribute('hidden', '');
      if (dropZone) dropZone.removeAttribute('hidden');
    }

    function handleFile(file) {
      if (file.type !== 'application/pdf') {
        announce('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        announce('File too large. Maximum size is 10MB.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        extractPdfText(e.target.result).then(function(result) {
          if (result.text.length < 50) {
            announce('Warning: This appears to be a scanned PDF with little extractable text. Analysis may be limited.');
          }

          if (fileName) fileName.textContent = file.name;
          if (fileMeta) fileMeta.textContent = formatFileSize(file.size) + ' \u2022 ' + result.pageCount + ' page' + (result.pageCount !== 1 ? 's' : '');
          if (fileInfo) fileInfo.removeAttribute('hidden');
          if (dropZone) dropZone.setAttribute('hidden', '');

          extractedText = result.text;
          currentFilename = file.name;

          if (analyzeBtn) analyzeBtn.disabled = false;
          announce('File loaded: ' + file.name);
        }).catch(function() {
          announce('Failed to read PDF file. Please try another file.');
        });
      };
      reader.readAsArrayBuffer(file);
    }

    // Drop zone handlers
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      var file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    dropZone.addEventListener('click', function() {
      if (fileInput) fileInput.click();
    });

    dropZone.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', function() {
        if (fileInput.files[0]) handleFile(fileInput.files[0]);
      });
    }

    // Remove button
    if (removeBtn) {
      removeBtn.addEventListener('click', function() {
        resetState();
        if (dropZone) dropZone.removeAttribute('hidden');
        if (fileInput) fileInput.value = '';
        announce('File removed');
      });
    }

    // Analyze button
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', function() {
        analyzeBtn.disabled = true;
        if (loading) loading.removeAttribute('hidden');
        if (loadingText) loadingText.textContent = 'Analyzing document for accessibility issues...';
        if (results) results.setAttribute('hidden', '');
        if (generateSection) generateSection.setAttribute('hidden', '');
        if (previewSection) previewSection.setAttribute('hidden', '');

        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractedText, filename: currentFilename })
        })
        .then(function(response) {
          if (!response.ok) throw new Error('Analysis request failed');
          return response.json();
        })
        .then(function(data) {
          if (!data.success) throw new Error(data.error || 'Analysis failed');

          currentIssues = (data.analysis && data.analysis.issues) || [];

          var errorCount = 0;
          var warningCount = 0;
          var infoCount = 0;
          currentIssues.forEach(function(issue) {
            if (issue.severity === 'error') errorCount++;
            else if (issue.severity === 'warning') warningCount++;
            else if (issue.severity === 'info') infoCount++;
          });

          if (errorCountEl) errorCountEl.textContent = errorCount;
          if (warningCountEl) warningCountEl.textContent = warningCount;
          if (infoCountEl) infoCountEl.textContent = infoCount;
          if (resultsSummary) resultsSummary.removeAttribute('hidden');

          if (resultsList) {
            resultsList.innerHTML = '';
            if (currentIssues.length === 0) {
              var successEl = document.createElement('div');
              successEl.className = 'result-item result-item--info';
              successEl.innerHTML = '<span class="result-severity">&#10003;</span>' +
                '<span class="result-message">No accessibility issues found.</span>';
              resultsList.appendChild(successEl);
            } else {
              currentIssues.forEach(function(issue) {
                var item = document.createElement('div');
                item.className = 'result-item result-item--' + issue.severity;

                var html = '<span class="result-severity">' + escapeHtml(issue.severity.toUpperCase()) + '</span>';
                if (issue.wcagCriteria) {
                  html += '<code class="result-wcag">' + escapeHtml(issue.wcagCriteria) + '</code>';
                }
                html += '<strong class="result-title">' + escapeHtml(issue.title || '') + '</strong>';
                html += '<p class="result-description">' + escapeHtml(issue.description || '') + '</p>';
                if (issue.location) {
                  html += '<span class="result-location">Location: ' + escapeHtml(issue.location) + '</span>';
                }
                if (issue.recommendation) {
                  html += '<p class="result-recommendation">Recommendation: ' + escapeHtml(issue.recommendation) + '</p>';
                }

                item.innerHTML = html;
                resultsList.appendChild(item);
              });
            }
          }

          if (results) results.removeAttribute('hidden');
          if (generateSection) generateSection.removeAttribute('hidden');
          announce('Analysis complete: ' + errorCount + ' errors, ' + warningCount + ' warnings');
        })
        .catch(function(err) {
          if (resultsList) {
            resultsList.innerHTML = '';
            var errorEl = document.createElement('div');
            errorEl.className = 'result-item result-item--error';
            errorEl.innerHTML = '<span class="result-severity">ERROR</span>' +
              '<span class="result-message">' + escapeHtml(err.message || 'Analysis failed. Please try again.') + '</span>';
            resultsList.appendChild(errorEl);
            if (results) results.removeAttribute('hidden');
          }
          announce('Analysis failed');
        })
        .then(function() {
          // finally equivalent
          if (loading) loading.setAttribute('hidden', '');
          analyzeBtn.disabled = false;
        });
      });
    }

    // Generate button
    if (generateBtn) {
      generateBtn.addEventListener('click', function() {
        generateBtn.disabled = true;
        if (generateLoading) generateLoading.removeAttribute('hidden');
        if (previewSection) previewSection.setAttribute('hidden', '');

        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractedText, issues: currentIssues, filename: currentFilename })
        })
        .then(function(response) {
          if (!response.ok) throw new Error('Generation request failed');
          return response.json();
        })
        .then(function(data) {
          if (!data.success) throw new Error(data.error || 'Generation failed');

          generatedHtml = data.html;
          if (previewIframe) previewIframe.srcdoc = generatedHtml;
          if (previewSource) previewSource.textContent = generatedHtml;
          if (previewSection) previewSection.removeAttribute('hidden');

          // Show rendered tab by default
          if (renderedTab) {
            renderedTab.classList.add('active');
            renderedTab.setAttribute('aria-pressed', 'true');
          }
          if (sourceTab) {
            sourceTab.classList.remove('active');
            sourceTab.setAttribute('aria-pressed', 'false');
          }
          if (previewIframe) previewIframe.removeAttribute('hidden');
          if (sourceView) sourceView.setAttribute('hidden', '');

          announce('Accessible HTML generated. Preview is available.');
        })
        .catch(function() {
          announce('Generation failed');
        })
        .then(function() {
          // finally equivalent
          if (generateLoading) generateLoading.setAttribute('hidden', '');
          generateBtn.disabled = false;
        });
      });
    }

    // Preview tabs
    if (renderedTab) {
      renderedTab.addEventListener('click', function() {
        renderedTab.classList.add('active');
        renderedTab.setAttribute('aria-pressed', 'true');
        if (sourceTab) {
          sourceTab.classList.remove('active');
          sourceTab.setAttribute('aria-pressed', 'false');
        }
        if (previewIframe) previewIframe.removeAttribute('hidden');
        if (sourceView) sourceView.setAttribute('hidden', '');
      });
    }

    if (sourceTab) {
      sourceTab.addEventListener('click', function() {
        sourceTab.classList.add('active');
        sourceTab.setAttribute('aria-pressed', 'true');
        if (renderedTab) {
          renderedTab.classList.remove('active');
          renderedTab.setAttribute('aria-pressed', 'false');
        }
        if (previewIframe) previewIframe.setAttribute('hidden', '');
        if (sourceView) sourceView.removeAttribute('hidden');
      });
    }

    // Download button
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        if (!generatedHtml) return;
        var blob = new Blob([generatedHtml], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = currentFilename.replace(/\.pdf$/i, '') + '-accessible.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        announce('File downloaded');
      });
    }

    // Copy button
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        if (!generatedHtml) return;
        navigator.clipboard.writeText(generatedHtml).then(function() {
          announce('HTML copied to clipboard');
        });
      });
    }
  }

  // ============================================================
  // Initialization
  // ============================================================
  document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initTheme();
    initMobileNav();
    initContrastChecker();
    initValidator();
    initChecklist();
    initTypography();
    initFileAnalyzer();
  });

})();
