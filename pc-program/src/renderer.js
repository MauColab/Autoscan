// Inicializar Iconos
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// --- STATE MANAGEMENT ---
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
const stations = JSON.parse(localStorage.getItem('stations')) || [];
const API_URL = 'http://localhost:5000'; // PC connects to localhost

// --- DOM ELEMENTS ---
let views, navBtns, pageTitle, stationDisplay, userNameDisplay;
let currentReportId = null; // For status update

// Queue for multiple plates
let plateQueue = [];
let currentPlateIndex = 0;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM references
    views = {
        auth: document.getElementById('auth-view'),
        app: document.getElementById('app-view'),
        reports: document.getElementById('view-reports'),
        evaluations: document.getElementById('view-evaluations'),
        cameras: document.getElementById('view-cameras'),
        upload: document.getElementById('view-upload')
    };

    navBtns = {
        reports: document.getElementById('btn-reports'),
        evaluations: document.getElementById('btn-evaluations'),
        cameras: document.getElementById('btn-cameras'),
        upload: document.getElementById('btn-upload')
    };

    pageTitle = document.getElementById('page-title');
    stationDisplay = document.getElementById('station-display');
    userNameDisplay = document.getElementById('user-name');

    // Initialize App State
    init();
});

function init() {
    try {
        if (currentUser) {
            showApp();
        } else {
            showAuth();
        }
    } catch (e) {
        console.error("Error initializing app view:", e);
        showAuth();
    }
}

// --- AUTHENTICATION ---
function showAuth() {
    if (!views.auth || !views.app) return;
    views.auth.classList.remove('hidden-section');
    views.app.classList.add('hidden-section');
}

function showApp() {
    if (!views.auth || !views.app) return;
    views.auth.classList.add('hidden-section');
    views.app.classList.remove('hidden-section');

    if (currentUser) {
        if (stationDisplay) stationDisplay.innerText = currentUser.name;
        if (userNameDisplay) userNameDisplay.innerText = `Oficial ${currentUser.id}`;
    }

    // Default tab
    switchTab('reports');
}

function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('station-id').value;
    const pass = document.getElementById('password').value;

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

    if (stations.find(s => s.id === id)) {
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
    if (!views || !views[tabName]) return;

    ['reports', 'evaluations', 'cameras', 'upload'].forEach(v => {
        if (views[v]) views[v].classList.add('hidden-section');
    });

    Object.values(navBtns).forEach(btn => {
        if (btn) {
            btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-textDim hover:bg-surfaceHighlight hover:text-text";
            const icon = btn.querySelector('i');
            if (icon) icon.classList.remove('text-primary');
        }
    });

    views[tabName].classList.remove('hidden-section');

    const activeBtn = navBtns[tabName];
    if (activeBtn) {
        activeBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all bg-primary/10 text-primary border border-primary/20 shadow-sm";
        activeBtn.querySelector('i').classList.add('text-primary');
    }

    const titles = {
        reports: 'Reporte de Placas',
        evaluations: 'Evaluaciones Móviles',
        cameras: 'Cámaras de Vigilancia',
        upload: 'Cargar Evidencia'
    };

    if (pageTitle) {
        pageTitle.innerText = titles[tabName];
    }
    
    // Refresh data when switching tabs
    if (tabName === 'reports') fetchReports();
    if (tabName === 'evaluations') fetchEvaluations();
}

// --- API INTEGRATION ---

// 1. REPORTS
async function fetchReports() {
    try {
        const response = await fetch(`${API_URL}/reports`);
        const reports = await response.json();
        renderReports(reports);
    } catch (e) {
        console.error("Error fetching reports:", e);
    }
}

