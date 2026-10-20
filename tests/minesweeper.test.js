import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const puzzleSource = await readFile(new URL('../js/puzzles.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const gpsSource = await readFile(new URL('../js/gps.js', import.meta.url), 'utf8');
const htmlSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(`${puzzleSource}\nglobalThis.api = {
    FORENSIC_BOARD_SIZE, FORENSIC_CELL_COUNT, FORENSIC_MINE_COUNT, generateForensicMineIndices, isValidForensicMineIndices,
    createForensicBoard, createMinefieldState, normalizeMinefieldState,
    toggleMinefieldFlag, revealMinefieldCell, resetForensicBoardProgress, advanceForensicPhase,
    validateEmeraldKey, normalizeAnswer, puzzles, validatePuzzleAnswer, ROUTE_SEQUENCE, getRouteProgress,
    ORGANIZATION_INITIAL_ROTATIONS, ORGANIZATION_SOLUTION_ROTATIONS, createOrganizationPuzzleState, normalizeOrganizationPuzzleState,
    rotateOrganizationTile, getOrganizationTileConnections, isOrganizationNetworkSolved, isOrganizationPuzzleConfigurationValid,
    verifyOrganizationNetwork, resetOrganizationPuzzleProgress
};`, context);
const api = context.api;
const asArray = (value) => Array.from(value);
vm.runInContext(`${gpsSource}\nglobalThis.gpsApi = { GPS_FIXES, getLatestGpsFix };`, context);
const gpsApi = context.gpsApi;

test('cada módulo gira 90 grados y sus conectores cambian de lado', () => {
    assert.deepEqual(asArray(api.getOrganizationTileConnections(0, 0)), [1, 3]);
    assert.deepEqual(asArray(api.getOrganizationTileConnections(0, 1)), [2, 0]);
    assert.deepEqual(asArray(api.getOrganizationTileConnections(2, 0)), [0, 1]);
    assert.deepEqual(asArray(api.getOrganizationTileConnections(2, 1)), [1, 2]);
    const state = api.createOrganizationPuzzleState();
    const rotated = api.rotateOrganizationTile(state, 0);
    assert.equal(rotated.rotations[0], (state.rotations[0] + 1) % 4);
    assert.equal(rotated.repaired, false);
    assert.equal(api.rotateOrganizationTile(rotated, 0).rotations[0], (state.rotations[0] + 2) % 4);
});

test('solo verificar una red completa restaura el circuito', () => {
    const initial = api.createOrganizationPuzzleState();
    assert.equal(api.isOrganizationPuzzleConfigurationValid(), true);
    assert.equal(api.isOrganizationNetworkSolved(initial.rotations), false);
    const interrupted = api.verifyOrganizationNetwork(initial);
    assert.equal(interrupted.repaired, false);
    assert.equal(interrupted.status, 'interrupted');
    let state = initial;
    api.ORGANIZATION_SOLUTION_ROTATIONS.forEach((rotation, index) => {
        const steps = (rotation - state.rotations[index] + 4) % 4;
        for (let step = 0; step < steps; step += 1) state = api.rotateOrganizationTile(state, index);
    });
    assert.equal(state.repaired, false, 'girar las piezas por sí solo no declara la victoria');
    const restored = api.verifyOrganizationNetwork(state);
    assert.equal(restored.repaired, true);
    assert.equal(restored.status, 'restored');
    assert.equal(api.rotateOrganizationTile(restored, 0), restored, 'la red restaurada queda bloqueada');
});

test('reiniciar la red conserva el progreso ajeno y los guardados antiguos no retroceden', () => {
    const reset = api.resetOrganizationPuzzleProgress({ stage: 7, solved: ['caesar'], organizationPuzzle: { rotations: [0], repaired: true } });
    assert.equal(reset.stage, 7);
    assert.deepEqual(asArray(reset.solved), ['caesar']);
    assert.deepEqual(asArray(reset.organizationPuzzle.rotations), asArray(api.ORGANIZATION_INITIAL_ROTATIONS));
    const legacy = api.normalizeOrganizationPuzzleState(undefined, true);
    assert.equal(legacy.repaired, true);
    assert.equal(legacy.passwordAccepted, true);
});

test('la sección integra verificación, revelación y contraseña en el orden requerido', () => {
    const renderer = mainSource.slice(mainSource.indexOf('const renderOrganizationPuzzle'), mainSource.indexOf('const setupRouteMap'));
    assert.match(mainSource, /item\.puzzle === 'hand'\)\s*\{\s*renderOrganizationPuzzle\(item\)/);
    assert.match(renderer, /getOrganizationTileConnections/);
    assert.match(renderer, /verifyOrganizationNetwork\(current\.organizationPuzzle\)/);
    assert.match(renderer, /REINICIAR ROMPECABEZAS/);
    assert.ok(renderer.indexOf('SISTEMA RESTAURADO') < renderer.indexOf('LA MANO NEGRA'));
    assert.ok(renderer.indexOf('LA MANO NEGRA') < renderer.indexOf('organization-password-stage'));
    assert.match(renderer, /Introduce la contraseña de la organización identificada para continuar/);
    assert.match(renderer, /normalizeAnswer\(circuitPasswordInput\.value\) !== normalizeAnswer\('LA MANO NEGRA'\)/);
    assert.match(renderer, /document\.querySelector\('#organization-password'\)/);
    assert.doesNotMatch(renderer, /ARTUROOLMOS/);
    assert.equal(api.normalizeAnswer('LA MANO NEGRA'), 'LAMANONEGRA');
    assert.notEqual(api.normalizeAnswer('ARTUROOLMOS'), 'LAMANONEGRA');
    assert.match(styleSource, /\.organization-tile svg path\s*\{/);
});

test('el mapa conserva conexiones pendientes ocultas y solo completa la ruta correcta', () => {
    assert.deepEqual(asArray(api.getRouteProgress([]).edgeStates), ['pending', 'pending']);
    const selected = api.getRouteProgress([api.ROUTE_SEQUENCE[0]]);
    assert.deepEqual(asArray(selected.edgeStates), ['selected', 'pending']);
    const halfway = api.getRouteProgress(api.ROUTE_SEQUENCE.slice(0, 2));
    assert.deepEqual(asArray(halfway.edgeStates), ['completed', 'selected']);
    assert.equal(halfway.complete, false);
    assert.deepEqual(asArray(halfway.edges[0]), ['LAS LAJAS', 'TEATRO COLON']);
    const incorrect = api.getRouteProgress(['LAS LAJAS', 'CIUDAD PERDIDA', 'TEATRO COLON']);
    assert.equal(incorrect.complete, false);
    assert.equal(incorrect.edges.length, 0);
    const complete = api.getRouteProgress(api.ROUTE_SEQUENCE);
    assert.equal(complete.complete, true);
    assert.deepEqual(asArray(complete.edgeStates), ['completed', 'completed']);
    assert.equal(api.validatePuzzleAnswer(api.ROUTE_SEQUENCE.join(' '), api.puzzles.route), true);
    assert.equal(api.validatePuzzleAnswer('LAS LAJAS CIUDAD PERDIDA TEATRO COLON', api.puzzles.route), false);
    const routeSetup = mainSource.slice(mainSource.indexOf('const setupRouteMap'), mainSource.indexOf('const solvePuzzle'));
    assert.match(routeSetup, /selection = alreadySolved \? \[\.\.\.ROUTE_SEQUENCE\] : \[\]/);
    assert.match(routeSetup, /data-state="\$\{route\.edgeStates\[index\]\}"/);
    assert.match(routeSetup, /seal\.hidden = false/);
    assert.match(mainSource, /<g id="route-connections"><\/g>/);
});

test('la carcasa y los seis módulos conservan sus anclas funcionales y textos de ambientación', () => {
    for (const app of ['ARCHIVOS', 'MAPAS', 'NOTAS', 'FOTOS', 'MENSAJES', 'SEGURIDAD']) assert.match(htmlSource, new RegExp(`data-app="${app}"`));
    for (const id of ['clock', 'timer', 'fullscreen', 'power-button', 'password', 'previousbutton', 'homebutton', 'nextbutton', 'enter']) assert.match(htmlSource, new RegExp(`id="${id}"`));
    assert.doesNotMatch(htmlSource, /PROYECTO ACADÉMICO|AVANCE DE PROTOTIPO|CONTENIDO NARRATIVO EN DESARROLLO|NO HAY CAPÍTULOS DEFINITIVOS/i);
    assert.match(htmlSource, /class="system-indicator"/);
    assert.match(htmlSource, /T-EN ESPERA/);
    assert.match(styleSource, /\.apps button svg\s*\{/);
    assert.match(styleSource, /prefers-reduced-motion:\s*reduce/);
});

const seededRandom = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
};

test('los tableros nuevos distribuyen bombas entre filas, columnas y zonas', () => {
    const boards = Array.from({ length: 20 }, (_, index) => api.generateForensicMineIndices(seededRandom(index + 1)));
    const layouts = new Set(boards.map((indices) => indices.join(',')));
    assert.ok(layouts.size >= 18, 'las partidas deben generar distribuciones distintas');
    for (const indices of boards) {
        assert.equal(indices.length, 4);
        assert.equal(api.isValidForensicMineIndices(indices), true);
        assert.equal(new Set(indices.map((index) => Math.floor(index / 8))).size, 4, 'una bomba por fila como máximo');
        assert.equal(new Set(indices.map((index) => index % 8)).size, 4, 'una bomba por columna como máximo');
        const quadrants = new Set(indices.map((index) => Math.floor(index / 32) * 2 + (index % 8 >= 4 ? 1 : 0)));
        assert.ok(quadrants.size >= 3, 'las bombas deben usar al menos tres cuadrantes');
    }
});

test('el tablero es 8×8 y los números coinciden con los vecinos', () => {
    const mines = api.generateForensicMineIndices(seededRandom(33));
    const board = api.createForensicBoard(mines);
    assert.equal(board.length, 64);
    assert.equal(api.FORENSIC_BOARD_SIZE, 8);
    assert.equal(api.FORENSIC_MINE_COUNT, 4);
    for (let index = 0; index < board.length; index += 1) {
        if (board[index].mine) continue;
        const row = Math.floor(index / 8);
        const col = index % 8;
        let expected = 0;
        for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
            if (!dr && !dc) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && mines.includes(r * 8 + c)) expected += 1;
        }
        assert.equal(board[index].count, expected, `conteo en casilla ${index}`);
    }
});

test('el inicio está seguro y expande el área vacía', () => {
    const mineIndices = [10, 21, 40, 63];
    const board = api.createForensicBoard(mineIndices);
    const initial = { revealed: [], flags: [], status: 'active', mineIndices };
    const state = api.revealMinefieldCell(initial, 0, board);
    assert.equal(state.status, 'active');
    assert.ok(!state.mineIndices.includes(0), 'la primera casilla queda segura');
    assert.ok(state.revealed.length > 1);
    assert.ok(state.revealed.every((index) => !board[index].mine), 'la expansión nunca revela bombas');
});

test('si la primera selección coincide con una bomba, se recoloca sin perder turno', () => {
    const initial = api.createMinefieldState(seededRandom(5));
    const target = initial.mineIndices[0];
    const board = api.createForensicBoard(initial.mineIndices);
    const state = api.revealMinefieldCell(initial, target, board, seededRandom(81));
    assert.equal(state.status, 'active');
    assert.ok(!state.mineIndices.includes(target));
    assert.ok(state.revealed.includes(target));
});

test('las banderas se ponen y retiran, y bloquean la revelación accidental', () => {
    let state = api.createMinefieldState();
    state = api.toggleMinefieldFlag(state, 56);
    assert.deepEqual(asArray(state.flags), [56]);
    assert.equal(api.revealMinefieldCell(state, 56).status, 'active');
    state = api.toggleMinefieldFlag(state, 56);
    assert.deepEqual(asArray(state.flags), []);
});

test('marcar todas las minas no gana el tablero', () => {
    const initial = api.createMinefieldState(seededRandom(3));
    let state = initial;
    for (const index of initial.mineIndices) state = api.toggleMinefieldFlag(state, index);
    assert.equal(state.status, 'active');
    assert.equal(state.revealed.length, 0);
});

test('revelar una bomba después de empezar falla', () => {
    const initial = api.createMinefieldState(seededRandom(12));
    const board = api.createForensicBoard(initial.mineIndices);
    let started = api.revealMinefieldCell(initial, 0, board, seededRandom(14));
    const mine = started.mineIndices.find((index) => !started.revealed.includes(index));
    const failed = api.revealMinefieldCell(started, mine, api.createForensicBoard(started.mineIndices));
    assert.equal(failed.status, 'failed');
    assert.ok(failed.revealed.includes(mine));
});

test('reiniciar tras fallar cambia la distribución y conserva el progreso general', () => {
    const initial = api.createMinefieldState(seededRandom(27));
    const progress = { stage: 8, solved: ['caesar'], finalPuzzle: { phase: 'minefield', minefield: { ...initial, status: 'failed', revealed: [initial.mineIndices[0]] } } };
    const restarted = api.resetForensicBoardProgress(progress, seededRandom(91));
    assert.notDeepEqual(asArray(restarted.finalPuzzle.minefield.mineIndices), asArray(initial.mineIndices));
    assert.deepEqual(asArray(restarted.finalPuzzle.minefield.revealed), []);
    assert.deepEqual(asArray(restarted.finalPuzzle.minefield.flags), []);
    assert.equal(restarted.stage, 8);
    assert.deepEqual(asArray(restarted.solved), ['caesar']);
    assert.equal(restarted.finalPuzzle.minefield.status, 'active');
});

test('una serie de reinicios produce tableros distintos y distribuidos', () => {
    let previous = [];
    const layouts = new Set();
    for (let seed = 1; seed <= 25; seed += 1) {
        const state = api.createMinefieldState(seededRandom(seed), previous);
        assert.equal(api.isValidForensicMineIndices(state.mineIndices), true);
        assert.notDeepEqual(asArray(state.mineIndices), asArray(previous));
        layouts.add(state.mineIndices.join(','));
        previous = state.mineIndices;
    }
    assert.equal(layouts.size, 25);
});

test('ganar requiere revelar cada casilla segura', () => {
    const initial = api.createMinefieldState(seededRandom(101));
    const board = api.createForensicBoard(initial.mineIndices);
    let state = api.revealMinefieldCell(initial, initial.mineIndices[0], board, seededRandom(102));
    const activeBoard = api.createForensicBoard(state.mineIndices);
    for (let index = 0; index < activeBoard.length; index += 1) if (!activeBoard[index].mine) state = api.revealMinefieldCell(state, index, activeBoard);
    assert.equal(state.status, 'won');
    assert.equal(state.revealed.filter((index) => !activeBoard[index].mine).length, 60);
});

test('solo ESMERALDA valida la adivinanza y el código final', () => {
    assert.equal(api.validateEmeraldKey('  esmeralda  '), true);
    assert.equal(api.validateEmeraldKey(''), false);
    assert.equal(api.validateEmeraldKey('esmeralda verde'), false);
    assert.equal(api.validatePuzzleAnswer('ESMERALDA', api.puzzles.finalCode), true);
    assert.equal(api.validatePuzzleAnswer('LAS LAJAS TEATRO COLON CIUDAD PERDIDA', api.puzzles.finalCode), false);
    const emeraldRiddle = 'No soy una joya cualquiera, aunque puedo brillar en un anillo. Mi color recuerda a la selva y mi historia está ligada a una riqueza que muchos persiguieron. ¿Qué soy?';
    assert.equal(mainSource.split(emeraldRiddle).length - 1, 1);
    assert.match(mainSource, /Introduce la respuesta del acertijo anterior para desbloquear el registro de Arturo/);
});

test('el estado de tablero inválido se restaura de forma segura', () => {
    const restored = api.normalizeMinefieldState({ revealed: [56], flags: [], status: 'active' });
    assert.deepEqual(asArray(restored.revealed), []);
    assert.deepEqual(asArray(restored.flags), []);
    assert.equal(restored.status, 'active');
});

test('reiniciar el tablero conserva etapa y acertijos ya resueltos', () => {
    const progress = { stage: 8, solved: ['caesar'], finalPuzzle: { phase: 'minefield', minefield: { revealed: [1], flags: [2], status: 'failed' } } };
    const restarted = api.resetForensicBoardProgress(progress);
    assert.equal(restarted.stage, 8);
    assert.deepEqual(asArray(restarted.solved), ['caesar']);
    assert.deepEqual(asArray(restarted.finalPuzzle.minefield.revealed), []);
    assert.deepEqual(asArray(restarted.finalPuzzle.minefield.flags), []);
});

test('las fases no se pueden saltar y el archivo requiere la clave correcta', () => {
    const base = { solved: [], finalPuzzle: { phase: 'minefield', minefield: api.createMinefieldState() } };
    assert.equal(api.advanceForensicPhase(base, 'code'), null);
    assert.equal(api.advanceForensicPhase(base, 'riddle'), null);
    const mines = api.generateForensicMineIndices(seededRandom(9));
    const won = { ...base, finalPuzzle: { phase: 'minefield', minefield: { mineIndices: mines, revealed: Array.from({ length: 64 }, (_, i) => i).filter(i => !mines.includes(i)), flags: [], status: 'won' } } };
    const riddle = api.advanceForensicPhase(won, 'riddle');
    assert.equal(riddle.finalPuzzle.phase, 'riddle');
    const code = api.advanceForensicPhase(riddle, 'code');
    assert.equal(code.finalPuzzle.phase, 'code');
    assert.equal(api.advanceForensicPhase(code, 'complete', 'INCORRECTA'), null);
    assert.equal(api.advanceForensicPhase(code, 'complete', 'esmeralda').finalPuzzle.phase, 'complete');
});

test('la pantalla de bloqueo reserva espacio para sus textos y la ficha no se superpone', () => {
    const lockRule = styleSource.match(/(?:^|\n)#lock\.view\s*\{([^}]+)\}/)?.[1] || '';
    const activityRule = styleSource.match(/(?:^|\n)\.activity\s*\{([^}]+)\}/)?.[1] || '';
    assert.match(lockRule, /display\s*:\s*flex/);
    assert.match(lockRule, /flex-direction\s*:\s*column/);
    assert.match(activityRule, /position\s*:\s*static/);
    assert.doesNotMatch(activityRule, /position\s*:\s*absolute/);
    assert.match(styleSource, /#lock\.view\[hidden\]\s*\{\s*display\s*:\s*none/);
    assert.match(styleSource, /@media\s*\(max-width:\s*360px\)/);
    assert.match(styleSource, /@media\s*\(max-width:\s*480px\)/);
});

test('los acertijos y pistas nuevos muestran ? hasta que el jugador los abre', () => {
    const listRenderer = mainSource.slice(mainSource.indexOf('const renderList'), mainSource.indexOf('let flagMode'));
    const recordOpener = mainSource.slice(mainSource.indexOf('const openRecord'), mainSource.indexOf('const showImageViewer'));
    assert.match(mainSource, /seenRecords: \[\]/);
    assert.match(mainSource, /seenRecords: Array\.isArray\(value\.seenRecords\)/);
    assert.match(listRenderer, /const isNew = available && !solved/);
    assert.match(listRenderer, /progress\.seenRecords\.includes\(`\$\{activeApp\}:\$\{index\}`\)/);
    assert.match(listRenderer, /record-icon-new/);
    assert.match(listRenderer, /\?'/);
    assert.match(recordOpener, /saveProgress\(\{ \.\.\.progress, seenRecords:/);
    assert.match(styleSource, /\.record-icon-new/);
});

test('el GPS deriva Las Lajas, Teatro Colón y Ciudad Perdida de sus acertijos existentes', () => {
    assert.equal(gpsApi.getLatestGpsFix({ solved: [] }), null);
    const lajas = gpsApi.getLatestGpsFix({ solved: ['caesar', 'mark'] });
    assert.equal(lajas.puzzle, 'mark');
    assert.equal(lajas.place, 'SANTUARIO DE LAS LAJAS');
    assert.equal(lajas.coordinates, '0.805556, -77.586111');
    assert.equal(lajas.status, 'POSICIÓN RECUPERADA');

    const colon = gpsApi.getLatestGpsFix({ solved: ['mark', 'route'] });
    assert.equal(colon.puzzle, 'route');
    assert.equal(colon.coordinates, '4.596667, -74.074444');
    assert.equal(colon.status, 'UBICACIÓN IDENTIFICADA');

    const city = gpsApi.getLatestGpsFix({ solved: ['mark', 'route', 'city'] });
    assert.equal(city.puzzle, 'city');
    assert.equal(city.coordinates, '11.037000, -73.925000');
});

test('el panel GPS se actualiza al guardar progreso, persiste al cargar y no consulta ubicación del navegador', () => {
    assert.match(htmlSource, /id="gps-panel"[\s\S]*?GPS \/ ERROR DE SINCRONIZACIÓN[\s\S]*?SEÑAL: BUSCANDO\.\.\.[\s\S]*?POSICIÓN: DESCONOCIDA[\s\S]*?--\.------, --\.------/);
    assert.match(mainSource, /renderGpsPanel\(memoryProgress\)/);
    assert.match(mainSource, /renderGpsPanel\(initial\)/);
    assert.match(mainSource, /getLatestGpsFix\(progress\)/);
    assert.match(mainSource, /const defaultProgress = \(\) => \(\{[^}]*solved: \[\]/);
    assert.match(mainSource, /const resetInvestigation = \(\) => \{[\s\S]*?removeStorage\(STORAGE_KEY\)[\s\S]*?window\.location\.reload\(\)/);
    assert.match(styleSource, /\.gps-panel\[data-state="searching"\]/);
    assert.match(styleSource, /\.gps-panel\[data-state="fixed"\]/);
    assert.doesNotMatch(`${mainSource}\n${gpsSource}`, /navigator\.geolocation/);
    assert.doesNotMatch(gpsSource, /localStorage|sessionStorage/);
    const panel = htmlSource.match(/<aside class="gps-panel"[\s\S]*?<\/aside>/)?.[0] || '';
    assert.ok(panel);
    assert.doesNotMatch(panel, /<button\b/);
});
