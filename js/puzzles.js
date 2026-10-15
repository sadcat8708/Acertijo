// ========================================
// RESPUESTAS Y DESBLOQUEOS
// ========================================

const puzzles = {
    caesar: { answer: ['SANTUARIO DE LAS LAJAS', 'SANTUARIODELASLAJAS'], prompt: 'Usa la relación de letras: la letra aparente está un paso después de la letra final. Descifra el destino.', cipher: 'TBOUVBSJPEFMBTMBKBT', success: 'DESTINO IDENTIFICADO: SANTUARIO DE LAS LAJAS.' },
    mark: { answer: ['LA MANO NEGRA', 'MANO NEGRA'], prompt: 'Selecciona el símbolo oculto en la evidencia.', success: 'Ya saben que estuviste aquí.' },
    route: { answer: ['LAS LAJAS TEATRO COLON CIUDAD PERDIDA'], prompt: 'Escribe el orden: LAS LAJAS → TEATRO COLÓN → CIUDAD PERDIDA.', success: 'RUTA CONFIRMADA: TEATRO COLÓN ES EL SIGUIENTE DESTINO.' },
    sierra: { answer: ['SIERRA'], prompt: '¿Qué palabra forman las primeras letras?', success: 'SIERRA IDENTIFICADA. LA RUTA CONTINÚA.' },
    city: { answer: ['CIUDAD PERDIDA'], prompt: '¿A qué destino lleva la pista SIERRA?', success: 'DESTINO DESBLOQUEADO: CIUDAD PERDIDA.' },
    dorado: { answer: ['EL DORADO', 'DORADO'], prompt: 'No busques el oro. ¿Qué ocultó el oro?', success: 'Ahora lo entiendo. El Dorado nunca fue solamente una ciudad.' },
    hand: { answer: ['LA MANO NEGRA', 'MANO NEGRA'], prompt: '¿Qué nombre aparece detrás de todas las pistas?', success: 'ORGANIZACIÓN IDENTIFICADA: LA MANO NEGRA.' },
    finalCode: { answer: ['LAS LAJAS TEATRO COLON CIUDAD PERDIDA'], prompt: 'Código de Arturo: escribe sus tres destinos en orden.', success: 'ARCHIVO DESBLOQUEADO: Arturo protegía pruebas de una conspiración.' },
    truth: { answer: ['LA MANO NEGRA'], prompt: '¿Qué organización persiguió a Arturo por la conexión entre El Dorado y Ciudad Perdida?', success: 'INVESTIGACIÓN RECUPERADA. LA MANO NEGRA ESTABA DETRÁS DE LA PERSECUCIÓN.' }
};

const normalizeAnswer = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
const validatePuzzleAnswer = (answer, puzzle) => puzzle.answer.some((expected) => normalizeAnswer(answer) === normalizeAnswer(expected));
