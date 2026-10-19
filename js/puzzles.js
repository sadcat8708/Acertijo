// ========================================
// RESPUESTAS Y DESBLOQUEOS
// ========================================

const puzzles = {
    caesar: { answer: ['SANTUARIO DE LAS LAJAS', 'SANTUARIODELASLAJAS'], prompt: 'Romina: “Después de leerlo, me doy cuenta de que esto ya lo había estudiado. Código de César.” Descifra el destino.', cipher: 'T, Z, M, U, T, B, S, J, P, E, F, M, B, T, M, B, K, B, T', success: '—El Santuario de Las Lajas— sorprendida.' },
    mark: { answer: ['LA MANO NEGRA', 'MANO NEGRA'], prompt: 'Selecciona el símbolo oculto en la evidencia.', success: 'Ya saben que estuviste aquí.' },
    route: { answer: ['LAS LAJAS TEATRO COLON CIUDAD PERDIDA'], prompt: 'REGISTRO CARTOGRÁFICO INCOMPLETO.', success: 'RUTA CONFIRMADA: TEATRO COLÓN ES EL SIGUIENTE DESTINO.' },
    sierra: { answer: ['SIERRA'], prompt: '¿Qué palabra forman las primeras letras?', success: 'SIERRA IDENTIFICADA. LA RUTA CONTINÚA.' },
    city: { answer: ['CIUDAD PERDIDA'], prompt: '¿A qué destino lleva SIERRA?', success: 'DESTINO DESBLOQUEADO: CIUDAD PERDIDA.' },
    dorado: { answer: ['EL DORADO', 'DORADO'], prompt: 'No busques el oro. ¿Qué ocultó el oro?', success: 'Ahora lo entiendo. El Dorado nunca fue solamente una ciudad.' },
    hand: { answer: ['LA MANO NEGRA', 'MANO NEGRA'], prompt: '¿Qué nombre aparece detrás de todos los registros?', success: 'ORGANIZACIÓN IDENTIFICADA: LA MANO NEGRA.' },
    finalCode: { answer: ['ESMERALDA'], prompt: 'Introduce la palabra clave del archivo final.', success: 'ARCHIVO DESBLOQUEADO: ARTURO_OLMOS_FINAL.' },
    truth: { answer: ['LA MANO NEGRA'], prompt: '¿Qué organización persiguió a Arturo por la conexión entre El Dorado y Ciudad Perdida?', success: 'INVESTIGACIÓN RECUPERADA. LA MANO NEGRA ESTABA DETRÁS DE LA PERSECUCIÓN.' }
};

const normalizeAnswer = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
const validatePuzzleAnswer = (answer, puzzle) => Boolean(puzzle && Array.isArray(puzzle.answer) && puzzle.answer.some((expected) => normalizeAnswer(answer) === normalizeAnswer(expected)));
const validateEmeraldKey = (value) => String(value ?? '').trim().toUpperCase() === 'ESMERALDA';
const ROUTE_SEQUENCE = ['LAS LAJAS', 'TEATRO COLON', 'CIUDAD PERDIDA'];
const getRouteProgress = (selection) => {
    const edgeStates = ['pending', 'pending'];
    if (!Array.isArray(selection) || selection.some((place) => !ROUTE_SEQUENCE.includes(place))) return { edges: [], edgeStates, validPrefix: false, complete: false };
    const validPrefix = selection.length <= ROUTE_SEQUENCE.length && selection.every((place, index) => ROUTE_SEQUENCE[index] === place);
    const edges = [];
    for (let index = 0; index < Math.min(selection.length - 1, ROUTE_SEQUENCE.length - 1); index += 1) {
        if (selection[index] === ROUTE_SEQUENCE[index] && selection[index + 1] === ROUTE_SEQUENCE[index + 1]) {
            edges.push([selection[index], selection[index + 1]]);
            edgeStates[index] = 'completed';
        }
    }
    if (validPrefix && selection.length > 0 && selection.length < ROUTE_SEQUENCE.length) edgeStates[selection.length - 1] = 'selected';
    return { edges, edgeStates, validPrefix, complete: validPrefix && selection.length === ROUTE_SEQUENCE.length };
};

