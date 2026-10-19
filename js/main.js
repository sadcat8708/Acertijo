// ========================================
// ESTADO DE LA INVESTIGACIÓN
// ========================================

const views = { off: document.querySelector('#off'), boot: document.querySelector('#boot'), lock: document.querySelector('#lock'), home: document.querySelector('#home'), app: document.querySelector('#app') };
const form = document.querySelector('#form');
const password = document.querySelector('#password');
const message = document.querySelector('#message');
const appTitle = document.querySelector('#apptitle');
const appLabel = document.querySelector('#app-label');
const appText = document.querySelector('#apptext');
const content = document.querySelector('#content');
const alertCount = document.querySelector('#alertcount');
const timer = document.querySelector('#timer');
const corruption = document.querySelector('#corruption');
const fullscreenButton = document.querySelector('#fullscreen');
const powerButton = document.querySelector('#power-button');
const screen = document.querySelector('#screen');
const gpsPanel = document.querySelector('#gps-panel');
const STORAGE_KEY = 'pda-investigation-v3';
const TIMER_KEY = 'pda-investigation-deadline-v3';
const TIMER_DURATION = 48 * 60 * 60 * 1000;
let activeApp = 'ARCHIVOS';
let activeItem = null;
let timerInterval = null;
let memoryProgress = null;
let memoryDeadline = null;
let storageAvailable = true;
let storageWarningShown = false;
let bootSequenceRunning = false;
let bootTimeoutId = null;
const appNames = Object.keys(pdaContent);

const defaultFinalPuzzle = () => ({ phase: 'minefield', minefield: createMinefieldState() });
const defaultProgress = () => ({ powered: false, unlocked: false, stage: 1, solved: [], alertsRead: false, completed: false, failed: false, finalPuzzle: defaultFinalPuzzle(), organizationPuzzle: createOrganizationPuzzleState() });
const readStorage = (key) => {
    try { return localStorage.getItem(key); }
    catch { storageAvailable = false; showStorageWarning(); return null; }
};
const writeStorage = (key, value) => {
    try { localStorage.setItem(key, value); return true; }
    catch { storageAvailable = false; showStorageWarning(); return false; }
};
const removeStorage = (key) => {
    try { localStorage.removeItem(key); return true; }
    catch { storageAvailable = false; showStorageWarning(); return false; }
};
const normalizeProgress = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultProgress();
    const knownPuzzles = new Set(Object.keys(puzzles));
    const solved = Array.isArray(value.solved) ? [...new Set(value.solved.filter((name) => typeof name === 'string' && knownPuzzles.has(name)))] : [];
    const finalState = value.finalPuzzle && typeof value.finalPuzzle === 'object' ? value.finalPuzzle : {};
    const organizationPuzzle = normalizeOrganizationPuzzleState(value.organizationPuzzle, solved.includes('hand'));
    const allowedPhases = ['minefield', 'riddle', 'code', 'complete'];
    const minefield = normalizeMinefieldState(finalState.minefield);
    let finalPhase = solved.includes('finalCode') ? 'complete' : allowedPhases.includes(finalState.phase) && finalState.phase !== 'complete' ? finalState.phase : 'minefield';
    if (['riddle', 'code'].includes(finalPhase) && minefield.status !== 'won') finalPhase = 'minefield';
    return {
        powered: value.powered === true,
        unlocked: value.unlocked === true,
        stage: Number.isInteger(value.stage) ? Math.min(10, Math.max(1, value.stage)) : 1,
        solved,
        alertsRead: value.alertsRead === true,
        completed: value.completed === true,
        failed: value.failed === true,
        finalPuzzle: {
            phase: finalPhase,
            minefield
        },
        organizationPuzzle
    };
};
const getProgress = () => {
    const stored = readStorage(STORAGE_KEY);
    if (stored === null) {
        if (!memoryProgress) memoryProgress = defaultProgress();
        return memoryProgress;
    }
    try {
        const parsed = JSON.parse(stored);
        const normalized = normalizeProgress(parsed);
        if (JSON.stringify(normalized) !== stored) writeStorage(STORAGE_KEY, JSON.stringify(normalized));
        // Keep valid fields from an older or partial save and persist the board seed once.
        memoryProgress = normalized;
        return normalized;
    } catch {
        // Preserve the original bytes before continuing with a fresh in-memory state.
        if (!readStorage(`${STORAGE_KEY}-corrupt-backup`)) {
            writeStorage(`${STORAGE_KEY}-corrupt-backup`, JSON.stringify({ capturedAt: new Date().toISOString(), value: stored }));
        }
        memoryProgress = defaultProgress();
        return memoryProgress;
    }
};
const renderGpsPanel = (progress) => {
    if (!gpsPanel) return;
    const fix = getLatestGpsFix(progress);
    const fixId = fix?.puzzle || '';
    if (gpsPanel.dataset.fix !== fixId) {
        gpsPanel.dataset.fix = fixId;
        gpsPanel.classList.remove('gps-fix-acquired');
        if (fix) {
            void gpsPanel.offsetWidth;
            gpsPanel.classList.add('gps-fix-acquired');
        }
    }
    gpsPanel.dataset.state = fix ? 'fixed' : 'searching';
    gpsPanel.querySelector('.gps-label').textContent = fix ? 'GPS / NAVIGATION' : 'GPS / ERROR DE SINCRONIZACIÓN';
    gpsPanel.querySelector('.gps-status').textContent = fix?.status || 'SEÑAL: BUSCANDO...';
    gpsPanel.querySelector('.gps-location').textContent = fix?.place || 'POSICIÓN: DESCONOCIDA';
    gpsPanel.querySelector('.gps-coordinates').textContent = fix?.coordinates || '--.------, --.------';
};
const saveProgress = (progress) => {
    memoryProgress = normalizeProgress(progress);
    if (!writeStorage(STORAGE_KEY, JSON.stringify(memoryProgress))) showStorageWarning();
    renderGpsPanel(memoryProgress);
    return memoryProgress;
};
const showStorageWarning = () => {
    if (storageWarningShown || storageAvailable) return;
    storageWarningShown = true;
    if (message) {
        message.textContent = '⚠ ALMACENAMIENTO LOCAL NO DISPONIBLE. EL PROGRESO SOLO DURARÁ ESTA SESIÓN.';
        message.className = 'error';
    }
};
const show = (name) => Object.entries(views).forEach(([key, view]) => { view.hidden = key !== name; });
const isUnlocked = (item, progress) => !item.unlock || progress.stage >= item.unlock;

