/* gestion-discrecionales.js — versión “mis viajes” + seed mínimo de empleados
   - Guarda cada viaje con createdBy = CURRENT_USER_ID
   - Valida tacógrafo (pausas, 9h/día)
   - Modal para 2º conductor o pernocta
   - Asigna bus y conductor disponibles (sin solapes, capacidad >= plazas)
   - Coste con extras (2º conductor / pernocta)
*/

(function () {
  // ====== Identidad (persistente) ======
  const LS_USER = 'current_user_id';
  function getCurrentUserId() {
    let id = localStorage.getItem(LS_USER);
    if (!id) { id = 'user-' + (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)); localStorage.setItem(LS_USER, id); }
    return id;
  }
  const CURRENT_USER_ID = getCurrentUserId();

  // ====== CONSTANTES DE NEGOCIO ======
  const SECOND_DRIVER_DAILY_COST = 180;   // €/día extra 2º conductor
  const OVERNIGHT_COST_PER_DRIVER = 120;  // €/noche por conductor (hotel+dietas)
  const DEFAULT_AVG_SPEED_KMH = 70;
  const MAX_DAILY_DRIVING_H = 9;
  const BREAK_AFTER_H = 4.5;              // pausa tras 4h30 (~45 min)

  // ====== ESTADO GLOBAL ======
  let kilometros = 0;
  let routeDurationSec = 0;
  let map, routeLayer;
  let extraSecondDriver = false;
  let extraOvernight = false;

  // ====== MAPA (Leaflet) ======
  map = L.map('mapa').setView([40.4168, -3.7038], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

  // ====== APIs ======
  const openCageKey = 'c0b092296bce4c1685af8af7ba387a62';
  const openRouteServiceKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZiNTQ4YmZhMmE1MzQyM2RhMTcyMzVlNmRhZWZmOGVmIiwiaCI6Im11cm11cjY0In0=';

  async function getCoordinates(address) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${openCageKey}&language=es`;
    const r = await fetch(url); const data = await r.json();
    return data.results?.length ? data.results[0].geometry : null; // {lat,lng}
  }

  async function calculateDistance(origin, destination) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${openRouteServiceKey}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`;
    const r = await fetch(url); const data = await r.json();
    if (data.features?.length) {
      const f = data.features[0];
      return {
        distance: f.properties.summary.distance,  // m
        duration: f.properties.summary.duration,  // s
        coordinates: f.geometry.coordinates       // [[lon,lat],...]
      };
    }
    return null;
  }

  async function showRoute(a1, a2) {
    const c1 = await getCoordinates(a1);
    const c2 = await getCoordinates(a2);
    if (!c1 || !c2) { alert("No se pudieron geocodificar las direcciones."); return null; }
    const route = await calculateDistance(c1, c2);
    if (!route) { alert("No se pudo calcular una ruta por carretera."); return null; }

    kilometros = (route.distance || 0) / 1000;
    routeDurationSec = (route.duration || 0);

    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(route.coordinates.map(c => [c[1], c[0]]), { weight: 4, opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());

    calcularCoste();
    return route;
  }

  // ====== UTILS DOM ======
  const $ = s => document.querySelector(s);
  const fmtEUR = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const nowES = () => new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  const msPerDay = 24 * 60 * 60 * 1000;

  function ensureToastHost() {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.style.position = "fixed";
      host.style.bottom = "90px";
      host.style.left = "50%";
      host.style.transform = "translateX(-50%)";
      host.style.zIndex = "9999";
      host.style.pointerEvents = "none";
      document.body.appendChild(host);
    }
    return host;
  }
  function showToast(msg, ms) {
    const host = ensureToastHost();
    const bubble = document.createElement("div");
    bubble.textContent = msg;
    bubble.style.background = "rgba(17,17,17,.92)";
    bubble.style.color = "#fff";
    bubble.style.font = "500 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu";
    bubble.style.padding = "8px 12px";
    bubble.style.borderRadius = "9999px";
    bubble.style.margin = "6px 0";
    bubble.style.boxShadow = "0 6px 20px rgba(0,0,0,.25)";
    bubble.style.display = "inline-block";
    bubble.style.cursor = "pointer";
    bubble.title = "Click para cerrar";
    host.appendChild(bubble);
    bubble.addEventListener('click', () => bubble.remove());
    if (typeof ms === 'number' && ms > 0) setTimeout(() => bubble.remove(), ms);
  }

  // ====== ENLACES ======
  const el = {
    origen: $("#origen"),
    destino: $("#destino"),
    salida: $("#salida"),
    llegada: $("#llegada"),
    plazas: $("#plazas"),
    dias: $("#dias"),
    costeKm: $("#costeKilometro"),
    costeTotal: $("#costeTotal"),
    pagoAdel: $("#pagoAdelantado"),
    restante: $("#montoRestante"),
    estadoPago: $("#estadoPago"),
    btnPagado: $("#btnMarcarPagado"),
    btnGenerar: $("#btnGenerar"),
    btnGenerarResumen: $("#btnGenerarResumen"),
    btnConfirmar: $("#btnConfirmar"),
    chat: $("[data-chat]") || $("#messages"),
    chatInput: $("[data-chat-input]") || $("#messageInput"),
    chatSend: $("[data-chat-send]") || $("#sendBtn"),
    chatAttach: $("[data-chat-attach]") || $("#attachBtn"),
    chatFile: $("[data-chat-file]") || $("#fileInput"),
    btnBack: $("#btnBack"),
    btnMore: $("#btnMore"),
    tachoHost: $("#tachoModalHost")
  };

  // ====== MENSAJERÍA ======
  const CHAT_KEY = "chatMensajeriaDiscrecionales";
  const loadMessages = () => { try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); } catch { return []; } };
  const saveMessages = (l) => localStorage.setItem(CHAT_KEY, JSON.stringify(l));
  function renderMessages() {
    if (!el.chat) return;
    const msgs = loadMessages();
    el.chat.innerHTML = "";
    msgs.forEach(m => {
      const wrap = document.createElement("div");
      wrap.className = "flex items-start gap-3 " + (m.role === "agent" ? "flex-row-reverse" : "");
      const avatar = document.createElement("div");
      avatar.className = m.role === "agent"
        ? "w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0"
        : "w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0";
      avatar.innerHTML = `<span class="material-symbols-outlined ${m.role === "agent" ? "text-primary" : "text-slate-500"}">${m.role === "agent" ? "support_agent" : "person"}</span>`;
      const bubble = document.createElement("div");
      bubble.className = m.role === "agent" ? "flex-1 bg-primary/10 dark:bg-primary/20 rounded-lg p-3 rounded-tr-none" : "flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-3 rounded-tl-none";
      bubble.innerHTML = `<p class="text-sm text-slate-800 dark:text-slate-200">${m.text}</p><p class="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">${m.time || nowES()}</p>`;
      wrap.appendChild(avatar); wrap.appendChild(bubble); el.chat.appendChild(wrap);
    });
    el.chat.scrollTop = el.chat.scrollHeight;
  }
  function pushMessage(role, text) { const l = loadMessages(); l.push({ role, text, time: nowES(), ts: Date.now() }); saveMessages(l); renderMessages(); }
  function bootstrapSeedChat() {
    if (loadMessages().length) return;
    saveMessages([
      { role: "client", text: "Hola, ¿podemos añadir una parada extra?", time: nowES(), ts: Date.now() - 600000 },
      { role: "agent", text: "Claro, la añado y actualizo el precio.", time: nowES(), ts: Date.now() - 300000 }
    ]);
  }

  // ====== DÍAS AUTO ======
  function updateDiasAuto() {
    const sVal = el.salida?.value, lVal = el.llegada?.value;
    if (!sVal || !lVal) return;
    const s = new Date(sVal), l = new Date(lVal);
    if (isNaN(s) || isNaN(l)) return;
    const diffMs = Math.max(0, l - s);
    const days = Math.max(1, Math.ceil(diffMs / msPerDay));
    el.dias.value = days;
    calcularCoste();
  }

  // ====== COSTE ======
  function calcularCoste() {
    const plazas = parseInt(el.plazas?.value || "0", 10);
    const dias = parseInt(el.dias?.value || "1", 10);

    const porKm = kilometros * 2;    // € por km
    const porPlaza = plazas * 1.2;   // € por plazas
    const porDiaExtra = Math.max(dias - 1, 0) * 50;

    const drivers = extraSecondDriver ? 2 : 1;
    const secondDriverCost = extraSecondDriver ? (SECOND_DRIVER_DAILY_COST * dias) : 0;

    const nights = Math.max(dias - 1, 0);
    const overnightCost = extraOvernight ? (OVERNIGHT_COST_PER_DRIVER * drivers * nights) : 0;

    const total = porKm + porPlaza + porDiaExtra + secondDriverCost + overnightCost;
    const adelanto = total * 0.20;
    const restante = total - adelanto;

    if (el.costeKm) el.costeKm.textContent = fmtEUR(porKm);
    if (el.costeTotal) el.costeTotal.textContent = fmtEUR(total);
    if (el.pagoAdel) el.pagoAdel.textContent = fmtEUR(adelanto);
    if (el.restante) el.restante.textContent = fmtEUR(restante);

    return { total, adelanto, restante, nights, drivers };
  }

  function marcarPagado() {
    if (!el.estadoPago) return;
    el.estadoPago.textContent = "Pagado";
    showToast("Pago marcado como completado");
  }

  // ====== Ruta reactiva ======
  async function handleDestinoChange() {
    const o = el.origen?.value?.trim(), d = el.destino?.value?.trim();
    if (!o || !d) return;
    await showRoute(o, d);
  }

  // ====== Tacógrafo ======
  function requiredBreaksHours(driveHours) {
    const blocks = Math.floor(driveHours / BREAK_AFTER_H);
    return blocks * 0.75; // 45 min por bloque
  }

  function showTachoModal(onSecondDriver, onOvernight, onCancel) {
    const host = el.tachoHost || document.body;
    const wrap = document.createElement('div');
    wrap.className = "fixed inset-0 z-50";
    wrap.innerHTML = `
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-2xl max-w-lg mx-auto">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">No cumple tacógrafo para ida y vuelta</h3>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">Elige una solución:</p>
        <div class="space-y-2">
          <button id="optSecond" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white">
            <span class="material-symbols-outlined">group_add</span>Añadir 2º conductor (coste extra)
          </button>
          <button id="optOvernight" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white">
            <span class="material-symbols-outlined">hotel</span>Hacer noche fuera de base (coste extra)
          </button>
          <button id="optCancel" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white">
            <span class="material-symbols-outlined">close</span>Cancelar
          </button>
        </div>
      </div>`;
    host.appendChild(wrap);
    wrap.querySelector('#optSecond').onclick = () => { wrap.remove(); onSecondDriver && onSecondDriver(); };
    wrap.querySelector('#optOvernight').onclick = () => { wrap.remove(); onOvernight && onOvernight(); };
    wrap.querySelector('#optCancel').onclick = () => { wrap.remove(); onCancel && onCancel(); };
    wrap.firstElementChild.onclick = () => { wrap.remove(); onCancel && onCancel(); };
  }

  function checkTacographAndMaybeProposeOptions() {
    const oneWayHours = routeDurationSec ? (routeDurationSec / 3600) : (kilometros / DEFAULT_AVG_SPEED_KMH);
    const sVal = el.salida?.value, lVal = el.llegada?.value;
    if (!sVal || !lVal) return true;
    const s = new Date(sVal), l = new Date(lVal);
    if (isNaN(s) || isNaN(l)) return true;

    const windowHours = Math.max(0, (l - s) / 3600000);
    const driveHours = oneWayHours * 2;
    const breaksH = requiredBreaksHours(driveHours);
    const neededHours = driveHours + breaksH;

    const exceedsDailyDrive = driveHours > MAX_DAILY_DRIVING_H;
    const notFitInWindow = neededHours > windowHours;

    if (!exceedsDailyDrive && !notFitInWindow) return true;

    showTachoModal(
      () => { // 2º conductor
        extraSecondDriver = true;
        calcularCoste();
        showToast("Añadido 2º conductor. Coste actualizado.");
        confirmAndSaveTrip();
      },
      () => { // pernocta
        extraOvernight = true;
        const currentDays = parseInt(el.dias.value || "1", 10);
        if (currentDays < 2) showToast("Has elegido pernocta. Ajusta llegada si procede para abarcar 2 días.");
        calcularCoste();
        showToast("Añadida pernocta. Coste actualizado.");
        confirmAndSaveTrip();
      },
      () => { showToast("Confirmación cancelada"); }
    );
    return false;
  }

  // ====== ALMACENES ======
  const LS_TRIPS = 'viajes_discrecionales_v1';
  const LS_FLOTA = 'flota_autobuses_v1';
  const LS_EMPL = 'empleados_v1';

  const loadJson = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const saveJson = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Seeds para evitar “no hay conductor” / “no hay bus” si está vacío
  function ensureSeedEmployees() {
    const emps = loadJson(LS_EMPL, []);
    if (emps.length) return;
    const seeded = [
      { id: 'drv-1', name: 'Juan Pérez', role: 'driver' },
      { id: 'drv-2', name: 'María López', role: 'driver' }
    ];
    saveJson(LS_EMPL, seeded);
  }
  function ensureSeedFleet() {
    const flota = loadJson(LS_FLOTA, []);
    if (flota.length) return;
    const seeded = [
      { id: 'bus-1', plate: '1234 ABC', model: 'Volvo 9700', km: 100000, seats: 55, img: '', maintenance: [] }
    ];
    saveJson(LS_FLOTA, seeded);
  }

  function intervalsOverlap(aStart, aEnd, bStart, bEnd) { return (aStart < bEnd) && (bStart < aEnd); }

  function findAvailableBus(capacityNeeded, start, end) {
    const buses = loadJson(LS_FLOTA, []);
    const trips = loadJson(LS_TRIPS, []);
    const candidates = buses.filter(b => (b.seats || 0) >= capacityNeeded)
      .sort((a, b) => (a.seats || 999) - (b.seats || 999));
    for (const bus of candidates) {
      const used = trips.some(t => t.busPlate === bus.plate && intervalsOverlap(new Date(t.start), new Date(t.end), start, end));
      if (!used) return bus;
    }
    return null;
  }

  function findAvailableDriver(start, end, excludeId = null) {
    const emps = loadJson(LS_EMPL, []).filter(e => (e.role || '').toLowerCase() === 'driver' && e.id !== excludeId);
    const trips = loadJson(LS_TRIPS, []);
    for (const d of emps) {
      const busy = trips.some(t => t.driverId === d.id && intervalsOverlap(new Date(t.start), new Date(t.end), start, end));
      if (!busy) return d;
    }
    return null;
  }

  async function confirmAndSaveTrip() {
    const origen = el.origen?.value?.trim() || '';
    const destino = el.destino?.value?.trim() || '';
    const plazas = parseInt(el.plazas?.value || "0", 10);
    const salida = new Date(el.salida?.value || '');
    const llegada = new Date(el.llegada?.value || '');

    if (!origen || !destino || !plazas || isNaN(salida) || isNaN(llegada)) { alert("Completa origen, destino, plazas y horarios."); return; }

    /* Buscamos en API (TODO: endpoints de disponibilidad real, por ahora simplificado: POST crea el viaje y backend aceptará si no valida) */
    /* Para esta demo, enviamos la solicitud de viaje CONFIRMADO directamente */

    const resumen = calcularCoste();

    try {
      const tripData = {
        cliente_id: 1, // Hardcoded or from LS user if mapped
        origen, destino,
        fecha_salida: salida.toISOString(),
        fecha_llegada: llegada.toISOString(),
        plazas,
        precio_total: resumen.total,
        estado: 'aceptado', // Confirmado
        observaciones: `Conductor extra: ${extraSecondDriver}, Pernocta: ${extraOvernight}`
      };

      await ApiClient.createTrip(tripData);
      showToast("Viaje confirmado y guardado en servidor");
      // reset
      extraSecondDriver = false;
      extraOvernight = false;
      calcularCoste();
    } catch (e) { alert('Error creando viaje: ' + e.message); }
  }

  async function createPendingRequest() {
    const origen = el.origen?.value?.trim() || '';
    const destino = el.destino?.value?.trim() || '';
    const plazas = parseInt(el.plazas?.value || "0", 10);
    const salida = new Date(el.salida?.value || '');
    const llegada = new Date(el.llegada?.value || '');

    if (!origen || !destino || !plazas || isNaN(salida) || isNaN(llegada)) { alert("Completa origen, destino, plazas y horarios."); return; }

    const resumen = calcularCoste();

    try {
      const tripData = {
        cliente_id: 1,
        origen, destino,
        fecha_salida: salida.toISOString(),
        fecha_llegada: llegada.toISOString(),
        plazas,
        precio_total: resumen.total,
        estado: 'pendiente',
        observaciones: 'Solicitud web'
      };

      await ApiClient.createTrip(tripData);
      showToast("Solicitud enviada al servidor");
    } catch (e) { alert('Error enviando solicitud: ' + e.message); }
  }

  function createPendingWithTacho(done) {
    const oneWayHours = routeDurationSec ? (routeDurationSec / 3600) : (kilometros / DEFAULT_AVG_SPEED_KMH);
    const sVal = el.salida?.value, lVal = el.llegada?.value;
    if (!sVal || !lVal) { createPendingRequest(); done && done(); return; }
    const s = new Date(sVal), l = new Date(lVal);
    if (isNaN(s) || isNaN(l)) { createPendingRequest(); done && done(); return; }

    const windowHours = Math.max(0, (l - s) / 3600000);
    const driveHours = oneWayHours * 2;
    const breaksH = requiredBreaksHours(driveHours);
    const neededHours = driveHours + breaksH;

    const exceedsDailyDrive = driveHours > MAX_DAILY_DRIVING_H;
    const notFitInWindow = neededHours > windowHours;

    if (!exceedsDailyDrive && !notFitInWindow) { createPendingRequest(); done && done(); return; }

    showTachoModal(
      () => { // 2º conductor
        extraSecondDriver = true;
        calcularCoste();
        showToast("Añadido 2º conductor (solicitud)");
        createPendingRequest();
        done && done();
      },
      () => { // pernocta
        extraOvernight = true;
        const currentDays = parseInt(el.dias.value || "1", 10);
        if (currentDays < 2) showToast("Has elegido pernocta. Ajusta llegada si procede.");
        calcularCoste();
        showToast("Añadida pernocta (solicitud)");
        createPendingRequest();
        done && done();
      },
      () => { showToast("Solicitud cancelada"); }
    );
  }

  function onConfirmClick() {
    updateDiasAuto();
    extraSecondDriver = false;
    extraOvernight = false;
    const ok = checkTacographAndMaybeProposeOptions();
    if (ok) confirmAndSaveTrip();
  }

  // ====== PDF ======
  async function generarPDF() {
    try {
      const { jsPDF } = window.jspdf || await (async () => {
        await new Promise((res, rej) => { const s = document.createElement('script'); s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        return window.jspdf;
      })();
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const origen = el.origen?.value || "", destino = el.destino?.value || "";
      const plazas = parseInt(el.plazas?.value || "0", 10);
      const dias = parseInt(el.dias?.value || "1", 10);
      const sTxt = el.salida?.value || "", lTxt = el.llegada?.value || "";
      const res = calcularCoste();

      doc.setFont("helvetica", "bold"); doc.setFontSize(18);
      doc.text("Solicitud de Viaje Discrecional", 40, 60);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      doc.text("Empresa: Autobuses ACME, S.L.", 40, 86);
      doc.text("Fecha: " + nowES(), 40, 102);

      let y = 140;
      doc.setFont("helvetica", "bold"); doc.text("Detalles de la Solicitud", 40, y); y += 18;
      doc.setFont("helvetica", "normal");
      if (origen) { doc.text("Origen: " + origen, 40, y); y += 16; }
      if (destino) { doc.text("Destino: " + destino, 40, y); y += 16; }
      if (sTxt) { doc.text("Salida: " + sTxt, 40, y); y += 16; }
      if (lTxt) { doc.text("Llegada: " + lTxt, 40, y); y += 16; }
      doc.text("Nº de plazas: " + plazas, 40, y); y += 16;
      doc.text("Días (auto): " + dias, 40, y); y += 24;

      doc.setFont("helvetica", "bold"); doc.text("Resumen y pago", 40, y); y += 18;
      doc.setFont("helvetica", "normal");
      doc.text("Coste por km: " + fmtEUR(kilometros * 2), 40, y); y += 16;
      doc.text("Total: " + fmtEUR(res.total), 40, y); y += 16;
      doc.text("Adelanto (20%): " + fmtEUR(res.adelanto), 40, y); y += 16;
      doc.text("Restante: " + fmtEUR(res.restante), 40, y); y += 18;
      const extrasTxt = [
        extraSecondDriver ? "· Incluye 2º conductor" : "· 1 conductor",
        extraOvernight ? "· Incluye pernocta" : "· Sin pernocta"
      ].join("  ");
      doc.text(extrasTxt, 40, y); y += 32;

      doc.setFont("helvetica", "italic");
      doc.text("Observaciones: Precios sujetos a ajustes por paradas/esperas y normativa de tiempos de conducción y descanso.", 40, y);

      doc.save(`Solicitud_viaje_${Date.now()}.pdf`);
      pushMessage("agent", "He generado la solicitud en PDF.");
      showToast("PDF generado");
    } catch (err) { console.error(err); showToast("No se pudo generar el PDF"); }
  }

  // ====== NAV / VARIOS ======
  function goBack() { if (history.length > 1) history.back(); else showToast("No hay página anterior"); }
  function moreMenu() { showToast("Opciones: Compartir · Duplicar · Imprimir"); }

  // ====== BINDINGS ======
  window.addEventListener("DOMContentLoaded", () => {
    bootstrapSeedChat(); renderMessages();
    // Real-time sync for chat
    window.addEventListener('storage', (e) => {
      if (e.key === CHAT_KEY) renderMessages();
    });

    el.destino?.addEventListener('change', handleDestinoChange);
    el.origen?.addEventListener('change', handleDestinoChange);

    el.salida?.addEventListener('change', updateDiasAuto);
    el.llegada?.addEventListener('change', updateDiasAuto);

    el.plazas?.addEventListener('input', calcularCoste);

    el.btnPagado?.addEventListener('click', marcarPagado);
    const onGenerate = () => {
      createPendingWithTacho(() => {
        try { generarPDF(); } catch { }
        showToast('Solicitud enviada. Te avisaremos al confirmar.', 1800);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
      });
    };
    el.btnGenerar?.addEventListener('click', onGenerate);
    el.btnGenerarResumen?.addEventListener('click', onGenerate);
    el.btnConfirmar?.addEventListener('click', onConfirmClick);

    // Mensajes enviados por el cliente deben ir con role "client"
    // Messaging logic with role support
    const sendMsg = () => {
      const t = (el.chatInput?.value || "").trim();
      if (!t) return;
      const role = localStorage.getItem('role') || '';
      // Admin sends as 'agent', others (client) as 'client'
      const sender = (role.toLowerCase() === 'admin') ? 'agent' : 'client';
      pushMessage(sender, t);
      el.chatInput.value = "";
    };

    el.chatSend?.addEventListener('click', sendMsg);
    el.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
      }
    });
    el.chatAttach?.addEventListener('click', () => el.chatFile && el.chatFile.click());
    el.chatFile?.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (!f) return;
      const role = localStorage.getItem('role') || '';
      const sender = (role.toLowerCase() === 'admin') ? 'agent' : 'client';
      pushMessage(sender, "Adjunto: " + f.name);
      showToast("Archivo adjuntado: " + f.name);
      e.target.value = "";
    });

    el.btnBack?.addEventListener('click', goBack);
    el.btnMore?.addEventListener('click', moreMenu);

    updateDiasAuto();
    calcularCoste();
  });
})();
