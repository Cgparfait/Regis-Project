(function () {
  'use strict';

  function $(sel) { return document.querySelector(sel); }

  var mode = 'signin';
  var tabSignin = $('#tabSignin');
  var tabSignup = $('#tabSignup');
  var authSubmitText = $('#authSubmitText');
  var authAlert = $('#authAlert');
  var authForm = $('#authForm');
  var authSubmit = $('#authSubmit');

  tabSignin.addEventListener('click', function () {
    mode = 'signin';
    tabSignin.classList.add('active');
    tabSignup.classList.remove('active');
    authSubmitText.textContent = 'Sign In';
    authAlert.innerHTML = '';
  });

  tabSignup.addEventListener('click', function () {
    mode = 'signup';
    tabSignup.classList.add('active');
    tabSignin.classList.remove('active');
    authSubmitText.textContent = 'Create Account';
    authAlert.innerHTML = '';
  });

  function showAlert(type, msg) {
    var cls = type === 'success' ? 'form-alert-success' : 'form-alert-error';
    var icon = type === 'success'
      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    authAlert.innerHTML = '<div class="form-alert ' + cls + '"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg><p>' + msg + '</p></div>';
  }

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    authAlert.innerHTML = '';

    var email = $('#authEmail').value.trim();
    var password = $('#authPassword').value;

    if (!email || !password) return;

    authSubmit.disabled = true;
    authSubmitText.textContent = mode === 'signin' ? 'Signing in...' : 'Creating account...';

    var endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          showAlert('error', data.error);
          authSubmit.disabled = false;
          authSubmitText.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
          return;
        }
        if (data.access_token) {
          sessionStorage.setItem('imyenda_token', data.access_token);
          sessionStorage.setItem('imyenda_email', data.user.email);
          window.location.href = '/admin';
        } else if (data.success) {
          showAlert('success', data.message || 'Account created. Please sign in.');
          mode = 'signin';
          tabSignin.click();
          authSubmit.disabled = false;
          authSubmitText.textContent = 'Sign In';
        }
      })
      .catch(function () {
        showAlert('error', 'Network error. Please try again.');
        authSubmit.disabled = false;
        authSubmitText.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
      });
  });
})();
