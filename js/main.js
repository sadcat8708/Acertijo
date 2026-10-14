// ========================================
// ELEMENTOS, ESTADO Y NAVEGACIÓN
// ========================================

const views = {
    lock: document.querySelector('#lock'),
    home: document.querySelector('#home'),
    app: document.querySelector('#app')
};

const form = document.querySelector('#form');
const password = document.querySelector('#password');
const message = document.querySelector('#message');
const appTitle = document.querySelector('#apptitle');
const appLabel = document.querySelector('#app-label');
const appText = document.querySelector('#apptext');
const content = document.querySelector('#content');
const alertCount = document.querySelector('#alertcount');

let activeApp = 'ARCHIVOS';
let activeItem = null;

const getProgress = () => JSON.parse(localStorage.getItem('pda-progress')) || {
    unlocked: false,
    openedItems: [],
    alertsRead: false
};

const saveProgress = (progress) => {
    localStorage.setItem('pda-progress', JSON.stringify(progress));
};

const show = (viewName) => {
    Object.entries(views).forEach(([name, view]) => {
        view.hidden = name !== viewName;
    });
};

// ========================================
// RELOJ Y DESBLOQUEO
// ========================================

const updateClock = () => {
    document.querySelector('#clock').textContent = new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());
};

updateClock();
setInterval(updateClock, 30000);

// ========================================
// CUENTA REGRESIVA DE LA INVESTIGACIÓN
// Cambien este valor cuando definan el tiempo
// narrativo final en minutos.
// ========================================

const TIMER_DURATION = 24 * 60 * 1000;
const timer = document.querySelector('#timer');
const TIMER_STORAGE_KEY = 'pda-deadline-after-unlock';
let deadline = null;
let timerInterval = null;

const getDeadline = () => {
    const savedDeadline = Number(localStorage.getItem(TIMER_STORAGE_KEY));

    if (savedDeadline) {
        return savedDeadline;
    }

    const newDeadline = Date.now() + TIMER_DURATION;

    localStorage.setItem(TIMER_STORAGE_KEY, String(newDeadline));
    return newDeadline;
};

const updateTimer = () => {
    if (!deadline) {
        timer.textContent = 'T-00:24:00';
        return;
    }

    const remaining = Math.max(0, deadline - Date.now());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    timer.textContent = `T-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const startTimer = () => {
    deadline = getDeadline();
    updateTimer();

    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
    }
};

updateTimer();

form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (password.value.trim().toUpperCase() !== 'ARTURO') {
        message.textContent = '⚠ ACCESO DENEGADO · VERIFIQUE LA PISTA DE DEMOSTRACIÓN';
        message.className = 'error';
        password.select();
        return;
    }

    message.textContent = '✓ ACCESO CONCEDIDO · CARGANDO ESCRITORIO';
    message.className = '';
    saveProgress({ ...getProgress(), unlocked: true });
    startTimer();
    setTimeout(() => show('home'), 450);
});

// ========================================
// REGISTROS EDITABLES DE CADA APLICACIÓN
// ========================================

const renderList = () => {
    const appData = pdaContent[activeApp];
    const progress = getProgress();

    content.innerHTML = `
        <div class="module-status"><span>MEMORIA RECUPERADA</span><span>${appData.items.length} REGISTROS</span></div>
        <div class="item-list">
            ${appData.items.map(([title, description, status], index) => {
                const itemKey = `${activeApp}-${index}`;
                const opened = progress.openedItems.includes(itemKey) ? ' opened' : '';
                const blocked = status.includes('BLOQUEADO') || status.includes('DENEGADO');
                return `<button class="record${opened}" data-index="${index}">
                    <span class="record-icon">${blocked ? '▣' : '▧'}</span>
                    <span class="record-body"><strong>${title}</strong><small>${description}</small></span>
                    <span class="record-status${blocked ? ' blocked' : ''}">${status}</span>
                </button>`;
            }).join('')}
        </div>
        <p class="replace-note">CONTENIDO DE EJEMPLO · REEMPLACEN ESTOS REGISTROS POR SU HISTORIA FINAL</p>
    `;

    content.querySelectorAll('.record').forEach((record) => {
        record.addEventListener('click', () => openRecord(Number(record.dataset.index)));
    });
};

const openRecord = (index) => {
    const [title, description, status] = pdaContent[activeApp].items[index];
    const blocked = status.includes('BLOQUEADO') || status.includes('DENEGADO');
    const progress = getProgress();
    const itemKey = `${activeApp}-${index}`;

    activeItem = index;

    if (!blocked && !progress.openedItems.includes(itemKey)) {
        progress.openedItems.push(itemKey);
        saveProgress(progress);
    }

    content.innerHTML = `
        <button class="record-back" id="record-back">← LISTA DE REGISTROS</button>
        <article class="document${blocked ? ' document-locked' : ''}">
            <p class="document-id">${activeApp} / ${String(index + 1).padStart(3, '0')}</p>
            <h3>${title}</h3>
            <p>${description}</p>
            <div class="document-seal">${blocked ? '▣ ACCESO RESTRINGIDO' : '✓ REGISTRO RECUPERADO'}</div>
            <p class="document-placeholder">Este es un marcador editable. Aquí podrán escribir la escena, pista, información histórica o solución correspondiente.</p>
        </article>
    `;

    document.querySelector('#record-back').addEventListener('click', () => {
        activeItem = null;
        renderList();
    });
};

const openApp = (appName) => {
    activeApp = appName;
    activeItem = null;
    appTitle.textContent = appName;
    appLabel.textContent = pdaContent[appName].label;
    appText.textContent = pdaContent[appName].description;
    renderList();
    show('app');
};

document.querySelectorAll('.apps button').forEach((button) => {
    button.addEventListener('click', () => openApp(button.dataset.app));
});

// ========================================
// ALERTAS Y CONTROLES FÍSICOS
// ========================================

document.querySelector('#alerts').addEventListener('click', () => {
    appTitle.textContent = 'ALERTAS';
    appLabel.textContent = 'SISTEMA / PRIORIDAD ALTA';
    appText.textContent = 'Notificaciones y eventos detectados por la PDA.';
    content.innerHTML = '<div class="alert-card danger"><span>⚠</span><div><strong>INTENTO DE ACCESO NO AUTORIZADO</strong><p>Se detectó actividad remota. Registro pendiente de desarrollo.</p></div></div><div class="alert-card"><span>✓</span><div><strong>PDA RECUPERADA</strong><p>El dispositivo está listo para incorporar capítulos y acertijos.</p></div></div><button class="record-back" id="return-app">← VOLVER AL MÓDULO ANTERIOR</button>';
    saveProgress({ ...getProgress(), alertsRead: true });
    alertCount.textContent = '0';
    document.querySelector('#return-app').addEventListener('click', () => openApp(activeApp));
    show('app');
});

document.querySelector('#back').addEventListener('click', () => {
    if (activeItem !== null) {
        activeItem = null;
        renderList();
        return;
    }

    show('home');
});

document.querySelector('#homebutton').addEventListener('click', () => show('home'));
document.querySelector('#enter').addEventListener('click', () => {
    if (!views.lock.hidden) form.requestSubmit();
});

const initialProgress = getProgress();
alertCount.textContent = initialProgress.alertsRead ? '0' : '1';

if (initialProgress.unlocked) show('home');

if (initialProgress.unlocked) startTimer();
