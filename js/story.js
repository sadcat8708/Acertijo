// ========================================
// ARCHIVO NARRATIVO EDITABLE
// ========================================

const pdaContent = {
    ARCHIVOS: { label: 'MÓDULO / 01', description: 'Registros recuperados de la última investigación de Arturo.', items: [
        { title: 'EVIDENCIA_002 / MENSAJE CIFRADO', status: 'NUEVO', text: 'Toda letra es un alma desterrada, y el alfabeto, una senda donde las sombras caminan contra el sol. Busca la morada que yace tras la huella, mas no confíes en la ley cuando el espejo se quiebre. Tres heraldos, señalados por una marca que el azar no gobierna, desafiarán el ocaso y reclamarán el paso contrario. Solo quien distinga a los condenados de los elegidos oirá el nombre que la piedra guarda.', puzzle: 'caesar', image: 'assets/images/arcangel-san-miguel.jpg' },
        { title: 'INFORME LAS LAJAS', status: 'BLOQUEADO', text: 'En el Santuario de Las Lajas, Arturo señaló una zona cercana a la representación del Arcángel San Miguel. Allí quedó registrada una marca que no figuraba en las fotografías originales.', unlock: 2 },
        { title: 'EVIDENCIA_005 / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'Registro recuperado del Teatro Colón. Arturo comparó imágenes del telón de boca y dejó constancia de que una referencia visual conectaba este lugar con el siguiente tramo de su investigación.', unlock: 4, image: 'assets/images/evidencia-005-telon-colon.jpg' },
        { title: 'ARTURO_OLMOS_FINAL', status: 'BLOQUEADO', text: 'Registro final de Arturo: la investigación no trataba de un tesoro, sino de documentos y conocimientos que alguien había protegido durante generaciones.', puzzle: 'finalCode', unlock: 8 }
    ] },
    MAPAS: { label: 'MÓDULO / 02', description: 'Rutas, marcas y destinos de la investigación.', items: [
        { title: 'RUTA DE ARTURO', status: 'BLOQUEADO', text: 'Arturo conectó tres ubicaciones en sus notas de campo. No forman un recorrido turístico: cada una conserva una parte distinta de la investigación.', puzzle: 'route', unlock: 3 },
        { title: 'CIUDAD PERDIDA', status: 'BLOQUEADO', text: 'Archivo de campo: Arturo investigaba cómo las historias de El Dorado y Ciudad Perdida pudieron usarse para ocultar una ruta de conocimiento más antigua.', puzzle: 'city', unlock: 5 }
    ] },
    NOTAS: { label: 'MÓDULO / 03', description: 'Anotaciones y fragmentos de la investigación de Arturo.', items: [
        { title: 'NOTA / TELÓN DE BOCA', status: 'BLOQUEADO', text: 'Sombra. Isla. Estrella. Río. Rastro. Aire. Las letras iniciales guardan una palabra.', puzzle: 'sierra', unlock: 4 },
        { title: 'LO QUE BUSCABAN', status: 'BLOQUEADO', text: 'Durante años todos buscaron una ciudad de oro. Pero Arturo encontró algo diferente. No busques el oro. Busca aquello que el oro ocultó.', puzzle: 'dorado', unlock: 6 },
        { title: 'LA VERDAD', status: 'BLOQUEADO', text: 'Conclusión preliminar: La Mano Negra no custodiaba un tesoro. Custodiaba registros sobre una antigua cadena de conocimiento vinculada con los tres lugares.', puzzle: 'truth', unlock: 9 }
    ] },
    FOTOS: { label: 'MÓDULO / 04', description: 'Evidencia visual recuperada de Las Lajas.', items: [
        { title: 'FOTO / SANTUARIO DE LAS LAJAS', status: 'BLOQUEADO', text: 'La respuesta no está en lo que estás mirando. Está en aquello que decidiste ignorar. No busques una palabra. Busca una marca.', puzzle: 'mark', unlock: 2, image: 'assets/images/logo-mano-negra.jpg', note: 'EVIDENCIA VISUAL / MARCA NO IDENTIFICADA\nLa fotografía fue encontrada entre los archivos de Arturo.' }
    ] },
    MENSAJES: { label: 'MÓDULO / 05', description: 'Comunicaciones y advertencias recuperadas.', items: [
        { title: 'AUDIO / INTERFERENCIA', status: 'BLOQUEADO', text: 'Grabación dañada de Arturo. La señal contiene tres canales fuera de sincronía.', puzzle: 'interference', unlock: 4 },
        { title: 'ORGANIZACIÓN IDENTIFICADA', status: 'BLOQUEADO', text: 'Fragmento de audio de Arturo: «No intentes descubrir quiénes son. Descubre qué protegen». El origen de la señal sigue sin identificarse.', puzzle: 'hand', unlock: 7 }
    ] },
    SEGURIDAD: { label: 'MÓDULO / 06', description: 'Archivos cifrados y protocolo de conservación.', items: [
        { title: 'DIRECCIÓN', status: 'ACCESO DENEGADO', text: 'La investigación fue protegida, pero la identidad de quien dirige La Mano Negra permanece bloqueada.', unlock: 10 },
        { title: 'REINICIAR INVESTIGACIÓN', status: 'SISTEMA', text: 'Borra el progreso y reinicia la PDA.', reset: true }
    ] }
};