// Red de restauración de ORGANIZACIÓN IDENTIFICADA.
const ORGANIZATION_TILE_TYPES = ['straight', 'straight', 'corner', 'corner', 'straight', 'corner', 'corner', 'straight', 'straight'];
const ORGANIZATION_INITIAL_ROTATIONS = [1, 2, 0, 0, 1, 0, 2, 1, 2];
const ORGANIZATION_SOLUTION_ROTATIONS = [0, 0, 2, 1, 0, 3, 0, 0, 0];
const createOrganizationPuzzleState = () => ({ rotations: [...ORGANIZATION_INITIAL_ROTATIONS], repaired: false, passwordAccepted: false, status: 'idle' });
const normalizeOrganizationPuzzleState = (value, alreadySolved = false) => {
    if (alreadySolved && (!value || typeof value !== 'object')) return { rotations: [...ORGANIZATION_INITIAL_ROTATIONS], repaired: true, passwordAccepted: true, status: 'restored' };
    const rotations = Array.isArray(value?.rotations) && value.rotations.length === 9 && value.rotations.every((rotation) => Number.isInteger(rotation) && rotation >= 0 && rotation <= 3)
        ? [...value.rotations]
        : [...ORGANIZATION_INITIAL_ROTATIONS];
    const repaired = value?.repaired === true || alreadySolved;
    const status = repaired ? 'restored' : ['idle', 'interrupted'].includes(value?.status) ? value.status : 'idle';
    return { rotations, repaired, passwordAccepted: value?.passwordAccepted === true || alreadySolved, status };
};
const rotateOrganizationTile = (state, index) => {
    if (!Number.isInteger(index) || index < 0 || index >= 9 || state.repaired) return state;
    const rotations = [...state.rotations];
    rotations[index] = (rotations[index] + 1) % 4;
    return { ...state, rotations, status: 'idle' };
};
const verifyOrganizationNetwork = (state) => {
    if (state.repaired) return state;
    const repaired = isOrganizationNetworkSolved(state.rotations);
    return { ...state, repaired, status: repaired ? 'restored' : 'interrupted' };
};
const getOrganizationTileConnections = (index, rotation) => {
    if (!Number.isInteger(index) || index < 0 || index >= 9 || !Number.isInteger(rotation) || rotation < 0 || rotation > 3) return [];
    const base = ORGANIZATION_TILE_TYPES[index] === 'straight' ? [1, 3] : [0, 1]; // N, E, S, W
    const turns = ORGANIZATION_TILE_TYPES[index] === 'straight' ? rotation % 2 : rotation;
    return base.map((direction) => (direction + turns) % 4);
};
const isOrganizationNetworkSolved = (rotations) => {
    if (!Array.isArray(rotations) || rotations.length !== 9 || !rotations.every((rotation) => Number.isInteger(rotation) && rotation >= 0 && rotation <= 3)) return false;
    const connectors = ORGANIZATION_TILE_TYPES.map((_, index) => getOrganizationTileConnections(index, rotations[index]));
    const neighbors = Array.from({ length: 9 }, () => []);
    for (let index = 0; index < 9; index += 1) {
        const row = Math.floor(index / 3);
        const column = index % 3;
        for (const direction of connectors[index]) {
            const nextRow = row + (direction === 0 ? -1 : direction === 2 ? 1 : 0);
            const nextColumn = column + (direction === 1 ? 1 : direction === 3 ? -1 : 0);
            if (nextRow < 0 || nextRow > 2 || nextColumn < 0 || nextColumn > 2) {
                if (!((index === 0 && direction === 3) || (index === 8 && direction === 1))) return false;
                continue;
            }
            const nextIndex = nextRow * 3 + nextColumn;
            if (!connectors[nextIndex].includes((direction + 2) % 4)) return false;
            neighbors[index].push(nextIndex);
        }
    }
    if (!connectors[0].includes(3) || !connectors[8].includes(1)) return false;
    const reached = new Set([0]);
    const queue = [0];
    while (queue.length) for (const neighbor of neighbors[queue.shift()]) if (!reached.has(neighbor)) { reached.add(neighbor); queue.push(neighbor); }
    return reached.size === 9;
};
const isOrganizationPuzzleConfigurationValid = () => {
    if (ORGANIZATION_INITIAL_ROTATIONS.length !== 9 || ORGANIZATION_SOLUTION_ROTATIONS.length !== 9) return false;
    const turnsToSolution = ORGANIZATION_INITIAL_ROTATIONS.map((rotation, index) => (ORGANIZATION_SOLUTION_ROTATIONS[index] - rotation + 4) % 4);
    const reachableSolution = ORGANIZATION_INITIAL_ROTATIONS.map((rotation, index) => (rotation + turnsToSolution[index]) % 4);
    return !isOrganizationNetworkSolved(ORGANIZATION_INITIAL_ROTATIONS) && isOrganizationNetworkSolved(reachableSolution);
};
const resetOrganizationPuzzleProgress = (progress) => ({ ...progress, organizationPuzzle: createOrganizationPuzzleState() });

