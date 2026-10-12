(function () {
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var SHARE_TEXT = 'Hubbly is a family organiser, coming to Google Play in January. Join the waitlist:';

  function valid(code) {
    if (!code || code.length !== 8) return false;
    for (var i = 0; i < code.length; i++) {
      if (ALPHABET.indexOf(code.charAt(i)) === -1) return false;
    }
    return true;
  }

  function acceptableEmail(value) {
    var email = String(value || '').trim();
    if (email.normalize) email = email.normalize('NFC');
    if (!email || email.length > 254) return false;
    if (/\s/.test(email)) return false;
    var at = email.indexOf('@');
    if (at < 1 || at !== email.lastIndexOf('@')) return false;
    var local = email.slice(0, at);
    var domain = email.slice(at + 1);
    if (!local || local.length > 64 || !domain || domain.length > 253) return false;
    if (local.charAt(0) === '.' || local.charAt(local.length - 1) === '.' || local.indexOf('..') !== -1) return false;
    if (domain.charAt(0) === '.' || domain.charAt(domain.length - 1) === '.' || domain.indexOf('..') !== -1) return false;
    if (/[<>()[\]\\,;:"]/.test(email)) return false;
    var labels = domain.split('.');
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      if (!label || label.length > 63) return false;
      if (label.charAt(0) === '-' || label.charAt(label.length - 1) === '-') return false;
    }
    return true;
  }

  function randomCode() {
    var out = '';
    var limit = ALPHABET.length * Math.floor(256 / ALPHABET.length);
    while (out.length < 8) {
      var buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      for (var i = 0; i < buf.length && out.length < 8; i++) {
        if (buf[i] < limit) out += ALPHABET.charAt(buf[i] % ALPHABET.length);
      }
    }
    return out;
  }

  function queryValue(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      var found = '';
      params.forEach(function (value, key) {
        if (!found && key.toLowerCase() === name) found = value;
      });
      return found;
    } catch (e) {
      return '';
    }
  }

  function stripParam(name) {
    try {
      var url = new URL(window.location.href);
      var keys = [];
      url.searchParams.forEach(function (_, key) {
        if (key.toLowerCase() === name) keys.push(key);
      });
      if (!keys.length) return;
      keys.forEach(function (key) {
        url.searchParams.delete(key);
      });
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {
      /* leave the page usable if the URL cannot be parsed */
    }
  }

  function emit(name, detail) {
    var payload = { name: name };
    if (detail) {
      for (var key in detail) {
        if (Object.prototype.hasOwnProperty.call(detail, key)) payload[key] = detail[key];
      }
    }
    var capture = window.__hubblyCapture;
    if (typeof capture === 'function') capture(payload);
    else {
      window.__hubblyQueue = window.__hubblyQueue || [];
      window.__hubblyQueue.push(payload);
    }
  }

  var referred = document.getElementById('referred_by');
  if (referred) {
    try {
      var ref = queryValue('ref').toUpperCase();
      if (valid(ref)) referred.value = ref;
    } catch (e) {
      /* ignore a bad query string */
    }
    stripParam('ref');
  }

  var own = document.getElementById('ref_code');
  if (own && !own.value) {
    try {
      own.value = randomCode();
    } catch (e) {
      /* the sign-up can continue; a share code needs crypto */
    }
  }

  var shareOut = document.getElementById('share-url');
  if (shareOut) {
    try {
      var code = queryValue('code').toUpperCase();
      if (valid(code)) {
        var link = 'https://gethubbly.app/waitlist?ref=' + code;
        shareOut.textContent = link;
        shareOut.setAttribute('href', link);
        var box = document.getElementById('share-box');
        if (box) box.hidden = false;
        var missing = document.getElementById('share-missing');
        if (missing) missing.hidden = true;
      }
    } catch (e) {
      /* the welcome message still explains where the link is */
    }
    stripParam('code');
  }

  var EMAIL_EMPTY = 'Enter an email address to continue.';
  var EMAIL_INVALID = 'Check your email address, it looks incomplete.';

  function emailMessage(value) {
    var text = String(value || '').trim();
    if (!text) return EMAIL_EMPTY;
    if (!acceptableEmail(text)) return EMAIL_INVALID;
    return '';
  }

  function errorKey(field) {
    if (!field) return '';
    if (field.id === 'waitlist-email') return 'email';
    if (field.name === 'fields[store_pref]') return 'store';
    if (field.name === 'fields[age_18]') return 'age';
    return '';
  }

  function showError(form, message, field) {
    var boxes = form.querySelectorAll('[data-error-for]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].textContent = '';
      boxes[i].hidden = true;
    }
    var key = errorKey(field);
    var box = key ? form.querySelector('[data-error-for="' + key + '"]') : null;
    if (box && message) {
      box.textContent = message;
      box.hidden = false;
    }
    if (field && message) field.focus();
  }

  document.querySelectorAll('form[data-waitlist-form]').forEach(function (form) {
    var age = form.querySelector('input[name="fields[age_18]"]');
    var email = form.querySelector('#waitlist-email');
    var shown = false;

    function applyMessages() {
      var stores = form.querySelectorAll('input[name="fields[store_pref]"]');
      var picked = form.querySelector('input[name="fields[store_pref]"]:checked');
      if (email) {
        email.setCustomValidity(emailMessage(email.value));
      }
      for (var i = 0; i < stores.length; i++) {
        stores[i].setCustomValidity(!picked && i === 0 ? 'Please choose one option to continue.' : '');
      }
      if (age) age.setCustomValidity(age.checked ? '' : 'Please tick this box to continue.');
    }

    if (age) age.addEventListener('change', applyMessages);
    form.addEventListener('change', function (ev) {
      if (ev.target && ev.target.name === 'fields[store_pref]') applyMessages();
    });

    form.addEventListener(
      'click',
      function (ev) {
        var target = ev.target;
        if (!target || target.type !== 'submit') return;
        shown = false;
        applyMessages();
      },
      true,
    );

    form.addEventListener(
      'invalid',
      function (ev) {
        if (shown || !ev.target) return;
        var message = ev.target.validationMessage;
        if (!message || message === 'Please select one of these options.') return;
        shown = true;
        showError(form, message, ev.target);
        var reason = 'missing_email';
        if (message.indexOf('choose') !== -1) reason = 'missing_store';
        else if (message.indexOf('tick') !== -1) reason = 'missing_age';
        else if (message.indexOf('incomplete') !== -1) reason = 'invalid_email';
        emit('waitlist_error', { reason: reason });
      },
      true,
    );

    var submitting = false;
    form.addEventListener('submit', function (ev) {
      if (submitting) {
        ev.preventDefault();
        return;
      }
      var hp = form.querySelector('[data-hp]');
      if (hp && hp.value) {
        ev.preventDefault();
        submitting = true;
        var honeyButton = form.querySelector('button[type="submit"]');
        if (honeyButton) honeyButton.disabled = true;
        emit('waitlist_error', { reason: 'honeypot' });
        window.location.assign('/nearly');
        return;
      }
      if (hp) hp.removeAttribute('name');

      var store = form.querySelector('input[name="fields[store_pref]"]:checked');
      if (email && !acceptableEmail(email.value)) {
        ev.preventDefault();
        var emailText = emailMessage(email.value);
        email.setCustomValidity(emailText);
        showError(form, emailText, email);
        emit('waitlist_error', { reason: email.value.trim() ? 'invalid_email' : 'missing_email' });
        return;
      }
      if (email) email.setCustomValidity('');
      if (!store) {
        ev.preventDefault();
        var firstStore = form.querySelector('input[name="fields[store_pref]"]');
        showError(form, 'Please choose one option to continue.', firstStore);
        emit('waitlist_error', { reason: 'missing_store' });
        return;
      }
      if (age && !age.checked) {
        ev.preventDefault();
        age.setCustomValidity('Please tick this box to continue.');
        showError(form, 'Please tick this box to continue.', age);
        emit('waitlist_error', { reason: 'missing_age' });
        return;
      }
      if (age) age.setCustomValidity('');
      showError(form, '', null);
      submitting = true;
      var submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      var referredField = form.querySelector('#referred_by');
      var beta = form.querySelector('input[name="fields[beta_optin]"]');
      emit('waitlist_submit', {
        store_pref: store.value,
        beta_optin: !!(beta && beta.checked),
        has_referrer: !!(referredField && referredField.value),
        search: window.location.search,
      });

      if (form.getAttribute('data-mock') === 'true') {
        ev.preventDefault();
        window.location.assign('/nearly');
      }
    });
  });

  document.addEventListener('click', function (ev) {
    var target = ev.target;
    if (!target || !target.closest) return;
    var btn = target.closest('[data-share]');
    if (!btn) return;
    var urlEl = document.getElementById('share-url');
    var link = urlEl ? urlEl.getAttribute('href') || urlEl.textContent || '' : '';
    var status = document.getElementById('share-status');
    var channel = btn.getAttribute('data-channel');
    if (channel === 'copy' && link && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(
        function () {
          if (status) status.textContent = 'Link copied.';
        },
        function () {
          if (status) status.textContent = 'Copy the link above.';
        },
      );
    }
    if (channel === 'share' && link && navigator.share) {
      navigator.share({ title: 'Hubbly', text: SHARE_TEXT, url: link }).catch(function () {});
    } else if (channel === 'share' && status) {
      status.textContent = 'Copy the link above.';
    }
  });
})();
