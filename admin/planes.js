(function () {
  'use strict';

  var user = window.LlegueSession.requireAuth();
  if (!user) return;

  var PLANS = [
    { id: 'TIER_1', name: 'Básico', price: 199, popular: false },
    { id: 'TIER_2', name: 'Crecimiento', price: 449, popular: true },
    { id: 'TIER_3', name: 'Empresa', price: 799, popular: false }
  ];

  var selectedPlan = null;
  var appliedCoupon = null;

  var errorBox = document.getElementById('error-box');
  var plansGrid = document.getElementById('plans-grid');
  var couponMessage = document.getElementById('coupon-message');
  var discountBox = document.getElementById('discount-box');
  var payBtn = document.getElementById('pay-btn');
  var applyCouponBtn = document.getElementById('apply-coupon-btn');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }

  function hideError() {
    errorBox.style.display = 'none';
  }

  function clearCouponState() {
    appliedCoupon = null;
    couponMessage.style.display = 'none';
    discountBox.style.display = 'none';
  }

  function renderPlans() {
    plansGrid.innerHTML = '';
    PLANS.forEach(function (plan) {
      var card = document.createElement('div');
      card.className = 'admin-plan-card' + (selectedPlan === plan.id ? ' selected' : '');
      card.dataset.planId = plan.id;

      if (plan.popular) {
        var badge = document.createElement('span');
        badge.className = 'plan-popular';
        badge.textContent = 'Más popular';
        card.appendChild(badge);
      }

      var name = document.createElement('div');
      name.className = 'plan-name';
      name.textContent = plan.name;
      card.appendChild(name);

      var price = document.createElement('div');
      price.className = 'plan-price';
      price.innerHTML = '$' + plan.price + ' <span>MXN/mes</span>';
      card.appendChild(price);

      card.addEventListener('click', function () {
        selectedPlan = plan.id;
        clearCouponState();
        renderPlans();
      });

      plansGrid.appendChild(card);
    });
  }

  renderPlans();

  applyCouponBtn.addEventListener('click', function () {
    hideError();

    if (!selectedPlan) {
      showError('Selecciona un plan antes de aplicar un cupón.');
      return;
    }

    var code = document.getElementById('coupon-code').value.trim();
    if (!code) {
      showError('Escribe un código de cupón.');
      return;
    }

    applyCouponBtn.disabled = true;

    window.LlegueSession.authFetch('/payments/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code: code, plan: selectedPlan })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.valid) {
          clearCouponState();
          couponMessage.className = 'admin-error';
          couponMessage.textContent = result.data.error || 'Cupón inválido.';
          couponMessage.style.display = 'block';
          return;
        }

        if (result.data.type === 'FREE_MONTH') {
          clearCouponState();
          couponMessage.className = 'admin-info';
          couponMessage.textContent = 'Este cupón es de mes gratis — cánjealo desde la app Llegué, no aquí.';
          couponMessage.style.display = 'block';
          return;
        }

        if (result.data.type === 'PERCENTAGE') {
          appliedCoupon = result.data;
          couponMessage.className = 'admin-success';
          couponMessage.textContent = 'Cupón aplicado correctamente.';
          couponMessage.style.display = 'block';

          document.getElementById('discount-original').textContent = '$' + result.data.originalAmount + ' MXN';
          document.getElementById('discount-amount').textContent = '-$' + result.data.discountAmount + ' MXN';
          document.getElementById('discount-final').textContent = '$' + result.data.finalAmount + ' MXN';
          discountBox.style.display = 'block';
        }
      })
      .catch(function () {
        clearCouponState();
        couponMessage.className = 'admin-error';
        couponMessage.textContent = 'No se pudo validar el cupón. Intenta de nuevo.';
        couponMessage.style.display = 'block';
      })
      .finally(function () {
        applyCouponBtn.disabled = false;
      });
  });

  payBtn.addEventListener('click', function () {
    hideError();

    if (!selectedPlan) {
      showError('Selecciona un plan para continuar.');
      return;
    }

    var body = { selectedPlan: selectedPlan, discountedAmount: null };
    if (appliedCoupon && appliedCoupon.type === 'PERCENTAGE') {
      body.discountedAmount = appliedCoupon.finalAmount;
    }

    payBtn.disabled = true;
    payBtn.innerHTML = '<span class="admin-spinner"></span>Procesando...';

    window.LlegueSession.authFetch('/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          showError(result.data.error || 'No se pudo iniciar el pago. Intenta de nuevo.');
          payBtn.disabled = false;
          payBtn.textContent = 'Continuar al pago';
          return;
        }
        window.location.href = result.data.initPoint;
      })
      .catch(function () {
        showError('No se pudo conectar con el servidor. Intenta de nuevo.');
        payBtn.disabled = false;
        payBtn.textContent = 'Continuar al pago';
      });
  });
})();