// ========================================
// RELOJ Y TEMPORIZADOR
// ========================================

const updateClock = () => {
    document.querySelector('#clock').textContent = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
};

const formatTime = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `T-${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

const triggerFailure = () => {
    const progress = getProgress();
    if (progress.failed || progress.completed) return;
    saveProgress({ ...progress, failed: true });
    clearInterval(timerInterval);
    corruption.hidden = false;
};

const updateTimer = () => {
    const rawDeadline = readStorage(TIMER_KEY);
    const deadline = rawDeadline === null ? memoryDeadline : Number(rawDeadline);
    if (rawDeadline !== null && (!Number.isFinite(deadline) || deadline <= 0)) {
        timer.textContent = 'TEMPORIZADOR NO DISPONIBLE';
        return;
    }
    if (!deadline) return;
    const remaining = deadline - Date.now();
    timer.textContent = formatTime(remaining);
    if (remaining <= 0) triggerFailure();
};

const startTimer = () => {
    if (!readStorage(TIMER_KEY)) {
        memoryDeadline = Date.now() + TIMER_DURATION;
        writeStorage(TIMER_KEY, String(memoryDeadline));
    }
    updateTimer();
    if (!timerInterval) timerInterval = setInterval(updateTimer, 1000);
};

updateClock();
setInterval(updateClock, 30000);
timer.textContent = 'T-48:00:00';

// ========================================
// ENCENDIDO DE LA PDA
// ========================================

powerButton.onclick = () => {
    if (bootSequenceRunning || getProgress().powered) return;
    bootSequenceRunning = true;
    powerButton.disabled = true;
    saveProgress({ ...getProgress(), powered: true });
    screen.classList.remove('power-off', 'powered-on');
    screen.classList.add('powering-on');
    show('boot');
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    bootTimeoutId = setTimeout(() => {
        bootTimeoutId = null;
        if (!bootSequenceRunning) return;
        bootSequenceRunning = false;
        screen.classList.remove('powering-on');
        screen.classList.add('powered-on');
        show('lock');
        password.focus();
    }, prefersReducedMotion ? 0 : 2900);
};

// ========================================
// ACCESO A LA PDA
// ========================================

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const accessCode = normalizeAnswer(password.value);

    if (accessCode !== 'ARTUROOLMOS') {
        message.textContent = '⚠ ACCESO DENEGADO';
        message.className = 'error';
        password.select();
        return;
    }
    saveProgress({ ...getProgress(), unlocked: true });
    message.textContent = `✓ ACCESO CONCEDIDO · INVESTIGACIÓN PARCIAL RECUPERADA${storageAvailable ? '' : ' · PROGRESO SOLO EN ESTA SESIÓN'}`;
    message.className = storageAvailable ? '' : 'error';
    startTimer();
    setTimeout(showWelcomeMessage, 450);
});

const showWelcomeMessage = () => {
    activeApp = 'MENSAJES';
    activeItem = null;
    appTitle.textContent = 'MENSAJES';
    appLabel.textContent = 'MENSAJE RECUPERADO / ARTURO OLMOS';
    appText.textContent = 'Una comunicación fue recuperada al desbloquear la PDA.';
    content.innerHTML = '<article class="document"><p class="document-id">ARTURO OLMOS / MENSAJE DE INICIO</p><h3>PARA ROMINA</h3><p>Si conseguiste entrar, significa que todavía puedo confiar en ti.</p><p>Los archivos recuperados están disponibles.</p><div class="document-seal">INVESTIGACIÓN ABIERTA</div><button class="record-back" id="continue-investigation">ABRIR ESCRITORIO →</button></article>';
    document.querySelector('#continue-investigation').onclick = () => show('home');
    show('app');
};

// ========================================
// REGISTROS Y ACERTIJOS
// ========================================

const renderList = () => {
    activeItem = null;
    const data = pdaContent[activeApp];
    const progress = getProgress();
    content.innerHTML = `<div class="module-status"><span>PROGRESO ${progress.stage}/10</span><span>REGISTROS RECUPERADOS</span></div><div class="item-list">${data.items.map((item, index) => {
        const available = isUnlocked(item, progress);
        const solved = item.puzzle && progress.solved.includes(item.puzzle);
        const status = !available ? 'BLOQUEADO' : solved ? 'RECUPERADO' : item.status;
        return `<button class="record${available ? '' : ' record-disabled'}" data-index="${index}" ${available ? '' : 'disabled'}><span class="record-icon">${available ? '▧' : '▣'}</span><span class="record-body"><strong>${item.title}</strong><small>${available ? item.text : 'ACCESO RESTRINGIDO'}</small></span><span class="record-status${available ? '' : ' blocked'}">${status}</span></button>`;
    }).join('')}</div>`;
    content.querySelectorAll('.record:not(:disabled)').forEach((record) => record.onclick = () => openRecord(Number(record.dataset.index)));
};

let flagMode = false;
const saveFinalPuzzle = (progress, finalPuzzle) => saveProgress({ ...progress, finalPuzzle });
const renderFinalCodePuzzle = (item, preferredFocus = null) => {
    const progress = getProgress();
    const finalState = progress.solved.includes('finalCode') ? { ...progress.finalPuzzle, phase: 'complete' } : progress.finalPuzzle;
    if (finalState.phase === 'minefield' && finalState.minefield.status === 'won') {
        finalState.phase = 'riddle';
        saveFinalPuzzle(progress, finalState);
    }

    if (finalState.phase === 'minefield') {
        const state = finalState.minefield;
        const board = createForensicBoard(state.mineIndices);
        const safeRemaining = FORENSIC_CELL_COUNT - FORENSIC_MINE_COUNT - state.revealed.filter((index) => !board[index].mine).length;
        content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document forensic-document"><p class="document-id">ARCHIVOS / ARTURO_OLMOS_FINAL / ANÁLISIS FORENSE</p><h3>SECTORES CORRUPTOS</h3><p>Tu primera selección es segura. Revela los sectores seguros; los números indican cuántos sectores corruptos hay alrededor. Activa el modo bandera para marcar o retirar una marca. Una bandera no revela una casilla.</p><div class="forensic-toolbar"><button type="button" id="flag-mode" aria-pressed="${flagMode}">${flagMode ? 'MODO BANDERA: ACTIVO' : 'MODO BANDERA: INACTIVO'}</button><span>SEGURAS: ${safeRemaining} · BANDERAS: ${state.flags.length}/${FORENSIC_MINE_COUNT}</span></div><div class="minefield${state.status === 'failed' ? ' minefield-failed' : ''}" role="group" aria-label="Buscaminas forense de 8 por 8">${board.map((cell, index) => {
            const revealed = state.revealed.includes(index);
            const flagged = state.flags.includes(index);
            const showMine = cell.mine && (state.status === 'failed' || (revealed && state.status === 'failed'));
            const label = showMine ? `Casilla ${index + 1}: sector corrupto` : revealed ? `Casilla ${index + 1}: ${cell.count ? `${cell.count} sectores corruptos vecinos` : 'segura, sin vecinos corruptos'}` : flagged ? `Casilla ${index + 1}: marcada con bandera` : `Casilla ${index + 1}: oculta`;
            const value = showMine ? '✹' : revealed ? (cell.count || '') : flagged ? '⚑' : '';
            const classes = ['mine-cell', revealed ? 'mine-revealed' : 'mine-hidden', flagged ? 'mine-flagged' : '', showMine ? 'mine-corrupt' : '', revealed && cell.count ? `mine-number-${cell.count}` : ''].filter(Boolean).join(' ');
            return `<button type="button" class="${classes}" data-cell="${index}" aria-label="${label}" ${revealed || state.status !== 'active' ? 'disabled' : ''}>${value}</button>`;
        }).join('')}</div><p id="minefield-message" class="forensic-message" role="status" aria-live="polite">${state.status === 'failed' ? 'SECTOR CORRUPTO DETECTADO. Puedes repetir el puzzle para probar otra distribución.' : 'ANÁLISIS EN CURSO. Todas las casillas seguras deben quedar reveladas.'}</p><button type="button" id="restart-minefield" class="record-back">REPETIR PUZZLE · NUEVO TABLERO DE PRUEBA</button></article>`;
        document.querySelector('#record-back').onclick = renderList;
        const modeButton = document.querySelector('#flag-mode');
        modeButton.onclick = () => { flagMode = !flagMode; renderFinalCodePuzzle(item, 'flag-mode'); };
        content.querySelectorAll('[data-cell]').forEach((cellButton) => {
            cellButton.onclick = () => {
                const index = Number(cellButton.dataset.cell);
                const current = getProgress();
                const currentState = current.finalPuzzle;
                currentState.minefield = flagMode
                    ? toggleMinefieldFlag(currentState.minefield, index)
                    : revealMinefieldCell(currentState.minefield, index, board);
                if (currentState.minefield.status === 'won') {
                    const advanced = advanceForensicPhase(current, 'riddle');
                    if (advanced) current.finalPuzzle = advanced.finalPuzzle;
                    flagMode = false;
                }
                saveFinalPuzzle(current, currentState);
                renderFinalCodePuzzle(item, index);
            };
        });
        const restartButton = document.querySelector('#restart-minefield');
        if (restartButton) restartButton.onclick = () => {
            const current = getProgress();
            const reset = resetForensicBoardProgress(current);
            flagMode = false;
            saveProgress(reset);
            renderFinalCodePuzzle(item, 'flag-mode');
        };
        const focusTarget = preferredFocus === 'flag-mode' ? modeButton : content.querySelector(`[data-cell="${preferredFocus}"]`);
        if (focusTarget && !focusTarget.disabled) focusTarget.focus();
        else content.querySelector('[data-cell]:not(:disabled)')?.focus();
        return;
    }

    if (finalState.phase === 'riddle') {
        content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document forensic-document"><p class="document-id">ARTURO_OLMOS_FINAL / SEGUNDA VERIFICACIÓN</p><h3>LA EVIDENCIA RECUPERADA</h3><p>«No soy una joya cualquiera, aunque puedo brillar en un anillo. Mi color recuerda a la selva y mi historia está ligada a una riqueza que muchos persiguieron. ¿Qué soy?»</p><form id="emerald-riddle-form" class="forensic-form"><label for="emerald-riddle-answer">RESPUESTA</label><input id="emerald-riddle-answer" autocomplete="off" required><button>COMPROBAR</button></form><p id="emerald-riddle-message" class="forensic-message" role="status" aria-live="polite"></p></article>`;
        document.querySelector('#record-back').onclick = renderList;
        document.querySelector('#emerald-riddle-answer').focus();
        document.querySelector('#emerald-riddle-form').onsubmit = (event) => {
            event.preventDefault();
            const answer = document.querySelector('#emerald-riddle-answer').value;
            const result = document.querySelector('#emerald-riddle-message');
            if (!validateEmeraldKey(answer)) { result.textContent = 'RESPUESTA INCORRECTA. Puedes intentarlo de nuevo.'; result.className = 'forensic-message error'; document.querySelector('#emerald-riddle-answer').focus(); return; }
            const current = getProgress();
            const advanced = advanceForensicPhase(current, 'code');
            if (!advanced) return;
            saveProgress(advanced);
            renderFinalCodePuzzle(item);
        };
        return;
    }

    if (finalState.phase === 'code') {
        content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document forensic-document"><p class="document-id">ARTURO_OLMOS_FINAL / ACCESO RESTRINGIDO</p><h3>CLAVE DEL ARCHIVO</h3><p>Recuerda las palabras del acertijo:</p><p>«No soy una joya cualquiera, aunque puedo brillar en un anillo. Mi color recuerda a la selva y mi historia está ligada a una riqueza que muchos persiguieron. ¿Qué soy?»</p><p>Introduce la respuesta para desbloquear el registro de Arturo.</p><form id="final-code-form" class="forensic-form"><label for="final-code-answer">PALABRA CLAVE</label><input id="final-code-answer" autocomplete="off" required><button>DESBLOQUEAR ARCHIVO</button></form><p id="final-code-message" class="forensic-message" role="status" aria-live="polite"></p></article>`;
        document.querySelector('#record-back').onclick = renderList;
        document.querySelector('#final-code-answer').focus();
        document.querySelector('#final-code-form').onsubmit = (event) => {
            event.preventDefault();
            const answer = document.querySelector('#final-code-answer').value;
            const result = document.querySelector('#final-code-message');
            if (!validateEmeraldKey(answer)) { result.textContent = 'CLAVE INCORRECTA. El archivo continúa bloqueado.'; result.className = 'forensic-message error'; document.querySelector('#final-code-answer').focus(); return; }
            const advanced = advanceForensicPhase(getProgress(), 'complete', answer);
            if (!advanced) return;
            if (!solvePuzzle('finalCode', answer)) return;
            renderFinalCodePuzzle(item);
        };
        return;
    }

    content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document"><p class="document-id">${activeApp} / ${String(pdaContent.ARCHIVOS.items.indexOf(item) + 1).padStart(3, '0')}</p><h3>${item.title}</h3><p>${item.text}</p><div class="document-seal">✓ ${puzzles.finalCode.success}</div></article>`;
    document.querySelector('#record-back').onclick = renderList;
};