function renderReports(reports) {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    tbody.innerHTML = reports.map(r => `
        <tr class="hover:bg-surfaceHighlight/30 transition-colors">
            <td class="px-6 py-4 font-mono text-primary font-bold">${r.plate}</td>
            <td class="px-6 py-4 text-textDim">${r.model || '-'}</td>
            <td class="px-6 py-4 text-textDim">${r.location || '-'}</td>
            <td class="px-6 py-4 text-textDim">${r.owner || '-'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${getStatusClass(r.status)}">
                    ${r.status.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 text-textDim text-xs">${r.time}</td>
            <td class="px-6 py-4">
                ${r.status === 'Sospechoso' ? 
                    `<button onclick="openStatusModal('${r.id}', '${r.plate}')" class="text-xs bg-surfaceHighlight hover:bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30 transition-colors">Actualizar Estado</button>` 
                    : '<span class="text-textDim text-xs">-</span>'}
            </td>
        </tr>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getStatusClass(status) {
    switch (status) {
        case 'Robado': return 'bg-error/20 text-error';
        case 'Sospechoso': return 'bg-secondary/20 text-secondary';
        case 'Limpio': return 'bg-success/20 text-success';
        default: return 'bg-surfaceHighlight text-textDim';
    }
}

// 2. EVALUATIONS
async function fetchEvaluations() {
    try {
        const response = await fetch(`${API_URL}/evaluations`);
        const evals = await response.json();
        const pending = evals.filter(e => e.status === 'pending');
        
        const badge = document.getElementById('eval-badge');
        if (badge) {
            badge.innerText = pending.length;
            badge.classList.toggle('hidden-section', pending.length === 0);
        }
        
        renderEvaluations(pending);
    } catch (e) {
        console.error("Error fetching evaluations:", e);
    }
}

function renderEvaluations(evals) {
    const grid = document.getElementById('evaluations-grid');
    if (!grid) return;

    if (evals.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-textDim py-10">No hay evaluaciones pendientes</div>';
        return;
    }

    grid.innerHTML = evals.map(e => `
        <div class="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden flex flex-col">
            <div class="h-48 overflow-hidden relative group">
                <img src="${e.img_url && e.img_url.startsWith('http') ? e.img_url : 'https://via.placeholder.com/400x300?text=Evidencia'}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60"></div>
                <div class="absolute bottom-3 left-3">
                    <span class="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-xs font-bold">PLACA: ${e.plate}</span>
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h4 class="font-bold text-text">${e.sender}</h4>
                        <p class="text-xs text-textDim">DNI: ${e.dni}</p>
                    </div>
                </div>
                <p class="text-sm text-textDim mb-4 flex-1">
                    <span class="block text-text font-bold mb-1">Ubicación: ${e.location || 'No especificada'}</span>
                    ${e.summary}
                </p>
                <div class="flex gap-2 mt-auto">
                    <button onclick="processEvaluation('${e.id}', 'discarded')" class="flex-1 py-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-lg text-xs font-bold transition-colors">DESCARTAR</button>
                    <button onclick="processEvaluation('${e.id}', 'reviewing')" class="flex-1 py-2 bg-primary text-background hover:bg-primary/90 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-primary/10">PROCESAR</button>
                </div>
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function processEvaluation(id, action) {
    try {
        await fetch(`${API_URL}/evaluations/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action })
        });

        if (action === 'reviewing') {
            const response = await fetch(`${API_URL}/evaluations`);
            const evals = await response.json();
            const target = evals.find(e => e.id === id);
            
            if (target) {
                await fetch(`${API_URL}/reports`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plate: target.plate,
                        model: target.model,
                        location: target.location,
                        owner: target.owner,
                        status: 'Sospechoso'
                    })
                });
                alert("Se envió para verificar los antecedentes");
            }
        }

        fetchEvaluations();
    } catch (e) {
        console.error("Error processing evaluation:", e);
    }
}

// --- UPLOAD & MODALS ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resultContainer = document.getElementById('result-container');
const filenameDisplay = document.getElementById('filename-display');

if (dropZone) {
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
}

if (fileInput) {
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/') || file.name.endsWith('.zip') || file.type.includes('zip')) {
            processFile(file);
        } else {
            alert("Solo se permiten imágenes o archivos .zip");
        }
    }
}

async function processFile(file) {
    if (dropZone) dropZone.classList.add('hidden-section');
    if (resultContainer) {
        resultContainer.classList.remove('hidden-section');
        resultContainer.classList.add('fade-in');
        // Add "Upload Another" button if not exists
        if (!document.getElementById('btn-upload-another')) {
             const btn = document.createElement('button');
             btn.id = 'btn-upload-another';
             btn.className = "mt-4 w-full py-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-lg text-xs font-bold transition-colors";
             btn.innerText = "SUBIR OTRA EVIDENCIA";
             btn.onclick = resetUpload;
             resultContainer.appendChild(btn);
        }
    }

    if (filenameDisplay) filenameDisplay.innerText = "Procesando " + file.name + "...";

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
             const plates = data.plates_found || [];
             
             if (filenameDisplay) {
                 filenameDisplay.innerHTML = `
                    <span class="text-primary">${file.name}</span><br>
                    <span class="text-success">Placas encontradas: ${plates.length}</span>
                 `;
             }
             
             if (plates.length > 1) {
                 // Multiple plates: Ask user
                 openSelectionModal(plates);
             } else if (plates.length === 1) {
                 // Single plate: Direct process
                 startPlateQueue([plates[0]]);
             } else {
                 alert("No se detectaron placas en la imagen.");
             }
             
        } else {
             if (filenameDisplay) filenameDisplay.innerText = "Error: " + (data.error || "Desconocido");
        }

    } catch (error) {
        console.error("API Error:", error);
        if (filenameDisplay) filenameDisplay.innerText = "Error de conexión con el servidor AI.";
    }
}

function resetUpload() {
    if (resultContainer) resultContainer.classList.add('hidden-section');
    if (dropZone) dropZone.classList.remove('hidden-section');
    if (fileInput) fileInput.value = "";
}

// --- MULTIPLE PLATE LOGIC ---
function openSelectionModal(plates) {
    // Create modal dynamically if not exists (or use a predefined one)
    // For simplicity, we'll use a prompt-like approach or inject HTML
    // Let's inject a simple modal into the body
    
    let modal = document.getElementById('modal-selection');
    if (!modal) {
        const modalHTML = `
        <div id="modal-selection" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden-section">
            <div class="bg-surface border border-surfaceHighlight rounded-xl w-full max-w-md p-6 shadow-2xl">
                <h3 class="text-xl font-bold text-text mb-4">Placas Detectadas</h3>
                <p class="text-sm text-textDim mb-4">Seleccione las placas que desea reportar:</p>
                <div id="selection-list" class="space-y-2 mb-6 max-h-60 overflow-y-auto"></div>
                <div class="flex justify-end gap-3">
                    <button onclick="closeModal('modal-selection')" class="px-4 py-2 text-textDim hover:text-text text-sm font-bold">Cancelar</button>
                    <button onclick="confirmSelection()" class="px-6 py-2 bg-primary text-background rounded-lg font-bold hover:bg-primary/90 transition-colors">Continuar</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modal-selection');
    }
    
    const list = document.getElementById('selection-list');
    list.innerHTML = plates.map((p, i) => `
        <label class="flex items-center gap-3 p-3 bg-background border border-surfaceHighlight rounded-lg cursor-pointer hover:border-primary/50">
            <input type="checkbox" value="${p}" class="w-4 h-4 accent-primary" checked>
            <span class="font-mono font-bold text-text">${p}</span>
        </label>
    `).join('');
    
    modal.classList.remove('hidden-section');
}

function confirmSelection() {
    const checkboxes = document.querySelectorAll('#selection-list input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);
    
    if (selected.length === 0) {
        alert("Seleccione al menos una placa.");
        return;
    }
    
    closeModal('modal-selection');
    startPlateQueue(selected);
}

function startPlateQueue(plates) {
    plateQueue = plates;
    currentPlateIndex = 0;
    openDetailsModal(plateQueue[0]);
}

// --- MODAL LOGIC ---
function openDetailsModal(plate) {
    const input = document.getElementById('modal-plate');
    input.value = plate;
    input.removeAttribute('readonly'); // Make editable
    
    document.getElementById('modal-model').value = '';
    document.getElementById('modal-location').value = '';
    document.getElementById('modal-owner').value = '';
    
    // Update button text
    const btn = document.querySelector('#details-form button[type="submit"]');
    if (plateQueue.length > 1 && currentPlateIndex < plateQueue.length - 1) {
        btn.innerText = "Siguiente Placa (" + (currentPlateIndex + 1) + "/" + plateQueue.length + ")";
    } else {
        btn.innerText = "Guardar Reporte";
    }
    
    document.getElementById('modal-details').classList.remove('hidden-section');
}

function openStatusModal(id, plate) {
    currentReportId = id;
    document.getElementById('status-plate').innerText = plate;
    document.getElementById('modal-status').classList.remove('hidden-section');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden-section');
}

async function submitDetails(e) {
    e.preventDefault();
    const plate = document.getElementById('modal-plate').value;
    const model = document.getElementById('modal-model').value;
    const location = document.getElementById('modal-location').value;
    const owner = document.getElementById('modal-owner').value;

    try {
        await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plate, model, location, owner, status: 'Sospechoso'
            })
        });
        
        // Check if more plates in queue
        currentPlateIndex++;
        if (currentPlateIndex < plateQueue.length) {
            openDetailsModal(plateQueue[currentPlateIndex]);
        } else {
            closeModal('modal-details');
            alert("Se envió para verificar los antecedentes");
            // Don't reset upload immediately, user might want to upload another
            switchTab('reports'); 
        }
        
    } catch (error) {
        console.error("Error saving report:", error);
    }
}

async function updateStatus(newStatus) {
    if (!currentReportId) return;
    
    try {
        await fetch(`${API_URL}/reports/${currentReportId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        closeModal('modal-status');
        fetchReports(); // Refresh table
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

// Expose functions to window
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.toggleAuthMode = toggleAuthMode;
window.logout = logout;
window.switchTab = switchTab;
window.resetUpload = resetUpload;
window.fetchReports = fetchReports;
window.fetchEvaluations = fetchEvaluations;
window.processEvaluation = processEvaluation;
window.openStatusModal = openStatusModal;
window.closeModal = closeModal;
window.submitDetails = submitDetails;
window.updateStatus = updateStatus;
window.confirmSelection = confirmSelection;