// Tablero forense aleatorio, conservado por partida para reanudarla de forma idéntica.
const FORENSIC_BOARD_SIZE = 8;
const FORENSIC_CELL_COUNT = FORENSIC_BOARD_SIZE * FORENSIC_BOARD_SIZE;
const FORENSIC_MINE_COUNT = 4;
const forensicQuadrant = (index) => (Math.floor(index / 32) * 2) + (index % 8 >= 4 ? 1 : 0);
const forensicShuffle = (items, random) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return shuffled;
};
const generateForensicMineIndices = (random = Math.random, previous = [], excluded = []) => {
    const forbidden = new Set(excluded);
    for (let attempt = 0; attempt < 120; attempt += 1) {
        const candidates = forensicShuffle(Array.from({ length: FORENSIC_CELL_COUNT }, (_, index) => index).filter((index) => !forbidden.has(index)), random);
        const mines = [];
        const rows = new Set();
        const columns = new Set();
        const quadrants = [0, 0, 0, 0];
        for (const index of candidates) {
            const row = Math.floor(index / FORENSIC_BOARD_SIZE);
            const column = index % FORENSIC_BOARD_SIZE;
            const quadrant = forensicQuadrant(index);
            if (rows.has(row) || columns.has(column) || quadrants[quadrant] >= 2) continue;
            mines.push(index);
            rows.add(row);
            columns.add(column);
            quadrants[quadrant] += 1;
            if (mines.length === FORENSIC_MINE_COUNT) break;
        }
        if (mines.length !== FORENSIC_MINE_COUNT || quadrants.filter((count) => count > 0).length < 3) continue;
        mines.sort((left, right) => left - right);
        if (previous.length !== FORENSIC_MINE_COUNT || mines.some((mine, index) => mine !== previous[index])) return mines;
    }
    // Degenerate random sources still get a valid alternate layout.
    const fallbackLayouts = [[1, 14, 48, 63], [8, 23, 41, 54], [13, 18, 49, 62], [3, 12, 50, 61]];
    return fallbackLayouts.find((layout) => !layout.some((index) => forbidden.has(index)) && (layout.join(',') !== [...previous].sort((a, b) => a - b).join(','))) || fallbackLayouts[0];
};
const isValidForensicMineIndices = (indices) => {
    if (!Array.isArray(indices) || indices.length !== FORENSIC_MINE_COUNT
        || !indices.every((index) => Number.isInteger(index) && index >= 0 && index < FORENSIC_CELL_COUNT)
        || new Set(indices).size !== FORENSIC_MINE_COUNT) return false;
    const rows = indices.map((index) => Math.floor(index / FORENSIC_BOARD_SIZE));
    const columns = indices.map((index) => index % FORENSIC_BOARD_SIZE);
    const quadrantCounts = [0, 0, 0, 0];
    for (const index of indices) quadrantCounts[forensicQuadrant(index)] += 1;
    return new Set(rows).size === FORENSIC_MINE_COUNT
        && new Set(columns).size === FORENSIC_MINE_COUNT
        && quadrantCounts.every((count) => count <= 2)
        && quadrantCounts.filter((count) => count > 0).length >= 3;
};
const forensicNeighbors = (index) => {
    const row = Math.floor(index / FORENSIC_BOARD_SIZE);
    const column = index % FORENSIC_BOARD_SIZE;
    const neighbors = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
            if (rowOffset === 0 && columnOffset === 0) continue;
            const neighborRow = row + rowOffset;
            const neighborColumn = column + columnOffset;
            if (neighborRow >= 0 && neighborRow < FORENSIC_BOARD_SIZE && neighborColumn >= 0 && neighborColumn < FORENSIC_BOARD_SIZE) {
                neighbors.push(neighborRow * FORENSIC_BOARD_SIZE + neighborColumn);
            }
        }
    }
    return neighbors;
};
const createForensicBoard = (mineIndices = generateForensicMineIndices()) => {
    const mines = new Set(mineIndices);
    return Array.from({ length: FORENSIC_CELL_COUNT }, (_, index) => {
        const mine = mines.has(index);
        return { mine, count: mine ? 0 : forensicNeighbors(index).filter((neighbor) => mines.has(neighbor)).length };
    });
};
const createMinefieldState = (random = Math.random, previous = []) => ({ revealed: [], flags: [], status: 'active', mineIndices: generateForensicMineIndices(random, previous) });
const normalizeMinefieldState = (value, random = Math.random) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return createMinefieldState(random);
    const validIndices = (indices) => Array.isArray(indices)
        && indices.every((index) => Number.isInteger(index) && index >= 0 && index < FORENSIC_CELL_COUNT)
        && new Set(indices).size === indices.length;
    if (!isValidForensicMineIndices(value.mineIndices) || !validIndices(value.revealed) || !validIndices(value.flags) || value.flags.some((index) => value.revealed.includes(index))) return createMinefieldState(random, value.mineIndices);
    if (!['active', 'failed', 'won'].includes(value.status)) return createMinefieldState(random, value.mineIndices);
    const board = createForensicBoard(value.mineIndices);
    const safeRevealed = value.revealed.filter((index) => !board[index].mine).length;
    const hitMine = value.revealed.some((index) => board[index].mine);
    if (value.status === 'active' && hitMine) return createMinefieldState(random, value.mineIndices);
    if (value.status === 'failed' && !hitMine) return createMinefieldState(random, value.mineIndices);
    if (value.status === 'won' && (hitMine || safeRevealed !== FORENSIC_CELL_COUNT - FORENSIC_MINE_COUNT)) return createMinefieldState(random, value.mineIndices);
    return { revealed: [...value.revealed], flags: [...value.flags], status: value.status, mineIndices: [...value.mineIndices] };
};
const toggleMinefieldFlag = (state, index) => {
    if (!Number.isInteger(index) || index < 0 || index >= FORENSIC_CELL_COUNT || state.status !== 'active' || state.revealed.includes(index)) return state;
    const flags = state.flags.includes(index) ? state.flags.filter((flag) => flag !== index) : [...state.flags, index];
    return { ...state, flags };
};
const revealMinefieldCell = (state, index, board = createForensicBoard(state.mineIndices), random = Math.random) => {
    if (!Number.isInteger(index) || index < 0 || index >= FORENSIC_CELL_COUNT || state.status !== 'active' || state.revealed.includes(index) || state.flags.includes(index)) return state;
    let mineIndices = state.mineIndices;
    if (state.revealed.length === 0 && board[index].mine) {
        mineIndices = generateForensicMineIndices(random, state.mineIndices, [index]);
        board = createForensicBoard(mineIndices);
    }
    if (board[index].mine) return { ...state, revealed: [...state.revealed, index], status: 'failed', mineIndices };
    const revealed = new Set(state.revealed);
    const pending = [index];
    while (pending.length) {
        const current = pending.pop();
        if (revealed.has(current) || board[current].mine || state.flags.includes(current)) continue;
        revealed.add(current);
        if (board[current].count === 0) {
            for (const neighbor of forensicNeighbors(current)) {
                if (!revealed.has(neighbor) && !board[neighbor].mine && !state.flags.includes(neighbor)) pending.push(neighbor);
            }
        }
    }
    const next = { ...state, revealed: [...revealed].sort((left, right) => left - right), status: 'active', mineIndices };
    if (next.revealed.length === FORENSIC_CELL_COUNT - FORENSIC_MINE_COUNT) next.status = 'won';
    return next;
};
const resetForensicBoardProgress = (progress, random = Math.random) => ({
    ...progress,
    finalPuzzle: { ...progress.finalPuzzle, minefield: createMinefieldState(random, progress.finalPuzzle.minefield.mineIndices) }
});
const advanceForensicPhase = (progress, nextPhase, key = '') => {
    const currentPhase = progress?.finalPuzzle?.phase;
    const allowed = (currentPhase === 'minefield' && nextPhase === 'riddle' && progress.finalPuzzle.minefield.status === 'won')
        || (currentPhase === 'riddle' && nextPhase === 'code')
        || (currentPhase === 'code' && nextPhase === 'complete' && validateEmeraldKey(key));
    if (!allowed || progress.solved?.includes('finalCode')) return null;
    return { ...progress, finalPuzzle: { ...progress.finalPuzzle, phase: nextPhase } };
};