const openRecord = (index) => {
    const progress = getProgress();
    if (!progress.unlocked) return;
    activeItem = index;
    const item = pdaContent[activeApp].items[index];
    if (!item || !isUnlocked(item, progress)) { activeItem = null; return; }
    const puzzle = item.puzzle ? puzzles[item.puzzle] : null;
    const solved = puzzle && getProgress().solved.includes(item.puzzle);

    if (item.puzzle === 'hand') {
        renderOrganizationPuzzle(item);
        return;
    }

    if (item.puzzle === 'finalCode') {
        flagMode = false;
        renderFinalCodePuzzle(item);
        return;
    }

    if (item.title === 'DIRECCIÓN') {
        content.innerHTML = '<article class="document document-locked"><p class="document-id">ARCHIVO FINAL / DIRECCIÓN</p><h3>ACCESO DENEGADO</h3><p>IDENTIDAD DEL LÍDER: ████████████████</p><div class="document-seal">⚠ NUEVO USUARIO DETECTADO<br>USUARIO: DESCONOCIDO<br>ORGANIZACIÓN: LA MANO NEGRA<br>CONEXIÓN REMOTA ESTABLECIDA...</div><p class="document-placeholder">CONEXIÓN PERDIDA<br><br>“La verdad fue descubierta.<br>El responsable todavía no.”</p></article>';
        return;
    }

    if (item.reset) {
        content.innerHTML = '<article class="document document-locked"><p class="document-id">SEGURIDAD / RESTABLECIMIENTO</p><h3>REINICIAR INVESTIGACIÓN</h3><p>Se reiniciarán el progreso guardado y el tiempo restante. El navegador pedirá confirmación.</p><form id="reset-form"><button>REINICIAR PROGRESO</button></form></article>';
        document.querySelector('#reset-form').onsubmit = (event) => {
            event.preventDefault();
            resetInvestigation();
        };
        return;
    }
    const cipherTable = item.puzzle === 'caesar' ? `<div class="cipher-table"><span>LETRA APARENTE</span><strong>${puzzle.cipher}</strong><span>LETRA FINAL</span><strong>?</strong></div>` : '';
    const routeMap = item.puzzle === 'route' ? `<div class="route-map" aria-label="Mapa de las tres ubicaciones"><p class="route-map-heading">MAPA RECUPERADO / RUTA DE ARTURO</p><div class="route-area"><svg viewBox="0 0 300 220" preserveAspectRatio="none" aria-hidden="true"><g id="route-connections"></g></svg><div class="route-seal" id="route-seal" role="status" aria-live="polite" hidden><span>✓</span><small>RUTA VERIFICADA</small></div><button class="map-point point-lajas" data-place="LAS LAJAS" aria-pressed="false">LAS LAJAS</button><button class="map-point point-colon" data-place="TEATRO COLON" aria-pressed="false">TEATRO COLÓN</button><button class="map-point point-perdida" data-place="CIUDAD PERDIDA" aria-pressed="false">CIUDAD<br>PERDIDA</button></div><p class="route-selection" id="route-selection">UBICACIONES: 0/3 · CONEXIONES: 0/2</p><p class="route-state" id="route-state" role="status" aria-live="polite">SIN CONEXIONES REGISTRADAS</p><button class="route-reset" id="route-reset" type="button">LIMPIAR RUTA</button></div>` : '';
    const evidence = item.image || item.note || item.seal ? `<div class="evidence-file">${item.image ? `<button class="view-image" data-image="${item.image}" data-label="${item.title}" data-puzzle="${item.puzzle || ''}">▧ VER IMAGEN</button>` : ''}${item.note ? `<div class="arturo-note">${item.seal ? `<img src="${item.seal}" alt="Sello de archivo desconocido">` : ''}<p>${item.note.replace(/\n/g, '<br>')}</p></div>` : ''}</div>` : '';
    content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document"><p class="document-id">${activeApp} / ${String(index + 1).padStart(3, '0')}</p><h3>${item.title}</h3><p>${item.text}</p>${evidence}${cipherTable}${routeMap}${puzzle && !solved ? `<div class="puzzle"><p>${puzzle.prompt}</p>${item.puzzle === 'mark' || item.puzzle === 'route' ? '' : '<form id="puzzle-form"><input id="puzzle-answer" autocomplete="off" placeholder="RESPUESTA"><button>VALIDAR</button></form>'}<p id="puzzle-message"></p></div>` : '<div class="document-seal">✓ REGISTRO RECUPERADO</div>'}</article>`;
    document.querySelector('#record-back').onclick = renderList;
    content.querySelectorAll('.view-image').forEach((button) => button.onclick = () => showImageViewer(button.dataset.image, button.dataset.label, button.dataset.puzzle));
    if (item.puzzle === 'route') setupRouteMap(solved);
    if (puzzle && !solved && item.puzzle !== 'mark' && item.puzzle !== 'route') document.querySelector('#puzzle-form').onsubmit = (event) => { event.preventDefault(); solvePuzzle(item.puzzle, document.querySelector('#puzzle-answer').value); };
};

