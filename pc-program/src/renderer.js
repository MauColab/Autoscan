// Inicializar Iconos
lucide.createIcons();

// --- STATE MANAGEMENT ---
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
const stations = JSON.parse(localStorage.getItem('stations')) || [];

// --- DOM ELEMENTS ---
const views = {
    auth: document.getElementById('auth-view'),
    app: document.getElementById('app-view'),
    reports: document.getElementById('view-reports'),
    evaluations: document.getElementById('view-evaluations'),
    cameras: document.getElementById('view-cameras'),
    upload: document.getElementById('view-upload')
};

const navBtns = {
    reports: document.getElementById('btn-reports'),
    evaluations: document.getElementById('btn-evaluations'),
    cameras: document.getElementById('btn-cameras'),
    upload: document.getElementById('btn-upload')
};

const pageTitle = document.getElementById('page-title');
const stationDisplay = document.getElementById('station-display');
const userNameDisplay = document.getElementById('user-name');

// --- INITIALIZATION ---
function init() {
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
    renderReports();
    renderEvaluations();
}

// --- AUTHENTICATION ---
function showAuth() {
    views.auth.classList.remove('hidden-section');
    views.app.classList.add('hidden-section');
}

function showApp() {
    views.auth.classList.add('hidden-section');
    views.app.classList.remove('hidden-section');
    
    if(currentUser) {
        stationDisplay.innerText = currentUser.name;
        userNameDisplay.innerText = `Oficial ${currentUser.id}`;
    }
    
    // Default tab
    switchTab('reports');
}

