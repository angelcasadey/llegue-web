(function () {
  'use strict';

  var user = window.LlegueSession.requireAuth();
  if (!user) return;

  var statusMessage = document.getElementById('status-message');
  var retornoIcon = document.getElementById('retorno-icon');

  var params = new URLSearchParams(window.location.search);
  var mpStatus = params.get('status');

  var MP_STATUS_MESSAGES = {
    success: 'Tu pago fue recibido. Estamos confirmando la activación de tu suscripción...',
    pending: 'Tu pago está pendiente de confirmación (por ejemplo, pago en efectivo en OXXO). Esto puede tardar unos minutos u horas.',
    failure: 'El pago no se completó. Puedes intentar de nuevo desde la página de planes.'
  };

  statusMessage.textContent = MP_STATUS_MESSAGES[mpStatus] || 'Estamos confirmando el estado de tu suscripción...';

  var MAX_POLLS = 5;
  var POLL_INTERVAL_MS = 2000;
  var pollCount = 0;

  function showActivated() {
    retornoIcon.textContent = '✅';
    statusMessage.className = 'admin-success';
    statusMessage.innerHTML = '¡Suscripción activada! <a href="cuenta.html">Ir a mi cuenta</a>';
  }

  function showStillProcessing() {
    retornoIcon.textContent = '⏳';
    statusMessage.className = 'admin-info';
    statusMessage.textContent = 'Seguimos confirmando tu pago, revisa en unos minutos.';
  }

  function poll() {
    pollCount += 1;

    window.LlegueSession.authFetch('/payments/access-level')
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (accessLevel) {
        if (accessLevel && accessLevel.status === 'ACTIVE') {
          showActivated();
          return;
        }

        if (pollCount >= MAX_POLLS) {
          showStillProcessing();
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      })
      .catch(function () {
        if (pollCount >= MAX_POLLS) {
          showStillProcessing();
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      });
  }

  poll();
})();