const showImageViewer = (source, label, puzzleName = '') => {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    const interactive = puzzleName === 'mark';
    viewer.innerHTML = `<div class="image-viewer-panel"><button class="close-viewer" aria-label="Cerrar imagen">×</button><p>${label}</p><img class="${interactive ? 'interactive-evidence' : ''}" src="${source}" alt="${label}"></div>`;
    viewer.onclick = (event) => { if (event.target === viewer || event.target.closest('.close-viewer')) viewer.remove(); };
    viewer.querySelector('img').addEventListener('error', () => {
        const notice = document.createElement('p');
        notice.className = 'image-error';
        notice.textContent = 'NO SE PUDO CARGAR ESTA EVIDENCIA.';
        viewer.querySelector('img').replaceWith(notice);
    }, { once: true });

    if (interactive) {
        viewer.querySelector('.interactive-evidence').onclick = () => {
            viewer.remove();
            solvePuzzle('mark');
        };
    }

    document.body.append(viewer);
};

const organizationTileSvg = (index, rotation) => {
    const points = { 0: ['50 50', '50 8'], 1: ['50 50', '92 50'], 2: ['50 50', '50 92'], 3: ['50 50', '8 50'] };
    const connectors = getOrganizationTileConnections(index, rotation);
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${connectors.map((direction) => `<path d="M${points[direction][0]} L${points[direction][1]}"/><circle cx="${points[direction][1].split(' ')[0]}" cy="${points[direction][1].split(' ')[1]}" r="5"/>`).join('')}<circle class="circuit-hub" cx="50" cy="50" r="7"/></svg>`;
};
const renderOrganizationPuzzle = (item, focusIndex = null) => {
    const progress = getProgress();
    const state = progress.organizationPuzzle;
    if (!isOrganizationPuzzleConfigurationValid()) {
        content.innerHTML = '<article class="document forensic-document"><p class="document-id">MENSAJES / DIAGNÓSTICO</p><h3>SISTEMA NO DISPONIBLE</h3><p>No se pudo validar la configuración del circuito.</p></article>';
        return;
    }
    const directions = ['norte', 'este', 'sur', 'oeste'];
    const grid = state.rotations.map((rotation, index) => `<button type="button" class="organization-tile${focusIndex === index ? ' organization-tile-turned' : ''}" data-org-tile="${index}" aria-label="Módulo ${String(index + 1).padStart(2, '0')}, orientación ${rotation * 90} grados. Conexiones: ${getOrganizationTileConnections(index, rotation).map((direction) => directions[direction]).join(' y ')}. Girar 90 grados en sentido horario" ${state.repaired ? 'disabled' : ''}><small>${String(index + 1).padStart(2, '0')}</small>${organizationTileSvg(index, rotation)}<span class="organization-angle">ORI ${rotation * 90}°</span></button>`).join('');
    const revelation = state.repaired
        ? `<p class="organization-system-restored" role="status">SISTEMA RESTAURADO</p><p class="organization-endpoint">← ENTRADA DE ENERGÍA · MÓDULO 01</p><div class="organization-grid organization-grid-restored" role="group" aria-label="Circuito restaurado">${grid}</div><p class="organization-endpoint organization-endpoint-output">MÓDULO 09 · SALIDA DEL SISTEMA →</p><section class="organization-revelation" aria-live="polite"><h4>LA MANO NEGRA</h4></section>${state.passwordAccepted ? `<p class="forensic-message">ACCESO CONFIRMADO. ${puzzles.hand.success}</p>` : '<div id="organization-password-stage" class="organization-password-stage" hidden><p>Introduce la contraseña de la organización identificada para continuar.</p><form id="organization-password-form" class="forensic-form"><label for="organization-password">CONTRASEÑA DE LA ORGANIZACIÓN</label><input id="organization-password" type="password" autocomplete="off" required><button>VERIFICAR ACCESO</button></form><p id="organization-password-message" class="forensic-message" role="status" aria-live="polite"></p></div>'}`
        : `<p class="organization-instructions">Pulsa un módulo para girarlo 90° y reconstruir el circuito.</p><p class="organization-endpoint">← ENTRADA DE ENERGÍA · MÓDULO 01</p><div class="organization-grid" role="group" aria-label="Circuito de nueve módulos; pulsa un módulo para girarlo">${grid}</div><p class="organization-endpoint organization-endpoint-output">MÓDULO 09 · SALIDA DEL SISTEMA →</p><p class="organization-hint">Las conexiones deben coincidir entre vecinos. Solo la entrada y la salida pueden llegar al borde exterior.</p><p id="organization-message" class="forensic-message" role="status" aria-live="polite">${state.status === 'interrupted' ? 'CONEXIÓN INTERRUMPIDA · Revisa los conectores y vuelve a comprobar.' : 'SISTEMA EN ESPERA · Orienta los módulos y verifica la red.'}</p><div class="organization-controls"><button type="button" id="verify-organization-system" class="record-back">VERIFICAR SISTEMA</button><button type="button" id="reset-organization-puzzle" class="record-back">REINICIAR ROMPECABEZAS</button></div>`;
    content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document forensic-document"><p class="document-id">MENSAJES / ARTURO_OLMOS / RESTAURACIÓN DE RED</p><h3>ORGANIZACIÓN IDENTIFICADA</h3><p>El último mensaje de Arturo llegó fragmentado. Restaura la conexión para recuperar la identificación.</p>${revelation}</article>`;
    document.querySelector('#record-back').onclick = renderList;
    if (!state.repaired) {
        content.querySelectorAll('[data-org-tile]').forEach((button) => button.onclick = () => {
            const current = getProgress();
            const updated = rotateOrganizationTile(current.organizationPuzzle, Number(button.dataset.orgTile));
            saveProgress({ ...current, organizationPuzzle: updated });
            renderOrganizationPuzzle(item, Number(button.dataset.orgTile));
        });
        document.querySelector('#verify-organization-system').onclick = () => {
            const current = getProgress();
            const verified = verifyOrganizationNetwork(current.organizationPuzzle);
            saveProgress({ ...current, organizationPuzzle: verified });
            renderOrganizationPuzzle(item);
        };
        document.querySelector('#reset-organization-puzzle').onclick = () => {
            saveProgress(resetOrganizationPuzzleProgress(getProgress()));
            renderOrganizationPuzzle(item);
        };
        if (Number.isInteger(focusIndex)) content.querySelector(`[data-org-tile="${focusIndex}"]`)?.focus();
    } else if (!state.passwordAccepted) {
        setTimeout(() => {
            const stage = document.querySelector('#organization-password-stage');
            if (stage) {
                stage.hidden = false;
                document.querySelector('#organization-password')?.focus();
            }
        }, 700);
        document.querySelector('#organization-password-form').onsubmit = (event) => {
            event.preventDefault();
            const result = document.querySelector('#organization-password-message');
            const circuitPasswordInput = document.querySelector('#organization-password');
            if (normalizeAnswer(circuitPasswordInput.value) !== normalizeAnswer('LA MANO NEGRA')) {
                result.textContent = 'CONTRASEÑA INCORRECTA. Vuelve a intentarlo.';
                result.className = 'forensic-message error';
                circuitPasswordInput.select();
                return;
            }
            const current = getProgress();
            saveProgress({ ...current, organizationPuzzle: { ...current.organizationPuzzle, passwordAccepted: true } });
            if (!current.solved.includes('hand')) solvePuzzle('hand', 'LA MANO NEGRA');
            renderOrganizationPuzzle(item);
        };
    }
};

