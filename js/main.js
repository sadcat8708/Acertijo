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
const STORAGE_KEY = 'pda-investigation-v3';
const TIMER_KEY = 'pda-investigation-deadline-v3';
const TIMER_DURATION = 48 * 60 * 60 * 1000;
const TEST_RESET_CODE = 'PRUEBARESET';
let activeApp = 'ARCHIVOS';
let activeItem = null;
let timerInterval = null;

const defaultProgress = () => ({ powered: false, unlocked: false, stage: 1, solved: [], alertsRead: false, completed: false, failed: false });
const getProgress = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultProgress();
const saveProgress = (progress) => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
    const deadline = Number(localStorage.getItem(TIMER_KEY));
    if (!deadline) return;
    const remaining = deadline - Date.now();
    timer.textContent = formatTime(remaining);
    if (remaining <= 0) triggerFailure();
};

const startTimer = () => {
    if (!localStorage.getItem(TIMER_KEY)) localStorage.setItem(TIMER_KEY, String(Date.now() + TIMER_DURATION));
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
    saveProgress({ ...getProgress(), powered: true });
    show('boot');
    setTimeout(() => show('lock'), 1500);
};

// ========================================
// ACCESO A LA PDA
// ========================================

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const accessCode = normalizeAnswer(password.value);

    if (accessCode === TEST_RESET_CODE) {
        resetInvestigation(true);
        return;
    }

    if (accessCode !== 'ARTUROOLMOS') {
        message.textContent = '⚠ ACCESO DENEGADO';
        message.className = 'error';
        password.select();
        return;
    }
    saveProgress({ ...getProgress(), unlocked: true });
    message.textContent = '✓ ACCESO CONCEDIDO · INVESTIGACIÓN PARCIAL RECUPERADA';
    message.className = '';
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
        return `<button class="record${available ? '' : ' record-disabled'}" data-index="${index}" ${available ? '' : 'disabled'}><span class="record-icon">${available ? '▧' : '▣'}</span><span class="record-body"><strong>${item.title}</strong><small>${available ? item.text : 'ACCESO RESTRINGIDO'}</small></span><span class="record-status${available ? '' : ' blocked'}">${available ? item.status : 'BLOQUEADO'}</span></button>`;
    }).join('')}</div>`;
    content.querySelectorAll('.record:not(:disabled)').forEach((record) => record.onclick = () => openRecord(Number(record.dataset.index)));
};

const openRecord = (index) => {
    activeItem = index;
    const item = pdaContent[activeApp].items[index];
    const puzzle = item.puzzle ? puzzles[item.puzzle] : null;
    const solved = puzzle && getProgress().solved.includes(item.puzzle);

    if (item.title === 'DIRECCIÓN') {
        content.innerHTML = '<article class="document document-locked"><p class="document-id">ARCHIVO FINAL / DIRECCIÓN</p><h3>ACCESO DENEGADO</h3><p>IDENTIDAD DEL LÍDER: ████████████████</p><div class="document-seal">⚠ NUEVO USUARIO DETECTADO<br>USUARIO: DESCONOCIDO<br>ORGANIZACIÓN: LA MANO NEGRA<br>CONEXIÓN REMOTA ESTABLECIDA...</div><p class="document-placeholder">CONEXIÓN PERDIDA<br><br>“La verdad fue descubierta.<br>El responsable todavía no.”</p></article>';
        return;
    }

    if (item.reset) {
        content.innerHTML = '<article class="document document-locked"><p class="document-id">SEGURIDAD / RESTABLECIMIENTO</p><h3>REINICIAR INVESTIGACIÓN</h3><p>Esta acción borrará los archivos desbloqueados, las respuestas y el tiempo restante.</p><form id="reset-form"><label for="reset-code">CÓDIGO DE PRUEBA</label><input id="reset-code" autocomplete="off" placeholder="CÓDIGO"><button>BORRAR PROGRESO</button></form><p id="reset-message"></p></article>';
        document.querySelector('#reset-form').onsubmit = (event) => {
            event.preventDefault();
            const resetCode = normalizeAnswer(document.querySelector('#reset-code').value);

            if (resetCode === TEST_RESET_CODE) {
                resetInvestigation(true);
                return;
            }

            document.querySelector('#reset-message').textContent = 'CÓDIGO INCORRECTO';
            document.querySelector('#reset-message').className = 'error';
        };
        return;
    }
    const cipherTable = item.puzzle === 'caesar' ? `<div class="cipher-table"><span>LETRA APARENTE</span><strong>${puzzle.cipher}</strong><span>LETRA FINAL</span><strong>?</strong></div>` : '';
    const routeMap = item.puzzle === 'route' ? `<div class="route-map" aria-label="Mapa de las tres ubicaciones"><p>MAPA RECUPERADO</p><div class="route-area"><svg viewBox="0 0 300 190" aria-hidden="true"><path d="M54 133 L151 48 L246 132 Z"/></svg><button class="map-point point-lajas" data-place="LAS LAJAS">LAS LAJAS</button><button class="map-point point-colon" data-place="TEATRO COLON">TEATRO COLÓN</button><button class="map-point point-perdida" data-place="CIUDAD PERDIDA">CIUDAD<br>PERDIDA</button></div><p class="route-selection" id="route-selection">UBICACIONES MARCADAS: 0/3</p><button class="route-reset" id="route-reset" type="button">LIMPIAR RUTA</button></div>` : '';
    const evidence = item.image || item.note || item.seal ? `<div class="evidence-file">${item.image ? `<button class="view-image" data-image="${item.image}" data-label="${item.title}" data-puzzle="${item.puzzle || ''}">▧ VER IMAGEN</button>` : ''}${item.note ? `<div class="arturo-note">${item.seal ? `<img src="${item.seal}" alt="Sello de archivo desconocido">` : ''}<p>${item.note.replace(/\n/g, '<br>')}</p></div>` : ''}</div>` : '';
    content.innerHTML = `<button class="record-back" id="record-back">← LISTA DE REGISTROS</button><article class="document"><p class="document-id">${activeApp} / ${String(index + 1).padStart(3, '0')}</p><h3>${item.title}</h3><p>${item.text}</p>${evidence}${cipherTable}${routeMap}${puzzle && !solved ? `<div class="puzzle"><p>${puzzle.prompt}</p>${item.puzzle === 'mark' || item.puzzle === 'route' ? '' : '<form id="puzzle-form"><input id="puzzle-answer" autocomplete="off" placeholder="RESPUESTA"><button>VALIDAR</button></form>'}<p id="puzzle-message"></p></div>` : '<div class="document-seal">✓ REGISTRO RECUPERADO</div>'}</article>`;
    document.querySelector('#record-back').onclick = renderList;
    content.querySelectorAll('.view-image').forEach((button) => button.onclick = () => showImageViewer(button.dataset.image, button.dataset.label, button.dataset.puzzle));
    if (item.puzzle === 'route' && !solved) setupRouteMap();
    if (puzzle && !solved && item.puzzle !== 'mark' && item.puzzle !== 'route') document.querySelector('#puzzle-form').onsubmit = (event) => { event.preventDefault(); solvePuzzle(item.puzzle, document.querySelector('#puzzle-answer').value); };
};

const showImageViewer = (source, label, puzzleName = '') => {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    const interactive = puzzleName === 'mark';
    viewer.innerHTML = `<div class="image-viewer-panel"><button class="close-viewer" aria-label="Cerrar imagen">×</button><p>${label}</p><img class="${interactive ? 'interactive-evidence' : ''}" src="${source}" alt="${label}"></div>`;
    viewer.onclick = (event) => { if (event.target === viewer || event.target.closest('.close-viewer')) viewer.remove(); };

    if (interactive) {
        viewer.querySelector('.interactive-evidence').onclick = () => {
            viewer.remove();
            solvePuzzle('mark');
        };
    }

    document.body.append(viewer);
};

const setupRouteMap = () => {
    const selection = [];
    const output = document.querySelector('#route-selection');

    const updateRoute = () => {
        output.textContent = `UBICACIONES MARCADAS: ${selection.length}/3`;
    };

    content.querySelectorAll('.map-point').forEach((point) => {
        point.onclick = () => {
            if (selection.length === 3) return;

            selection.push(point.dataset.place);
            point.classList.add('selected');
            point.disabled = true;
            updateRoute();
            if (selection.length === 3) solvePuzzle('route', selection.join(' '));
        };
    });

    document.querySelector('#route-reset').onclick = () => {
        selection.length = 0;
        content.querySelectorAll('.map-point').forEach((point) => {
            point.classList.remove('selected');
            point.disabled = false;
        });
        updateRoute();
    };
};

const solvePuzzle = (puzzleName, answer = 'LA MANO NEGRA') => {
    const puzzle = puzzles[puzzleName];
    const result = document.querySelector('#puzzle-message');
    if (!validatePuzzleAnswer(answer, puzzle)) { result.textContent = 'RESPUESTA INCORRECTA.'; result.className = 'error'; return; }
    const progress = getProgress();
    if (!progress.solved.includes(puzzleName)) progress.solved.push(puzzleName);
    progress.stage = Math.min(10, progress.stage + 1);
    if (puzzleName === 'mark') alertCount.textContent = '1';
    if (puzzleName === 'truth') { progress.completed = true; localStorage.removeItem(TIMER_KEY); clearInterval(timerInterval); timer.textContent = 'PROTOCOLO CANCELADO'; }
    saveProgress(progress);
    result.textContent = puzzleName === 'mark'
        ? `✓ ${puzzle.success} ⚠ ALERTA DE SEGURIDAD: ACCESO NO AUTORIZADO DETECTADO. PROTOCOLO DE PROTECCIÓN ACTIVADO.`
        : `✓ ${puzzle.success}`;
    result.className = 'success';
    setTimeout(renderList, 1000);
};

const openApp = (name) => { activeApp = name; activeItem = null; appTitle.textContent = name; appLabel.textContent = pdaContent[name].label; appText.textContent = pdaContent[name].description; renderList(); show('app'); };
document.querySelectorAll('.apps button').forEach((button) => button.onclick = () => openApp(button.dataset.app));

// ========================================
// CONTROLES, ALERTAS Y PANTALLA COMPLETA
// ========================================

document.querySelector('#back').onclick = () => activeItem === null ? show('home') : renderList();

document.querySelector('#homebutton').onclick = () => show(getProgress().unlocked ? 'home' : 'lock');
document.querySelector('#previousbutton').onclick = () => {
    if (activeItem !== null) {
        renderList();
    } else if (!views.app.hidden) {
        show('home');
    }
};
document.querySelector('#nextbutton').onclick = () => {
    if (!getProgress().unlocked) return;
    if (views.home.hidden) show('home');
    else openApp('ARCHIVOS');
};
document.querySelector('#enter').onclick = () => {
    if (!views.off.hidden) powerButton.click();
    else if (!views.lock.hidden) form.requestSubmit();
};
document.querySelector('#alerts').onclick = () => {
    if (getProgress().stage < 3) return;

    alertCount.textContent = '0';
    saveProgress({ ...getProgress(), alertsRead: true });
    openApp('MENSAJES');
};

const resetInvestigation = (testCode = false) => {
    if (!testCode && !window.confirm('¿Deseas borrar todo el progreso de la investigación?')) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMER_KEY);
    localStorage.removeItem('pda-investigation-v1');
    localStorage.removeItem('pda-investigation-v2');
    localStorage.removeItem('pda-deadline-after-unlock');
    localStorage.removeItem('pda-deadline-test-1min');
    window.location.reload();
};

document.querySelector('#restart-failure').onclick = resetInvestigation;

fullscreenButton.onclick = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
};

document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? '×' : '⛶';
});

const initial = getProgress();
alertCount.textContent = initial.alertsRead || initial.stage < 3 ? '0' : '1';
if (initial.failed) corruption.hidden = false;
else if (!initial.powered) show('off');
else if (initial.unlocked) show('home');
else show('lock');
if (localStorage.getItem(TIMER_KEY) && !initial.completed) startTimer();
