import { createClient } from '@supabase/supabase-js';

console.log('Vite + Supabase OK');

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const loginView = document.getElementById('loginView');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

const mainContent = document.getElementById('mainContent');
const dashboardContent = document.getElementById('dashboardContent');
const userInfo = document.getElementById('userInfo');
const notification = document.getElementById('notification');

const regularForm = document.getElementById('regularForm');
const addRegularBtn = document.getElementById('addRegularBtn');
const cancelRegularBtn = document.getElementById('cancelRegularBtn');
const regularTableBody = document.getElementById('regularTableBody');
const regularIdInput = document.getElementById('regularId');
const regularSubmitBtn = document.getElementById('regularSubmitBtn');

const specialForm = document.getElementById('specialForm');
const addSpecialBtn = document.getElementById('addSpecialBtn');
const cancelSpecialBtn = document.getElementById('cancelSpecialBtn');
const specialTableBody = document.getElementById('specialTableBody');
const specialIdInput = document.getElementById('specialId');
const specialSubmitBtn = document.getElementById('specialSubmitBtn');

let editingRegularId = null;
let editingSpecialId = null;



document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
        // Sesión activa
        showDashboard(data.session.user);
        loadData();
        setupEventListeners();
    } else {
        // Mostrar login
        loginView.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});


// Login

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showNotification('Completa ambos campos', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Login exitoso
        loginView.classList.add('hidden');
        mainContent.classList.remove('hidden');

        showDashboard(data.user);
        loadData();
        setupEventListeners();
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        showNotification('Error al iniciar sesión: ' + err.message, 'error');
    }
});


// Cerrar sesión automáticamente

supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
        mainContent.classList.add('hidden');
        loginView.classList.remove('hidden');
    }
});


// Configurar event listeners

function setupEventListeners() {
    // Horarios regulares
    addRegularBtn.addEventListener('click', () => showForm(regularForm, addRegularBtn, true));
    cancelRegularBtn.addEventListener('click', () => hideForm(regularForm, addRegularBtn));
    regularForm.addEventListener('submit', handleRegularSubmit);

    // Horarios especiales
    addSpecialBtn.addEventListener('click', () => showForm(specialForm, addSpecialBtn, true));
    cancelSpecialBtn.addEventListener('click', () => hideForm(specialForm, addSpecialBtn));
    specialForm.addEventListener('submit', handleSpecialSubmit);
}


// Dashboard

function showDashboard(user) {
    if (!user) return;

    loginView.classList.add('hidden');
    mainContent.classList.remove('hidden');

    dashboardContent.classList.remove('hidden');

    userInfo.innerHTML = `
        <div class="user-avatar">
            ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
        <span>${user.email || 'Usuario'}</span>
    `;
}


// Formularios

function showForm(form, addButton, isNew = false) {
    if (!form || !addButton) return;

    form.classList.remove('hidden');
    addButton.classList.add('hidden');

    if (isNew) resetForms();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Guardar';
}

function hideForm(form, addButton) {
    if (!form || !addButton) return;

    form.classList.add('hidden');
    addButton.classList.remove('hidden');
    resetForms();
}

function resetForms() {
    regularForm?.reset();
    specialForm?.reset();
    if (regularIdInput) regularIdInput.value = '';
    if (specialIdInput) specialIdInput.value = '';
    if (regularSubmitBtn) regularSubmitBtn.textContent = 'Guardar';
    if (specialSubmitBtn) specialSubmitBtn.textContent = 'Guardar';
}


// Manejar submit de formularios

async function handleRegularSubmit(e) {
    e.preventDefault();

    const id = regularIdInput?.value || null;
    const diaSemana = document.getElementById('diaSemana').value;
    const horarios = document.getElementById('horarios').value;
    const activo = document.getElementById('activoRegular').checked;

    if (!diaSemana || !horarios) {
        showNotification('Completa todos los campos', 'error');
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay usuario activo');

        if (id) {
            const { error } = await supabase
                .from('horarios_regulares')
                .update({ dia_semana: diaSemana, horarios, activo })
                .eq('id', id);
            if (error) throw error;
            showNotification('Horario regular actualizado', 'success');
        } else {
            const { error } = await supabase
                .from('horarios_regulares')
                .insert([{ user_id: user.id, dia_semana: diaSemana, horarios, activo }]);
            if (error) throw error;
            showNotification('Horario regular creado', 'success');
        }

        hideForm(regularForm, addRegularBtn);
        loadRegularData();
    } catch (err) {
        console.error(err);
        showNotification('Error al guardar horario: ' + err.message, 'error');
    }
}

async function handleSpecialSubmit(e) {
    e.preventDefault();

    const id = specialIdInput?.value || null;
    const fecha = document.getElementById('fecha').value;
    const descripcion = document.getElementById('descripcion').value;
    const horarios = document.getElementById('horariosEspecial').value;
    const activo = document.getElementById('activoEspecial').checked;

    if (!fecha) {
        showNotification('Completa todos los campos', 'error');
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay usuario activo');

        if (id) {
            const { error } = await supabase
                .from('horarios_especiales')
                .update({ fecha, descripcion, horarios, activo })
                .eq('id', id);
            if (error) throw error;
            showNotification('Horario especial actualizado', 'success');
        } else {
            const { error } = await supabase
                .from('horarios_especiales')
                .insert([{ user_id: user.id, fecha, descripcion, horarios, activo }]);
            if (error) throw error;
            showNotification('Horario especial creado', 'success');
        }

        hideForm(specialForm, addSpecialBtn);
        loadSpecialData();
    } catch (err) {
        console.error(err);
        showNotification('Error al guardar horario: ' + err.message, 'error');
    }
}