const setupRouteMap = (alreadySolved = false) => {
    const selection = alreadySolved ? [...ROUTE_SEQUENCE] : [];
    const output = document.querySelector('#route-selection');
    const stateOutput = document.querySelector('#route-state');
    const connections = document.querySelector('#route-connections');
    const routeMap = document.querySelector('.route-map');
    const seal = document.querySelector('#route-seal');
    const positions = { 'LAS LAJAS': [60, 178], 'TEATRO COLON': [150, 42], 'CIUDAD PERDIDA': [240, 178] };
    const routeLines = [['LAS LAJAS', 'TEATRO COLON'], ['TEATRO COLON', 'CIUDAD PERDIDA']];

    const updateRoute = () => {
        const route = getRouteProgress(selection);
        connections.innerHTML = routeLines.map(([from, to], index) => {
            const [x1, y1] = positions[from];
            const [x2, y2] = positions[to];
            return `<path class="route-edge" data-state="${route.edgeStates[index]}" d="M${x1} ${y1} L${x2} ${y2}" pathLength="1"/>`;
        }).join('');
        content.querySelectorAll('.map-point').forEach((point) => {
            const selected = selection.includes(point.dataset.place);
            const connected = route.edges.some(([from, to]) => from === point.dataset.place || to === point.dataset.place);
            point.classList.toggle('selected', selected);
            point.classList.toggle('route-connected', connected);
            point.setAttribute('aria-pressed', String(selected));
            point.disabled = selected || route.complete;
        });
        output.textContent = `UBICACIONES: ${selection.length}/3 · CONEXIONES: ${route.edges.length}/2`;
        if (route.complete) stateOutput.textContent = 'RUTA VERIFICADA';
        else if (selection.length === 3) {
            stateOutput.textContent = 'SECUENCIA INCORRECTA · LIMPIA LA RUTA Y VUELVE A INTENTARLO';
            stateOutput.classList.add('error');
        } else if (route.edges.length) {
            stateOutput.textContent = `CONEXIÓN COMPLETADA · ${route.edges.length}/2`;
            stateOutput.classList.remove('error');
        } else if (selection.length) {
            stateOutput.textContent = 'UBICACIÓN SELECCIONADA · CONTINÚA LA SECUENCIA';
            stateOutput.classList.remove('error');
        } else {
            stateOutput.textContent = 'SIN CONEXIONES REGISTRADAS';
            stateOutput.classList.remove('error');
        }
        return route;
    };

    updateRoute();
    if (alreadySolved) {
        routeMap.classList.add('route-map-complete');
        seal.hidden = false;
        document.querySelector('#route-reset').disabled = true;
    }

    content.querySelectorAll('.map-point').forEach((point) => {
        point.onclick = () => {
            if (alreadySolved || selection.length === 3) return;

            selection.push(point.dataset.place);
            const route = updateRoute();
            if (selection.length === 3) {
                const solved = route.complete && solvePuzzle('route', selection.join(' '));
                if (solved) {
                    routeMap.classList.add('route-map-complete');
                    seal.hidden = false;
                    document.querySelector('#route-reset').disabled = true;
                    stateOutput.textContent = 'RUTA VERIFICADA · DESTINO CONFIRMADO';
                    stateOutput.classList.remove('error');
                }
            }
        };
    });

    document.querySelector('#route-reset').onclick = () => {
        selection.length = 0;
        updateRoute();
    };
};

