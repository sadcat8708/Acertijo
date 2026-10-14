// ========================================
// SISTEMA DE ACERTIJOS
// ========================================
//
// Este archivo está preparado para añadir los
// acertijos definitivos cuando estén escritos.
// Mantengan aquí sus contraseñas, validaciones,
// pistas y desbloqueos.
//

const puzzles = {
    // Ejemplo de estructura:
    // mapaInicial: {
    //     answer: 'CIUDAD PERDIDA',
    //     hint: 'Revisa las marcas del mapa.',
    //     unlocks: 'MAPAS-1'
    // }
};

// Valida una respuesta sin importar mayúsculas,
// minúsculas ni espacios al inicio o final.
const validatePuzzleAnswer = (answer, expectedAnswer) => {
    return answer.trim().toUpperCase() === expectedAnswer.trim().toUpperCase();
};
