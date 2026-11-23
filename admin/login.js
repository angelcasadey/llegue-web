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

  // ─── Mostrar/ocultar contraseña ───
  var passwordInput = document.getElementById('password');
  var passwordToggle = document.getElementById('password-toggle');

  function setPasswordVisible(visible) {
    passwordInput.type = visible ? 'text' : 'password';
    var label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
    passwordToggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
    passwordToggle.setAttribute('aria-label', label);
    passwordToggle.setAttribute('title', label);
    // En <svg> la propiedad .hidden no existe: hay que usar el atributo.
    setHidden(passwordToggle.querySelector('.icon-show'), visible);
    setHidden(passwordToggle.querySelector('.icon-hide'), !visible);
  }

  function setHidden(element, hidden) {
    if (hidden) {
      element.setAttribute('hidden', '');
    } else {
      element.removeAttribute('hidden');
    }
  }

  passwordToggle.addEventListener('click', function () {
    setPasswordVisible(passwordInput.type === 'password');
  });

  // Vuelve a ocultarla al enviar: no queda visible mientras se procesa
  // y el navegador la sigue tratando como contraseña para guardarla.
  form.addEventListener('submit', function () {
    setPasswordVisible(false);
  });

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
