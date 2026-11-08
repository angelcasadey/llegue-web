(function () {
  'use strict';

  var API_BASE = 'https://geoattend-production-7693.up.railway.app/api';
  var KEY_ACCESS = 'llegue_admin_accessToken';
  var KEY_REFRESH = 'llegue_admin_refreshToken';
  var KEY_USER = 'llegue_admin_user';

  function getAccessToken() {
    return localStorage.getItem(KEY_ACCESS);
  }

  function getRefreshToken() {
    return localStorage.getItem(KEY_REFRESH);
  }

  function getUser() {
    var raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  }

  function setSession(accessToken, refreshToken, user) {
    localStorage.setItem(KEY_ACCESS, accessToken);
    localStorage.setItem(KEY_REFRESH, refreshToken);
    if (user) {
      localStorage.setItem(KEY_USER, JSON.stringify(user));
    }
  }

  function setTokens(accessToken, refreshToken) {
    localStorage.setItem(KEY_ACCESS, accessToken);
    localStorage.setItem(KEY_REFRESH, refreshToken);
  }

  function clearSession() {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
  }

  function requireAuth() {
    var accessToken = getAccessToken();
    var user = getUser();
    if (!accessToken || !user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  function doRefresh() {
    var refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.resolve(false);
    }
    return fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken })
    }).then(function (res) {
      if (!res.ok) return false;
      return res.json().then(function (data) {
        setTokens(data.accessToken, data.refreshToken);
        return true;
      });
    }).catch(function () {
      return false;
    });
  }

  function authFetch(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {}, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAccessToken()
    });
    var fetchOptions = Object.assign({}, options, { headers: headers });

    return fetch(API_BASE + path, fetchOptions).then(function (res) {
      if (res.status !== 401) {
        return res;
      }
      return doRefresh().then(function (refreshed) {
        if (!refreshed) {
          clearSession();
          window.location.href = 'login.html';
          return Promise.reject(new Error('Sesión expirada'));
        }
        var retryHeaders = Object.assign({}, options.headers || {}, {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + getAccessToken()
        });
        var retryOptions = Object.assign({}, options, { headers: retryHeaders });
        return fetch(API_BASE + path, retryOptions);
      });
    });
  }

  function logout() {
    var refreshToken = getRefreshToken();
    fetch(API_BASE + '/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken })
    }).catch(function () {}).finally(function () {
      clearSession();
      window.location.href = 'login.html';
    });
  }

  window.LlegueSession = {
    API_BASE: API_BASE,
    getAccessToken: getAccessToken,
    getRefreshToken: getRefreshToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    requireAuth: requireAuth,
    authFetch: authFetch,
    logout: logout
  };
})();