// Cargar datos

async function loadData() {
    await Promise.all([loadRegularData(), loadSpecialData()]);
}

async function loadRegularData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('horarios_regulares')
            .select('*')
            .eq('user_id', user.id)
            .order('dia_semana', { ascending: true });
        if (error) throw error;

        renderRegularTable(data || []);
    } catch (err) {
        console.error(err);
        showNotification('Error al cargar horarios: ' + err.message, 'error');
    }
}

async function loadSpecialData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('horarios_especiales')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha', { ascending: true });
        if (error) throw error;

        renderSpecialTable(data || []);
    } catch (err) {
        console.error(err);
        showNotification('Error al cargar horarios: ' + err.message, 'error');
    }
}


// Renderizar tablas

function formatHorarios(horariosStr) {
    if (!horariosStr) return '-';
    const horarios = horariosStr.split(',').map(h => h.trim()).filter(h => h);
    if (!horarios.length) return '-';
    if (horarios.length > 8) {
        const primeros = horarios.slice(0, 5);
        const restantes = horarios.length - 5;
        return `<div class="horarios-container"><div class="horarios-list compact">${primeros.map(h => `<span class="horario-item">${h}</span>`).join('')}<span class="horario-item">+${restantes} más</span></div></div>`;
    }
    return `<div class="horarios-container"><div class="horarios-list">${horarios.map(h => `<span class="horario-item">${h}</span>`).join('')}</div></div>`;
}

function renderRegularTable(data) {
    if (!regularTableBody) return;

    regularTableBody.innerHTML = '';
    if (!data.length) {
        regularTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay horarios regulares</td></tr>`;
        return;
    }

    const diasSemana = {1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado',7:'Domingo'};

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Día">${diasSemana[item.dia_semana]}</td>
            <td data-label="Horarios">${formatHorarios(item.horarios)}</td>
            <td data-label="Estado"><span class="status-badge ${item.activo ? 'status-active':'status-inactive'}">${item.activo?'Activo':'Inactivo'}</span></td>
            <td data-label="Acciones" class="actions">
                <button class="action-btn edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        regularTableBody.appendChild(row);
    });

    // Event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editRegular(btn.dataset.id, data)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteRegular(btn.dataset.id)));
}

function renderSpecialTable(data) {
    if (!specialTableBody) return;

    specialTableBody.innerHTML = '';
    if (!data.length) {
        specialTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay horarios especiales</td></tr>`;
        return;
    }

    data.forEach(item => {
        const fecha = new Date(item.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'});

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Fecha">${fechaFormateada}</td>
            <td data-label="Descripción">${item.descripcion||'-'}</td>
            <td data-label="Horarios">${formatHorarios(item.horarios)}</td>
            <td data-label="Estado"><span class="status-badge ${item.activo?'status-active':'status-inactive'}">${item.activo?'Activo':'Inactivo'}</span></td>
            <td data-label="Acciones" class="actions">
                <button class="action-btn edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        specialTableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editSpecial(btn.dataset.id, data)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteSpecial(btn.dataset.id)));
}


// Editar / Eliminar

function editRegular(id, data) {
    const item = data.find(i => i.id == id);
    if (!item) return;

    document.getElementById('diaSemana').value = item.dia_semana;
    document.getElementById('horarios').value = item.horarios;
    document.getElementById('activoRegular').checked = item.activo;
    if (regularIdInput) regularIdInput.value = item.id;
    if (regularSubmitBtn) regularSubmitBtn.textContent = 'Actualizar';

    showForm(regularForm, addRegularBtn);
}

function editSpecial(id, data) {
    const item = data.find(i => i.id == id);
    if (!item) return;

    document.getElementById('fecha').value = item.fecha;
    document.getElementById('descripcion').value = item.descripcion||'';
    document.getElementById('horariosEspecial').value = item.horarios||'';
    document.getElementById('activoEspecial').checked = item.activo;
    if (specialIdInput) specialIdInput.value = item.id;
    if (specialSubmitBtn) specialSubmitBtn.textContent = 'Actualizar';

    showForm(specialForm, addSpecialBtn);
}

async function deleteRegular(id) {
    if (!confirm('¿Seguro que quieres eliminar este horario regular?')) return;

    try {
        const { error } = await supabase.from('horarios_regulares').delete().eq('id', id);
        if (error) throw error;
        showNotification('Horario regular eliminado', 'success');
        loadRegularData();
    } catch (err) {
        console.error(err);
        showNotification('Error al eliminar: ' + err.message, 'error');
    }
}

async function deleteSpecial(id) {
    if (!confirm('¿Seguro que quieres eliminar este horario especial?')) return;

    try {
        const { error } = await supabase.from('horarios_especiales').delete().eq('id', id);
        if (error) throw error;
        showNotification('Horario especial eliminado', 'success');
        loadSpecialData();
    } catch (err) {
        console.error(err);
        showNotification('Error al eliminar: ' + err.message, 'error');
    }
}

// Notificaciones
function showNotification(message, type) {
    if (!notification) return;

    notification.className = `notification ${type==='success'?'notification-success':type==='error'?'notification-error':'notification-info'}`;
    notification.querySelector('.notification-icon').className = `notification-icon fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle'}`;
    notification.querySelector('.notification-message').textContent = message;

    notification.classList.remove('hidden');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(()=>notification.classList.add('hidden'),300);
    }, 5000);
}