function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('station-id').value;
    const pass = document.getElementById('password').value;

    // Mock Login (Accept any if empty, or check against registered)
    const station = stations.find(s => s.id === id && s.pass === pass);
    
    if (station || (id === 'admin' && pass === 'admin')) {
        currentUser = station || { id: 'ADMIN', name: 'Comisaría Central', pass: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showApp();
    } else {
        alert('Credenciales inválidas');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-station-name').value;
    const id = document.getElementById('reg-station-id').value;
    const pass = document.getElementById('reg-password').value;

    if(stations.find(s => s.id === id)) {
        alert('ID de comisaría ya existe');
        return;
    }

    const newStation = { id, name, pass };
    stations.push(newStation);
    localStorage.setItem('stations', JSON.stringify(stations));
    
    alert('Comisaría registrada exitosamente. Por favor inicie sesión.');
    toggleAuthMode();
}

function toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const switchText = document.getElementById('auth-switch-text');

    if (loginForm.classList.contains('hidden-section')) {
        loginForm.classList.remove('hidden-section');
        regForm.classList.add('hidden-section');
        switchText.innerHTML = '¿No está registrado? <a href="#" onclick="toggleAuthMode()" class="text-primary hover:underline">Registrar Comisaría</a>';
    } else {
        loginForm.classList.add('hidden-section');
        regForm.classList.remove('hidden-section');
        switchText.innerHTML = '¿Ya tiene cuenta? <a href="#" onclick="toggleAuthMode()" class="text-primary hover:underline">Iniciar Sesión</a>';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
}

// --- NAVIGATION ---
function switchTab(tabName) {
    // Hide all content views
    ['reports', 'evaluations', 'cameras', 'upload'].forEach(v => {
        views[v].classList.add('hidden-section');
    });

    // Reset nav buttons
    Object.values(navBtns).forEach(btn => {
        btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-textDim hover:bg-surfaceHighlight hover:text-text";
        const icon = btn.querySelector('i');
        if(icon) icon.classList.remove('text-primary');
    });

    // Show selected view
    views[tabName].classList.remove('hidden-section');
    
    // Highlight button
    const activeBtn = navBtns[tabName];
    if(activeBtn) {
        activeBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all bg-primary/10 text-primary border border-primary/20 shadow-sm";
        activeBtn.querySelector('i').classList.add('text-primary');
    }

    // Update Title
    const titles = {
        reports: 'Reporte de Placas',
        evaluations: 'Evaluaciones Móviles',
        cameras: 'Cámaras de Vigilancia',
        upload: 'Cargar Evidencia'
    };
    pageTitle.innerText = titles[tabName];
}

// --- MOCK DATA & RENDERING ---

// 1. Reports (Placas)
const mockReports = [
    { plate: 'ABC-123', model: 'Toyota Corolla', location: 'Av. Javier Prado', owner: 'Juan Perez', status: 'Limpio', time: '10:42 AM' },
    { plate: 'XYZ-987', model: 'Nissan Sentra', location: 'Calle Los Pinos', owner: 'Maria Lopez', status: 'Robado', time: '11:15 AM' },
    { plate: 'LMN-456', model: 'Kia Rio', location: 'Av. Arequipa', owner: 'Carlos Ruiz', status: 'Limpio', time: '11:30 AM' },
    { plate: 'PQR-789', model: 'Hyundai Accent', location: 'Ovalo Monitor', owner: 'Ana Torres', status: 'Sospechoso', time: '12:05 PM' },
    { plate: 'DEF-321', model: 'Honda Civic', location: 'Av. La Marina', owner: 'Luis Gomez', status: 'Limpio', time: '12:45 PM' },
];

function renderReports() {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = mockReports.map(r => `
        <tr class="hover:bg-surfaceHighlight/30 transition-colors">
            <td class="px-6 py-4 font-mono text-primary font-bold">${r.plate}</td>
            <td class="px-6 py-4 text-textDim">${r.model}</td>
            <td class="px-6 py-4 text-textDim">${r.location}</td>
            <td class="px-6 py-4 text-textDim">${r.owner}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${getStatusClass(r.status)}">
                    ${r.status.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 text-textDim text-xs">${r.time}</td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'Robado': return 'bg-error/20 text-error';
        case 'Sospechoso': return 'bg-secondary/20 text-secondary';
        default: return 'bg-success/20 text-success';
    }
}

// 2. Evaluations (Mobile App)
const mockEvaluations = [
    { id: 1, sender: 'Oficial Ramirez', dni: '45879632', summary: 'Vehículo estacionado en zona rígida por 3 horas. Posible abandono.', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80' },
    { id: 2, sender: 'Sgt. Mendoza', dni: '12345678', summary: 'Conductor se dio a la fuga tras choque leve. Placa visible parcialmente.', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80' },
    { id: 3, sender: 'Oficial Castro', dni: '98765432', summary: 'Vehículo con lunas polarizadas sin permiso visible.', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80' },
];

function renderEvaluations() {
    const grid = document.getElementById('evaluations-grid');
    grid.innerHTML = mockEvaluations.map(e => `
        <div class="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden flex flex-col">
            <div class="h-48 overflow-hidden relative group">
                <img src="${e.img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60"></div>
                <div class="absolute bottom-3 left-3">
                    <span class="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-xs font-bold">NUEVO CASO</span>
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h4 class="font-bold text-text">${e.sender}</h4>
                        <p class="text-xs text-textDim">DNI: ${e.dni}</p>
                    </div>
                    <button class="text-textDim hover:text-primary"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
                </div>
                <p class="text-sm text-textDim mb-4 flex-1">${e.summary}</p>
                <div class="flex gap-2 mt-auto">
                    <button class="flex-1 py-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-lg text-xs font-bold transition-colors">DESCARTAR</button>
                    <button class="flex-1 py-2 bg-primary text-background hover:bg-primary/90 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-primary/10">PROCESAR</button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- UPLOAD LOGIC ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resultContainer = document.getElementById('result-container');
const filenameDisplay = document.getElementById('filename-display');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

dropZone.addEventListener('dragover', () => dropZone.classList.add('border-primary', 'bg-surface/40'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary', 'bg-surface/40'));

dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('border-primary', 'bg-surface/40');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        // Accept images or zip
        if (file.type.startsWith('image/') || file.name.endsWith('.zip') || file.type.includes('zip')) {
            processFile(file);
        } else {
            alert("Solo se permiten imágenes o archivos .zip");
        }
    }
}

function processFile(file) {
    dropZone.classList.add('hidden-section');
    resultContainer.classList.remove('hidden-section');
    resultContainer.classList.add('fade-in');
    
    filenameDisplay.innerText = file.name;
    
    // Here you would normally send the file to the backend
    console.log("Processing file:", file.name);
}

function resetUpload() {
    resultContainer.classList.add('hidden-section');
    dropZone.classList.remove('hidden-section');
    fileInput.value = "";
}

// Start
init();

// Expose functions to window for HTML onclick events
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.toggleAuthMode = toggleAuthMode;
window.logout = logout;
window.switchTab = switchTab;
window.resetUpload = resetUpload;