(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var errorBox = document.getElementById('error-box');
  var submitBtn = document.getElementById('submit-btn');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }

  function hideError() {
    errorBox.style.display = 'none';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideError();

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';

    fetch(window.LlegueSession.API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          showError(result.data.error || 'No se pudo iniciar sesión.');
          return;
        }
        window.LlegueSession.setSession(
          result.data.accessToken,
          result.data.refreshToken,
          result.data.user
        );
        window.location.href = 'cuenta.html';
      })
      .catch(function () {
        showError('No se pudo conectar con el servidor. Intenta de nuevo.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar sesión';
      });
  });
})();
