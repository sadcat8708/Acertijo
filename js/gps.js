// Ubicaciones derivadas de los acertijos ya existentes; no se consulta el GPS del navegador.
const GPS_FIXES = Object.freeze([
    Object.freeze({ puzzle: 'mark', place: 'SANTUARIO DE LAS LAJAS', coordinates: '0.805556, -77.586111', status: 'POSICIÓN RECUPERADA' }),
    Object.freeze({ puzzle: 'route', place: 'TEATRO COLÓN · BOGOTÁ', coordinates: '4.596667, -74.074444', status: 'UBICACIÓN IDENTIFICADA' }),
    Object.freeze({ puzzle: 'city', place: 'CIUDAD PERDIDA · TEYUNA', coordinates: '11.037000, -73.925000', status: 'DESTINO IDENTIFICADO' })
]);

const getLatestGpsFix = (progress) => {
    if (!progress || !Array.isArray(progress.solved)) return null;
    return [...GPS_FIXES].reverse().find(({ puzzle }) => progress.solved.includes(puzzle)) || null;
};
