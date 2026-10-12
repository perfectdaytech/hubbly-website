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

  function stripParam(name) {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has(name)) return;
      url.searchParams.delete(name);
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
      var ref = new URLSearchParams(window.location.search).get('ref') || '';
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
      var code = new URLSearchParams(window.location.search).get('code') || '';
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

  function showError(form, message, field) {
    var box = form.querySelector('[data-error]');
    if (box) {
      box.textContent = message;
      box.hidden = !message;
    }
    if (field && message) field.focus();
  }

  document.querySelectorAll('form[data-waitlist-form]').forEach(function (form) {
    var age = form.querySelector('input[name="fields[age_18]"]');
    var email = form.querySelector('input[type="email"]');
    if (age) {
      age.addEventListener('change', function () {
        age.setCustomValidity(age.checked ? '' : 'Please tick this box to continue.');
      });
    }

    form.addEventListener(
      'click',
      function (ev) {
        var target = ev.target;
        if (!target || target.type !== 'submit') return;
        if (age) age.setCustomValidity(age.checked ? '' : 'Please tick this box to continue.');
        if (email && !String(email.value || '').trim()) email.setCustomValidity('Enter an email address to continue.');
        else if (email) email.setCustomValidity('');
      },
      true,
    );

    form.addEventListener('submit', function (ev) {
      var hp = form.querySelector('[data-hp]');
      if (hp && hp.value) {
        ev.preventDefault();
        emit('waitlist_error', { reason: 'honeypot' });
        window.location.assign('/nearly');
        return;
      }
      if (hp) hp.removeAttribute('name');

      var store = form.querySelector('input[name="fields[store_pref]"]:checked');
      if (email && !email.value.trim()) {
        ev.preventDefault();
        email.setCustomValidity('Enter an email address to continue.');
        showError(form, 'Enter an email address to continue.', email);
        emit('waitlist_error', { reason: 'missing_email' });
        return;
      }
      if (email) email.setCustomValidity('');
      if (email && !email.checkValidity()) {
        ev.preventDefault();
        showError(form, 'Enter an email address to continue.', email);
        emit('waitlist_error', { reason: 'invalid_email' });
        return;
      }
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
