(function () {
  'use strict';

  var API_BASE = 'https://geoattend-production-7693.up.railway.app/api';

  var form = document.getElementById('deletion-request-form');
  var messageBox = document.getElementById('form-message');
  var submitBtn = document.getElementById('submit-btn');

  function showMessage(type, text) {
    messageBox.className = 'form-message form-message--' + type;
    messageBox.textContent = text;
    messageBox.style.display = 'block';
  }

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var emailValue = document.getElementById('email').value.trim();
    if (!EMAIL_PATTERN.test(emailValue)) {
      showMessage('error', 'Escribe un correo valido, debe incluir @ y un dominio (ejemplo: nombre@dominio.com).');
      document.getElementById('email').focus();
      return;
    }

    var body = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      company: document.getElementById('company').value.trim(),
      reason: document.getElementById('reason').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    fetch(API_BASE + '/deletion-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          showMessage('error', result.data.error || 'No se pudo enviar la solicitud. Intenta de nuevo.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar solicitud';
          return;
        }

        showMessage('success', result.data.message || 'Solicitud recibida, te contactaremos pronto.');
        submitBtn.textContent = 'Solicitud enviada';
        submitBtn.classList.remove('btn--primary');
        submitBtn.classList.add('btn--success');
        form.querySelectorAll('input, textarea, button').forEach(function (el) {
          el.disabled = true;
        });
      })
      .catch(function () {
        showMessage('error', 'No se pudo conectar con el servidor. Intenta de nuevo.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar solicitud';
      });
  });
})();
