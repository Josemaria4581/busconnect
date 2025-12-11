/* api-client.js - Backend Connector */
(function (global) {
  const API_BASE = "http://localhost:4000/api";
  let token = localStorage.getItem('auth_token');

  async function req(method, endpoint, body) {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (token) {
        opts.headers['Authorization'] = `Bearer ${token}`;
      }
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE}${endpoint}`, opts);

      if (res.status === 401) {
        // Token invalid or expired
        // alert('Sesión expirada'); // User wanted no alerts, handle gracefully?
        // For now, if endpoint was auth/login, we return error. If not, maybe redirect.
        if (!endpoint.includes('/auth/')) {
          localStorage.removeItem('auth_token');
          window.location.href = 'inicioSesion.html';
          return;
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}: ${res.statusText}`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  const ApiClient = {
    // --- AUTH ---
    login: async (email, password) => {
      const data = await req('POST', '/auth/login', { email, password });
      if (data.token) {
        token = data.token;
        localStorage.setItem('auth_token', token);
      }
      return data;
    },
    logout: () => {
      token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user_id');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = 'inicioSesion.html';
    },

    // --- AUTOBUSES ---
    getBuses: () => req('GET', '/autobuses'),
    getBus: (id) => req('GET', `/autobuses/${id}`),
    createBus: (data) => req('POST', '/autobuses', data),
    updateBus: (id, data) => req('PUT', `/autobuses/${id}`, data),
    deleteBus: (id) => req('DELETE', `/autobuses/${id}`),

    // --- CONDUCTORES ---
    getDrivers: () => req('GET', '/conductores'),
    createDriver: (data) => req('POST', '/conductores', data),
    updateDriver: (id, data) => req('PUT', `/conductores/${id}`, data),
    deleteDriver: (id) => req('DELETE', `/conductores/${id}`),

    // --- RUTAS ---
    getRoutes: () => req('GET', '/rutas'),
    createRoute: (data) => req('POST', '/rutas', data),
    updateRoute: (id, data) => req('PUT', `/rutas/${id}`, data),
    deleteRoute: (id) => req('DELETE', `/rutas/${id}`),

    // --- VIAJES ---
    getTrips: (filters = {}) => {
      const q = new URLSearchParams(filters).toString();
      return req('GET', `/viajes-discrecionales?${q}`);
    },
    createTrip: (data) => req('POST', '/viajes-discrecionales', data),
    updateTrip: (id, data) => req('PUT', `/viajes-discrecionales/${id}`, data),
    // Chat
    getTripChat: (id) => req('GET', `/viajes-discrecionales/${id}/chat`),
    sendTripMessage: (id, data) => req('POST', `/viajes-discrecionales/${id}/chat`, data),

    // --- NOTIFICACIONES ---
    getNotifs: (user) => req('GET', `/notificaciones?usuario=${user}`),
    markNotifRead: (id) => req('PATCH', `/notificaciones/${id}/leido`, { leido: 1 }),

    // --- MANTENIMIENTOS ---
    getMaintenances: (filters = {}) => {
      const q = new URLSearchParams(filters).toString();
      return req('GET', `/mantenimientos?${q}`);
    },
    createMaintenance: (data) => req('POST', '/mantenimientos', data),
    deleteMaintenance: (id) => req('DELETE', `/mantenimientos/${id}`),

    // --- INCIDENCIAS ---
    getIncidents: () => req('GET', '/incidencias'),
    createIncident: (data) => req('POST', '/incidencias', data),

    // --- UTILS ---
    syncToLocal: async function () {
      // Deprecated logic? Keeping for compatibility if needed
      try {
        const buses = await this.getBuses();
        // ...
      } catch (e) { }
    }
  };

  global.ApiClient = ApiClient;
  global.ApiSync = { sync: () => ApiClient.syncToLocal() };

})(window);
