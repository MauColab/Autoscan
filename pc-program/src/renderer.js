const { ipcRenderer } = require('electron');

// --- CONFIGURATION ---
const API_URL = 'http://127.0.0.1:5000'; // Local Python API

// --- STATE ---
let currentStation = null;
let currentView = 'reports'; // reports, evaluations, cameras, upload
let activeEvaluationId = null; // For status updates
let activeReportId = null; // For status updates

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
    checkAuth();
});

function checkAuth() {
    const storedUser = localStorage.getItem('station_user');
    if (storedUser) {
        try {
            currentStation = JSON.parse(storedUser);
            updateUserDisplay(currentStation);
            toggleAuthView(false);
            fetchReports();
        } catch (e) {
            console.error("Error parsing stored user", e);
            logout();
        }
    } else {
        toggleAuthView(true);
    }
}

// --- AUTHENTICATION ---
function toggleAuthView(show) {
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    
    if (show) {
        authView.classList.remove('hidden-section');
        appView.classList.add('hidden-section');
    } else {
        authView.classList.add('hidden-section');
        appView.classList.remove('hidden-section');
    }
}

function toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchText = document.getElementById('auth-switch-text');
    
    if (loginForm.classList.contains('hidden-section')) {
        loginForm.classList.remove('hidden-section');
        registerForm.classList.add('hidden-section');
        switchText.innerHTML = '¿No está registrado? <a href="#" onclick="toggleAuthMode()" class="text-primary hover:underline">Registrar Comisaría</a>';
    } else {
        loginForm.classList.add('hidden-section');
        registerForm.classList.remove('hidden-section');
        switchText.innerHTML = '¿Ya tiene cuenta? <a href="#" onclick="toggleAuthMode()" class="text-primary hover:underline">Iniciar Sesión</a>';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const stationId = document.getElementById('station-id').value;
    const password = document.getElementById('password').value;

    if (stationId && password) {
        try {
            const response = await fetch(`${API_URL}/station/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station_id: stationId, password: password })
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Use data from API
                const user = { 
                    id: data.station.station_id, 
                    name: data.station.name 
                };
                localStorage.setItem('station_user', JSON.stringify(user));
                currentStation = user;
                updateUserDisplay(user);
                toggleAuthView(false);
                fetchReports(); 
            } else {
                alert(data.error || "Credenciales incorrectas");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión con el servidor API");
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-station-name').value;
    const id = document.getElementById('reg-station-id').value;
    const password = document.getElementById('reg-password').value;

    if (name && id && password) {
        try {
            const response = await fetch(`${API_URL}/station/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station_id: id, name: name, password: password })
            });
            const data = await response.json();

            if (data.status === 'success') {
                const user = { 
                    id: data.station.station_id, 
                    name: data.station.name 
                };
                localStorage.setItem('station_user', JSON.stringify(user));
                currentStation = user;
                updateUserDisplay(user);
                toggleAuthView(false);
                fetchReports();
            } else {
                alert(data.error || "Error al registrar");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión con el servidor API");
        }
    } else {
        alert("Por favor complete todos los campos");
    }
}

function logout() {
    localStorage.removeItem('station_user');
    currentStation = null;
    toggleAuthView(true);
}

