// Inicializar Iconos
lucide.createIcons();

// Variables DOM
const views = {
    dashboard: document.getElementById('view-dashboard'),
    upload: document.getElementById('view-upload')
};
const btns = {
    dashboard: document.getElementById('btn-dashboard'),
    upload: document.getElementById('btn-upload')
};
const title = document.getElementById('page-title');

// Función para cambiar pestañas
function switchTab(tabName) {
    // 1. Ocultar todas las vistas
    Object.values(views).forEach(el => el.classList.add('hidden-section'));

    // 2. Desactivar estilos de todos los botones
    Object.values(btns).forEach(btn => {
        btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-textDim hover:bg-surfaceHighlight hover:text-text";
        const icon = btn.querySelector('i'); // Cambiar color icono
        if (icon) icon.classList.remove('text-primary');
    });

    // 3. Activar vista actual
    views[tabName].classList.remove('hidden-section');
    views[tabName].classList.add('fade-in');

    // 4. Activar estilo botón actual
    const activeBtn = btns[tabName];
    activeBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-primary/10 text-primary border border-primary/20 shadow-neon";
    activeBtn.querySelector('i').classList.add('text-primary');

    // 5. Cambiar título
    title.innerText = tabName === 'dashboard' ? 'Resumen Operativo' : 'Análisis Forense';
}

// --- Lógica Drag & Drop ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resultContainer = document.getElementById('result-container');
const previewImg = document.getElementById('preview-img');
const plateResult = document.getElementById('plate-result');

// Eventos de arrastre
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropZone.addEventListener('dragover', () => {
    dropZone.classList.add('border-primary', 'bg-surface/40');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-primary', 'bg-surface/40');
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
});

fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            showPreview(file);
        } else {
            alert("Por favor sube solo imágenes.");
        }
    }
}

function showPreview(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
        // Ocultar dropzone, mostrar resultados
        dropZone.classList.add('hidden-section');
        resultContainer.classList.remove('hidden-section');
        resultContainer.classList.add('fade-in');

        previewImg.src = reader.result;

        // Simular procesamiento IA
        plateResult.innerText = "ANALIZANDO...";
        setTimeout(() => {
            plateResult.innerText = "ABC-" + Math.floor(Math.random() * 900 + 100); // Mock result
        }, 1500);
    }
}

function resetUpload() {
    resultContainer.classList.add('hidden-section');
    dropZone.classList.remove('hidden-section');
    dropZone.classList.remove('border-primary', 'bg-surface/40'); // Reset estilos drag
    fileInput.value = ""; // Reset input
}