const solvePuzzle = (puzzleName, answer = 'LA MANO NEGRA') => {
    const puzzle = puzzles[puzzleName];
    const result = document.querySelector('#puzzle-message');
    if (!puzzle) return false;
    const progress = getProgress();
    if (progress.solved.includes(puzzleName)) return false;
    if (!validatePuzzleAnswer(answer, puzzle)) {
        if (result) { result.textContent = 'RESPUESTA INCORRECTA.'; result.className = 'error'; }
        return false;
    }
    progress.solved.push(puzzleName);
    progress.stage = Math.min(10, progress.stage + 1);
    if (puzzleName === 'mark') alertCount.textContent = '1';
    if (puzzleName === 'truth') { progress.completed = true; removeStorage(TIMER_KEY); clearInterval(timerInterval); timer.textContent = 'PROTOCOLO CANCELADO'; }
    saveProgress(progress);
    if (result) {
        result.textContent = `${puzzleName === 'mark'
            ? `✓ ${puzzle.success} ⚠ ALERTA DE SEGURIDAD: ACCESO NO AUTORIZADO DETECTADO. PROTOCOLO DE PROTECCIÓN ACTIVADO.`
            : `✓ ${puzzle.success}`}${storageAvailable ? '' : ' ⚠ PROGRESO SOLO EN ESTA SESIÓN.'}`;
        result.className = storageAvailable ? 'success' : 'error';
    }
    const solvedApp = activeApp;
    const solvedItem = activeItem;
    if (result && puzzleName !== 'route') setTimeout(() => { if (activeApp === solvedApp && activeItem === solvedItem && !views.app.hidden) renderList(); }, 1000);
    return true;
};