function updateUserDisplay(user) {
    if (!user) return;

    // 1. Update Header Name (e.g. "Comisaría Norte")
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = user.name;

    // 2. Update Header ID (e.g. "ID: CMS-123")
    const headerIdEl = document.getElementById('header-station-id');
    if (headerIdEl) headerIdEl.textContent = `ID: ${user.id}`;

    // 3. Update Sidebar Station Name (e.g. "Comisaría Norte")
    const stationDisplayEl = document.getElementById('station-display');
    if (stationDisplayEl) stationDisplayEl.textContent = user.name;

    // 4. Update Avatar Initials
    const avatarEl = document.querySelector('header .w-9');
    if (avatarEl && user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
}

// --- NAVIGATION ---
function switchTab(tab) {
    currentView = tab;
    
    // Update Sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-surfaceHighlight', 'text-text');
        btn.classList.add('text-textDim');
    });
    const activeBtn = document.getElementById(`btn-${tab}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-surfaceHighlight', 'text-text');
        activeBtn.classList.remove('text-textDim');
    }

    // Hide all views
    document.getElementById('view-reports').classList.add('hidden-section');
    document.getElementById('view-evaluations').classList.add('hidden-section');
    document.getElementById('view-cameras').classList.add('hidden-section');
    document.getElementById('view-upload').classList.add('hidden-section');

    // Show active view
    const viewEl = document.getElementById(`view-${tab}`);
    if (viewEl) viewEl.classList.remove('hidden-section');

    // Update Title
    const titles = {
        'reports': 'Reporte de Placas',
        'evaluations': 'Evaluaciones App Móvil',
        'cameras': 'Cámaras de Vigilancia',
        'upload': 'Subir Evidencia'
    };
    document.getElementById('page-title').innerText = titles[tab];

    // Fetch data if needed
    if (tab === 'reports') fetchReports();
    if (tab === 'evaluations') fetchEvaluations();
}

// --- DATA FETCHING ---
async function fetchReports() {
    try {
        const res = await fetch(`${API_URL}/reports`);
        const reports = await res.json();
        
        const tbody = document.getElementById('reports-table-body');
        tbody.innerHTML = '';

        if (reports.length === 0) {
             tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-textDim">No hay reportes registrados.</td></tr>`;
             return;
        }

        reports.forEach(report => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surfaceHighlight/30 transition-colors group';
            
            let statusClass = '';
            if (report.status === 'Limpio') statusClass = 'bg-success/10 text-success border-success/20';
            if (report.status === 'Sospechoso') statusClass = 'bg-secondary/10 text-secondary border-secondary/20';
            if (report.status === 'Robado') statusClass = 'bg-error/10 text-error border-error/20';

            tr.innerHTML = `
                <td class="px-6 py-4 font-mono font-bold text-text">${report.plate}</td>
                <td class="px-6 py-4 text-textDim">${report.model || '-'}</td>
                <td class="px-6 py-4 text-textDim">${report.location || '-'}</td>
                <td class="px-6 py-4 text-textDim">${report.owner || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs font-bold border ${statusClass}">${report.status}</span>
                </td>
                <td class="px-6 py-4 text-textDim text-xs">${report.time || ''}</td>
                <td class="px-6 py-4">
                    <button onclick="openStatusModal('${report.id}', '${report.plate}', 'report')" class="text-textDim hover:text-primary transition-colors">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}

async function fetchEvaluations() {
    try {
        const res = await fetch(`${API_URL}/evaluations`);
        const evaluations = await res.json();
        
        const grid = document.getElementById('evaluations-grid');
        grid.innerHTML = '';

        // Update badge
        const pendingCount = evaluations.filter(e => e.status === 'pending').length;
        const badge = document.getElementById('eval-badge');
        if (pendingCount > 0) {
            badge.innerText = pendingCount;
            badge.classList.remove('hidden-section');
        } else {
            badge.classList.add('hidden-section');
        }

        if (evaluations.length === 0) {
            grid.innerHTML = `<div class="col-span-3 text-center text-textDim py-10">No hay evaluaciones pendientes.</div>`;
            return;
        }

        evaluations.forEach(eval => {
            const card = document.createElement('div');
            card.className = 'bg-surface border border-surfaceHighlight rounded-xl overflow-hidden hover:border-primary/50 transition-all';
            
            let statusBadge = '';
            if (eval.status === 'pending') statusBadge = '<span class="px-2 py-0.5 bg-secondary/20 text-secondary text-[10px] font-bold rounded border border-secondary/30">PENDIENTE</span>';
            if (eval.status === 'processed') statusBadge = '<span class="px-2 py-0.5 bg-success/20 text-success text-[10px] font-bold rounded border border-success/30">PROCESADO</span>';
            if (eval.status === 'discarded') statusBadge = '<span class="px-2 py-0.5 bg-surfaceHighlight text-textDim text-[10px] font-bold rounded border border-surfaceHighlight">DESCARTADO</span>';

            card.innerHTML = `
                <div class="h-40 bg-black relative">
                    <img src="${eval.img_url}" class="w-full h-full object-cover opacity-80">
                    <div class="absolute top-2 right-2">${statusBadge}</div>
                </div>
                <div class="p-4 space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-lg font-mono">${eval.plate}</h4>
                            <p class="text-xs text-textDim">Enviado por: ${eval.sender}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-textDim">${eval.created_at ? new Date(eval.created_at).toLocaleTimeString() : ''}</p>
                        </div>
                    </div>
                    
                    <div class="bg-surfaceHighlight/30 p-2 rounded text-xs text-textDim space-y-1">
                        <p><span class="font-bold text-textDim">Ubicación:</span> ${eval.location || 'No especificada'}</p>
                        <p><span class="font-bold text-textDim">Nota:</span> ${eval.summary || '-'}</p>
                    </div>

                    ${eval.status === 'pending' ? `
                    <div class="flex gap-2 pt-2">
                        <button onclick="processEvaluation('${eval.id}', 'discarded')" class="flex-1 py-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded text-xs font-bold text-textDim transition-colors">DESCARTAR</button>
                        <button onclick="openStatusModal('${eval.id}', '${eval.plate}', 'evaluation')" class="flex-1 py-2 bg-primary hover:bg-primary/90 rounded text-xs font-bold text-background transition-colors">PROCESAR</button>
                    </div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching evaluations:", error);
    }
}

// --- FILE UPLOAD ---
const fileInput = document.getElementById('file-input');
if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
}

// Multiple plate handling
let plateQueue = [];
let currentPlateIndex = 0;
let detectedPlates = [];

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state (simplified)
    document.getElementById('drop-zone').innerHTML = '<p class="animate-pulse text-primary font-bold">Procesando con IA...</p>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'success') {
            detectedPlates = data.plates_found;
            if (detectedPlates.length > 0) {
                // Show success
                document.getElementById('drop-zone').classList.add('hidden-section');
                document.getElementById('result-container').classList.remove('hidden-section');
                document.getElementById('filename-display').innerText = file.name;
                
                // Start processing first plate
                plateQueue = detectedPlates;
                currentPlateIndex = 0;
                openStatusModal('new-upload', plateQueue[0], 'upload');
            } else {
                alert("No se detectaron placas en la imagen.");
                resetUpload();
            }
        } else {
            alert("Error al procesar imagen: " + data.error);
            resetUpload();
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión al procesar imagen");
        resetUpload();
    }
}

function resetUpload() {
    document.getElementById('drop-zone').innerHTML = `
        <div class="w-16 h-16 rounded-full bg-surfaceHighlight flex items-center justify-center">
            <i data-lucide="folder-up" class="w-8 h-8 text-textDim"></i>
        </div>
        <div class="text-center">
            <h3 class="text-lg font-bold">Cargar Evidencia</h3>
            <p class="text-textDim text-sm">Soporta Imágenes (JPG, PNG) y Archivos Comprimidos (ZIP)</p>
        </div>
        <button onclick="document.getElementById('file-input').click()"
            class="px-6 py-2 bg-surfaceHighlight border border-surfaceHighlight hover:border-primary text-text rounded-lg transition-all text-sm font-medium">
            Seleccionar Archivos
        </button>
        <input type="file" id="file-input" class="hidden" accept="image/*,.zip">
    `;
    // Re-attach listener
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    
    document.getElementById('drop-zone').classList.remove('hidden-section');
    document.getElementById('result-container').classList.add('hidden-section');
    if (window.lucide) lucide.createIcons();
}

// --- MODALS ---
function openStatusModal(id, plate, type) {
    if (type === 'upload') {
        // Show details modal for new upload
        document.getElementById('modal-details').classList.remove('hidden-section');
        document.getElementById('modal-plate').value = plate;
        // Reset fields
        document.getElementById('modal-model').value = '';
        document.getElementById('modal-location').value = '';
        document.getElementById('modal-owner').value = '';
    } else {
        // Show status update modal
        if (type === 'evaluation') activeEvaluationId = id;
        if (type === 'report') activeReportId = id;
        
        document.getElementById('modal-status').classList.remove('hidden-section');
        document.getElementById('status-plate').innerText = plate;
    }
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

    // Save as report
    try {
        await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                plate, model, location, owner, status: 'Sospechoso'
            })
        });
        
        closeModal('modal-details');
        
        // Check if more plates
        currentPlateIndex++;
        if (currentPlateIndex < plateQueue.length) {
            openStatusModal('new-upload', plateQueue[currentPlateIndex], 'upload');
        } else {
            alert("Todas las placas han sido procesadas.");
            resetUpload();
            switchTab('reports');
        }
    } catch (err) {
        console.error(err);
        alert("Error al guardar reporte");
    }
}

async function updateStatus(status) {
    try {
        if (activeEvaluationId) {
            // Update evaluation status and create report if needed
            await fetch(`${API_URL}/evaluations/${activeEvaluationId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: 'processed' })
            });
            
            // If status is not discarded, create a report entry too? 
            // For now just update status logic
            // Actually, let's create a report based on the evaluation data
            // Fetch eval data first? Or just assume we want to create a report now.
            // Simplified: Just update the evaluation status for now.
            
            activeEvaluationId = null;
            closeModal('modal-status');
            fetchEvaluations();
        } else if (activeReportId) {
            // Update report status
             await fetch(`${API_URL}/reports/${activeReportId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: status })
            });
            activeReportId = null;
            closeModal('modal-status');
            fetchReports();
        }
    } catch (err) {
        console.error(err);
        alert("Error al actualizar estado");
    }
}

async function processEvaluation(id, status) {
    try {
        await fetch(`${API_URL}/evaluations/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: status })
        });
        fetchEvaluations();
    } catch (err) {
        console.error(err);
    }
}