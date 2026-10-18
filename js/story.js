// ========================================
// ARCHIVO NARRATIVO EDITABLE
// ========================================

const pdaContent = {
    ARCHIVOS: { label: 'MÓDULO / 01', description: 'Documentos recuperados de Arturo.', items: [
        { title: 'EVIDENCIA_002 / MENSAJE CIFRADO', status: 'NUEVO', text: 'Toda letra es un alma desterrada, y el alfabeto, una senda donde las sombras caminan contra el sol. Busca la morada que yace tras la huella, mas no confíes en la ley cuando el espejo se quiebre. Tres heraldos, señalados por una marca que el azar no gobierna, desafiarán el ocaso y reclamarán el paso contrario. Solo quien distinga a los condenados de los elegidos oirá el nombre que la piedra guarda.', puzzle: 'caesar', image: 'assets/images/arcangel-san-miguel.jpg' },
        { title: 'INFORME LAS LAJAS', status: 'BLOQUEADO', text: 'Arturo investigó el Santuario de Las Lajas. Hay una marca en el registro visual.', unlock: 2 },
        { title: 'EVIDENCIA_005 / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'TEATRO COLÓN. Registro visual recuperado de los archivos de Arturo.', unlock: 4, image: 'assets/images/evidencia-005-telon-colon.jpg' },
        { title: 'ARTURO_OLMOS_FINAL', status: 'BLOQUEADO', text: 'Archivo protegido. El código reúne los tres destinos de la investigación.', puzzle: 'finalCode', unlock: 8 }
    ] },
    MAPAS: { label: 'MÓDULO / 02', description: 'Rutas y marcas de la investigación.', items: [
        { title: 'RUTA DE ARTURO', status: 'BLOQUEADO', text: 'Ubicaciones registradas por Arturo.', puzzle: 'route', unlock: 3 },
        { title: 'CIUDAD PERDIDA', status: 'BLOQUEADO', text: 'La palabra SIERRA señala la Sierra Nevada y el destino de Arturo.', puzzle: 'city', unlock: 5 }
    ] },
    NOTAS: { label: 'MÓDULO / 03', description: 'Anotaciones de Arturo Olmos.', items: [
        { title: 'NOTA / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'Sombra. Isla. Estrella. Río. Rastro. Aire. Las letras iniciales guardan una palabra.', puzzle: 'sierra', unlock: 4 },
        { title: 'LO QUE BUSCABAN', status: 'BLOQUEADO', text: 'Durante años todos buscaron una ciudad de oro. Pero Arturo encontró algo diferente. No busques el oro. Busca aquello que el oro ocultó.', puzzle: 'dorado', unlock: 6 },
        { title: 'LA VERDAD', status: 'BLOQUEADO', text: 'Relaciona El Dorado, Ciudad Perdida, La Mano Negra y Arturo Olmos para recuperar la investigación.', puzzle: 'truth', unlock: 9 }
    ] },
    FOTOS: { label: 'MÓDULO / 04', description: 'Evidencia visual recuperada.', items: [
        { title: 'FOTO / SANTUARIO DE LAS LAJAS', status: 'BLOQUEADO', text: 'La respuesta no está en lo que estás mirando. Está en aquello que decidiste ignorar. No busques una palabra. Busca una marca.', puzzle: 'mark', unlock: 2, image: 'assets/images/logo-mano-negra.jpg', note: 'EVIDENCIA VISUAL / MARCA NO IDENTIFICADA\nLa fotografía fue encontrada entre los archivos de Arturo.' }
    ] },
    MENSAJES: { label: 'MÓDULO / 05', description: 'Comunicaciones y advertencias recuperadas.', items: [
        { title: 'ORGANIZACIÓN IDENTIFICADA', status: 'BLOQUEADO', text: 'Registro de identificación pendiente.', puzzle: 'hand', unlock: 7 }
    ] },
    SEGURIDAD: { label: 'MÓDULO / 06', description: 'Archivos cifrados y niveles de acceso.', items: [
        { title: 'DIRECCIÓN', status: 'ACCESO DENEGADO', text: 'IDENTIDAD DEL LÍDER: ████████████████', unlock: 10 },
        { title: 'REINICIAR INVESTIGACIÓN', status: 'SISTEMA', text: 'Borra el progreso y reinicia la PDA.', reset: true }
    ] }
};