const openApp = (name) => {
    if (!getProgress().unlocked || !pdaContent[name]) return;
    activeApp = name;
    activeItem = null;
    appTitle.textContent = name;
    appLabel.textContent = pdaContent[name].label;
    appText.textContent = pdaContent[name].description;
    renderList();
    show('app');
};
document.querySelectorAll('.apps button').forEach((button) => button.onclick = () => openApp(button.dataset.app));

// ========================================
// CONTROLES, ALERTAS Y PANTALLA COMPLETA
// ========================================

document.querySelector('#back').onclick = () => {
    if (bootSequenceRunning) return;
    activeItem === null ? show('home') : renderList();
};

document.querySelector('#homebutton').onclick = () => {
    if (bootSequenceRunning) return;
    const progress = getProgress();
    show(!progress.powered ? 'off' : progress.unlocked ? 'home' : 'lock');
};
document.querySelector('#previousbutton').onclick = () => {
    if (bootSequenceRunning) return;
    if (!views.app.hidden && activeItem !== null) {
        renderList();
    } else if (!views.app.hidden) {
        const index = appNames.indexOf(activeApp);
        openApp(appNames[(index - 1 + appNames.length) % appNames.length]);
    } else if (!views.home.hidden) {
        openApp(appNames[appNames.length - 1]);
    }
};
document.querySelector('#nextbutton').onclick = () => {
    if (bootSequenceRunning) return;
    if (!getProgress().unlocked) return;
    if (views.home.hidden && views.app.hidden) { show('home'); return; }
    const index = views.app.hidden ? -1 : appNames.indexOf(activeApp);
    openApp(appNames[(index + 1) % appNames.length]);
};
document.querySelector('#enter').onclick = () => {
    if (bootSequenceRunning) return;
    if (!views.off.hidden) powerButton.click();
    else if (!views.lock.hidden) form.requestSubmit();
    else if (!views.home.hidden) openApp(appNames[0]);
    else if (!views.app.hidden && activeItem === null) {
        const firstAvailable = pdaContent[activeApp].items.findIndex((item) => isUnlocked(item, getProgress()));
        if (firstAvailable >= 0) openRecord(firstAvailable);
    }
};
document.querySelector('#alerts').onclick = () => {
    if (bootSequenceRunning) return;
    if (getProgress().stage < 3) return;

    alertCount.textContent = '0';
    saveProgress({ ...getProgress(), alertsRead: true });
    openApp('MENSAJES');
};

