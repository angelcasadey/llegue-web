(function () {
  'use strict';

  var user = window.LlegueSession.requireAuth();
  if (!user) return;

  var loadingEl = document.getElementById('loading');
  var errorBox = document.getElementById('error-box');
  var notAdminBox = document.getElementById('not-admin-box');
  var content = document.getElementById('account-content');

  document.getElementById('logout-link').addEventListener('click', function () {
    window.LlegueSession.logout();
  });

  var isBillingAdmin = user.role === 'BUSINESS_ADMIN' && !user.isParticular;

  if (!isBillingAdmin) {
    loadingEl.style.display = 'none';
    notAdminBox.style.display = 'block';
    return;
  }

  var STATUS_LABELS = {
    FREE: 'Prueba gratuita',
    UNPAID: 'Sin suscripción',
    EXPIRED: 'Suscripción vencida',
    ACTIVE: 'Activa'
  };

  var STATUS_BADGE_CLASS = {
    FREE: 'admin-badge--free',
    UNPAID: 'admin-badge--unpaid',
    EXPIRED: 'admin-badge--expired',
    ACTIVE: 'admin-badge--active'
  };

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function render(accessLevel) {
    document.getElementById('user-name').textContent = user.company || user.name || '';
    document.getElementById('user-email').textContent = user.email || '';

    var badge = document.getElementById('status-badge');
    badge.textContent = STATUS_LABELS[accessLevel.status] || accessLevel.status;
    badge.className = 'admin-badge ' + (STATUS_BADGE_CLASS[accessLevel.status] || '');

    document.getElementById('plan-name').textContent = accessLevel.planName || 'Sin plan';

    var detailRow = document.getElementById('detail-row');
    var detailLabel = document.getElementById('detail-label');
    var detailValue = document.getElementById('detail-value');

    if (accessLevel.status === 'FREE' && accessLevel.daysLeft != null) {
      detailLabel.textContent = 'Días restantes de prueba';
      detailValue.textContent = accessLevel.daysLeft;
    } else if (accessLevel.status === 'ACTIVE' && accessLevel.endDate) {
      detailLabel.textContent = 'Vence el';
      detailValue.textContent = formatDate(accessLevel.endDate);
    } else {
      detailRow.style.display = 'none';
    }

    var verPlanesBtn = document.getElementById('ver-planes-btn');
    if (accessLevel.status === 'ACTIVE') {
      verPlanesBtn.style.display = 'none';
    }

    loadingEl.style.display = 'none';
    content.style.display = 'block';
  }

  window.LlegueSession.authFetch('/payments/access-level')
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (data) {
          throw new Error(data.error || 'No se pudo obtener el estado de la cuenta.');
        });
      }
      return res.json();
    })
    .then(function (accessLevel) {
      render(accessLevel);
    })
    .catch(function (err) {
      loadingEl.style.display = 'none';
      errorBox.textContent = err.message || 'No se pudo obtener el estado de la cuenta.';
      errorBox.style.display = 'block';
    });
})();
