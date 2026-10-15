// ========================================
// ARCHIVO NARRATIVO EDITABLE
// ========================================

const pdaContent = {
    ARCHIVOS: { label: 'MÓDULO / 01', description: 'Documentos recuperados de Arturo.', items: [
        { title: 'EVIDENCIA_002 / MENSAJE CIFRADO', status: 'NUEVO', text: 'Toda letra es un alma desterrada que el alfabeto, una senda donde las sombras caminan contra el sol. Busca la morada que yace tras la huella, mas no confíes en la ley cuando el espejo quiere. Tres heraldos, señalados por una marca que al azar no gobierna, reclaman el pasado. Solo quien distinga a los andariegos de los elegidos irá al nombre que la piedra guardaba.', puzzle: 'caesar', image: 'assets/images/evidencia-002-codigo-cesar.jpg', seal: 'assets/images/logo-mano-negra.jpg', note: 'REGISTRO DE INVESTIGACIÓN #002 · ARTURO OLMOS\nObserva las letras. Lee nuevamente las palabras. Hay algo escondido en la forma en que fueron escritas.' },
        { title: 'INFORME LAS LAJAS', status: 'BLOQUEADO', text: 'Arturo investigó el Santuario de Las Lajas. Hay una marca en el registro visual.', unlock: 2 },
        { title: 'EVIDENCIA_005 / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'TEATRO COLÓN. El telón de boca conserva una pista que Arturo dejó escondida.', unlock: 4, image: 'assets/images/evidencia-005-telon-colon.jpg', note: 'EVIDENCIA #005 · TEATRO COLÓN · REGISTRO DE ARTURO OLMOS\nHay cosas que solo pueden entenderse cuando se observa la imagen completa.' },
        { title: 'ARTURO_OLMOS_FINAL', status: 'BLOQUEADO', text: 'Archivo protegido. El código reúne los tres destinos de la investigación.', puzzle: 'finalCode', unlock: 8 }
    ] },
    MAPAS: { label: 'MÓDULO / 02', description: 'Rutas y marcas de la investigación.', items: [
        { title: 'RUTA DE ARTURO', status: 'BLOQUEADO', text: 'Tres lugares. Tres marcas. No sigas el orden del mapa. Sigue el orden de la investigación.', puzzle: 'route', unlock: 3 },
        { title: 'CIUDAD PERDIDA', status: 'BLOQUEADO', text: 'La palabra SIERRA señala la Sierra Nevada y el destino de Arturo.', puzzle: 'city', unlock: 5 }
    ] },
    NOTAS: { label: 'MÓDULO / 03', description: 'Anotaciones de Arturo Olmos.', items: [
        { title: 'NOTA / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'Sombra. Isla. Estrella. Río. Rastro. Aire. Las letras iniciales guardan una palabra.', puzzle: 'sierra', unlock: 4 },
        { title: 'LO QUE BUSCABAN', status: 'BLOQUEADO', text: 'Durante años todos buscaron una ciudad de oro. Pero Arturo encontró algo diferente. No busques el oro. Busca aquello que el oro ocultó.', puzzle: 'dorado', unlock: 6 },
        { title: 'LA VERDAD', status: 'BLOQUEADO', text: 'Relaciona El Dorado, Ciudad Perdida, La Mano Negra y Arturo Olmos para recuperar la investigación.', puzzle: 'truth', unlock: 9 }
    ] },
    FOTOS: { label: 'MÓDULO / 04', description: 'Evidencia visual recuperada.', items: [
        { title: 'FOTO / SANTUARIO DE LAS LAJAS', status: 'BLOQUEADO', text: 'La respuesta no está en lo que estás mirando. Está en aquello que decidiste ignorar. No busques una palabra. Busca una marca.', puzzle: 'mark', unlock: 2 }
    ] },
    MENSAJES: { label: 'MÓDULO / 05', description: 'Comunicaciones y advertencias recuperadas.', items: [
        { title: 'ORGANIZACIÓN IDENTIFICADA', status: 'BLOQUEADO', text: '¿Qué nombre aparece detrás de todas las pistas?', puzzle: 'hand', unlock: 7 }
    ] },
    SEGURIDAD: { label: 'MÓDULO / 06', description: 'Archivos cifrados y niveles de acceso.', items: [
        { title: 'DIRECCIÓN', status: 'ACCESO DENEGADO', text: 'IDENTIDAD DEL LÍDER: ████████████████', unlock: 10 }
    ] }
};