const resetInvestigation = () => {
    if (!window.confirm('¿Deseas borrar todo el progreso de la investigación?')) return;

    removeStorage(STORAGE_KEY);
    removeStorage(TIMER_KEY);
    removeStorage(`${STORAGE_KEY}-corrupt-backup`);
    removeStorage('pda-investigation-v1');
    removeStorage('pda-investigation-v2');
    removeStorage('pda-deadline-after-unlock');
    removeStorage('pda-deadline-test-1min');
    memoryProgress = defaultProgress();
    memoryDeadline = null;
    window.location.reload();
};

document.querySelector('#restart-failure').onclick = resetInvestigation;

fullscreenButton.onclick = async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        fullscreenButton.title = 'Pantalla completa no disponible en este navegador';
    }
};

document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? '×' : '⛶';
});

const initial = getProgress();
renderGpsPanel(initial);
showStorageWarning();
alertCount.textContent = initial.alertsRead || initial.stage < 3 ? '0' : '1';
if (initial.failed) corruption.hidden = false;
else if (!initial.powered) { screen.classList.add('power-off'); show('off'); }
else {
    screen.classList.remove('power-off');
    screen.classList.add('powered-on');
    if (initial.unlocked) show('home');
    else show('lock');
}
if (readStorage(TIMER_KEY) && !initial.completed) startTimer();
