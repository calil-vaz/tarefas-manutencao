const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxuMhqBvX4cbbf6Bjw_Hag-ATnL6IQ0FtlfN9wFbNt4ccZ3Uc8vaoGpNgyQUvcjuBfBog/exec';

const IMPORT_DATA = 'https://opensheet.elk.sh/1sg-lgB8ZXpNXd_koZsj5sioi4agF5mc1bAt7Rmrk018/TAREFAS'
const STORES = [11, 85, 115, 135, 165, 182, 183, 187, 190, 194, 195, 198, 213, 214, 223, 225, 250, 255, 270, 294, 295, 305, 309, 310, 325, 335, 375, 384, 385, 405, 420, 479, 480, 492, 561, 825, 897, 905];

// ========== ESTADO GLOBAL ==========
let currentUser = {
    store: null,
    role: null,
    name: null
};

let allTasks = [];
let filteredTasks = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showScreen(currentUser.role);
            loadTasks();
        } catch (error) {
            console.error('Erro ao recuperar usuário:', error);
            showScreen('login');
        }
    } else {
        showScreen('login');
    }

    // Event Listeners
    setupEventListeners();
}

function limitLength(input, maxLength) {
    if (input.value.length > maxLength) {
    input.value = input.value.slice(0, maxLength);
    }
    }

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Gerente
    const gerenteForm = document.getElementById('gerente-form');
    if (gerenteForm) {
        gerenteForm.addEventListener('submit', handleCreateTask);
    }

    const gerenteLogout = document.getElementById('gerente-logout');
    if (gerenteLogout) {
        gerenteLogout.addEventListener('click', handleLogout);
    }

    const gerenteRefresh = document.getElementById('gerente-refresh');
    if (gerenteRefresh) {
        gerenteRefresh.addEventListener('click', loadTasks);
    }

    // Técnico
    const tecnicoLogout = document.getElementById('tecnico-logout');
    if (tecnicoLogout) {
        tecnicoLogout.addEventListener('click', handleLogout);
    }

    const tecnicoRefresh = document.getElementById('tecnico-refresh');
    if (tecnicoRefresh) {
        tecnicoRefresh.addEventListener('click', loadTasks);
    }

    const tecnicoStatusFilter = document.getElementById('tecnico-status-filter');
    if (tecnicoStatusFilter) {
        tecnicoStatusFilter.addEventListener('change', filterTasks);
    }

    const tecnicoSearch = document.getElementById('tecnico-search');
    if (tecnicoSearch) {
        tecnicoSearch.addEventListener('input', filterTasks);
    }

    // Modal
    const updateOsModal = document.getElementById('update-os-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
    
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateOsModal.classList.remove('active');
        });
    });

    const updateOsForm = document.getElementById('update-os-form');
    if (updateOsForm) {
        updateOsForm.addEventListener('submit', handleUpdateOs);
    }

    // Fechar modal ao clicar fora
    updateOsModal.addEventListener('click', (e) => {
        if (e.target === updateOsModal) {
            updateOsModal.classList.remove('active');
        }
    });
}

// ========== AUTENTICAÇÃO ==========
function handleLogin(e) {
    e.preventDefault();

    const store = document.getElementById('login-store').value;
    const role = document.getElementById('login-role').value;
    const name = document.getElementById('login-name').value;

    if (!store || !role || !name) {
        showToast('Por favor, preencha todos os campos!', 'error');
        return;
    }

    if (!STORES.includes(parseInt(store))) {
        showToast('Código de loja inválido!', 'error');
        return;
    }

    currentUser = {
        store: store,
        role: role,
        name: name
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showScreen(role);
    loadTasks();
    showToast(`Bem-vindo, ${name}!`, 'success');
}

function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        currentUser = { store: null, role: null, name: null };
        showScreen('login');
        showToast('Você foi desconectado!', 'success');
    }
}

// ========== NAVEGAÇÃO DE TELAS ==========
function showScreen(screenName) {
    // Ocultar todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Mostrar tela selecionada
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
        screen.classList.add('active');
    }

    // Atualizar informações do usuário
    if (screenName === 'gerente') {
        const userInfo = document.getElementById('gerente-user-info');
        if (userInfo) {
            userInfo.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name} (Loja ${currentUser.store})`;
        }
    } else if (screenName === 'tecnico') {
        const userInfo = document.getElementById('tecnico-user-info');
        if (userInfo) {
            userInfo.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name} (Loja ${currentUser.store})`;
        }
    }
}

// ========== CRUD - CRIAR TAREFA ==========
function handleCreateTask(e) {
    e.preventDefault();

    const titulo = document.getElementById('gerente-titulo').value;
    const descricao = document.getElementById('gerente-descricao').value;

    if (!titulo || !descricao) {
        showToast('Por favor, preencha todos os campos!', 'error');
        return;
    }
    const payload = {
        action: 'createTask',
        loja: currentUser.store,
        solicitante: currentUser.name,
        titulo: titulo,
        descricao: descricao
    };

    // Mostrar loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload) 
    })
    // .then(response => response.json())
    // .then(data => {
        
    //     if (data.success) {
    //         showToast(`Tarefa criada com sucesso! ID: `, 'success');
    //         document.getElementById('gerente-form').reset();
    //         limparGerente()
    //         loadTasks();
    //     } else {
    //         showToast(`Erro: ${data.data}`, 'error');
    //     }
    //     console.log(data);
    // })
    // .catch(error => {
    //     console.error('Erro ao criar tarefa:', error);
    //     showToast('Erro ao conectar com o servidor!', 'error');
    // })
    .finally(() => {
        document.getElementById('gerente-form').reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
    console.log(payload);
    
}

// ========== CRUD - CARREGAR TAREFAS ==========
function loadTasks() {
    const url = `https://opensheet.elk.sh/1sg-lgB8ZXpNXd_koZsj5sioi4agF5mc1bAt7Rmrk018/TAREFAS`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                allTasks = data;
                console.log(allTasks);
                
                if (currentUser.role === 'gerente') {
                    // Gerente: vê apenas tarefas da própria loja
                    filteredTasks = allTasks.filter(task => task.LOJA == currentUser.store);
                    renderGerenteTasks();
                } else if (currentUser.role === 'tecnico') {
                    // Técnico: vê apenas a própria loja
                    filteredTasks = allTasks.filter(task => task.LOJA == currentUser.store);
                    renderTecnicoTasks();
                    // updateTecnicoDashboard();
                }
            } else {
                showToast('Erro: formato de dados inesperado!', 'error');
                console.error('Resposta inesperada:', data);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar tarefas:', error);
            showToast('Erro ao conectar com o servidor!', 'error');
        });
}


// ========== RENDERIZAR TAREFAS - GERENTE ==========
function renderGerenteTasks() {
    const tbody = document.getElementById('gerente-tasks-body');
    
    if (!tbody) return;

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-inbox"></i> Nenhuma solicitação ainda</td></tr>';
        return;
    }

    tbody.innerHTML = filteredTasks.map(task => {
        const date = formatDate(task.DATA_SOLICITACAO);
        const status = getStatusBadge(task.STATUS);
        const osSs = task['OS/SS'] || '-';
        const tecnico = task['TÉCNICO'] || '-';

        return `
            <tr>
                <td><strong>${task.ID}</strong></td>
                <td>${date}</td>
                <td>${task.TITULO}</td>
                <td>${status}</td>
                <td>${osSs}</td>
                <td>${tecnico}</td>
            </tr>
        `;
    }).join('');
}

// ========== RENDERIZAR TAREFAS - TÉCNICO ==========
function renderTecnicoTasks() {
    const tbody = document.getElementById('tecnico-tasks-body');
    if (!tbody) return;

    // Filtrar tarefas (todas da loja do técnico)
    const tasksToRender = filteredTasks.filter(task => {
        const lojaMatch = task['LOJA'] == currentUser.store;
        const taskStatus = task['STATUS'] === 'PENDENTE';
        // const searchMatch = task['Título'].toLowerCase().includes(searchFilter);
        return lojaMatch && taskStatus; // && statusMatch && searchMatch;
    });

    if (tasksToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    <i class="fas fa-inbox"></i> Nenhuma tarefa encontrada
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = tasksToRender.map(task => {
    const dataEnvio = task['DATA_SOLICITACAO'] || '-';
    const titulo = task['TITULO'] || '-';
    const status = task['status'] || 'PENDENTE';
    const loja = task['LOJA'] || '-';
    // const tecnico = task['TÉCNICO'] || '-';
    const osSs = task['OS/SS'] || '-';
    const idTarefa = task['ID'] || '-'; 

    const statusBadge = getStatusBadge(status);

    const isPending = status === 'PENDENTE';
    const actionButton = isPending 
        ? `<button class="btn btn-sm btn-primary" onclick="openUpdateOsModal('${idTarefa}', '${titulo.replace(/'/g, "\\'")}')"><i class="fas fa-wrench"></i> Atender</button>`
        : `<button class="btn btn-sm btn-secondary" disabled><i class="fas fa-check"></i> ${status}</button>`;

    return `
        <tr>
            <td><strong>${idTarefa}</strong></td>
            <td>${loja}</td>
            <td>${dataEnvio}</td>
            <td>${titulo}</td>
            <td>${statusBadge}</td>
            <td>${osSs}</td>
            <td>${actionButton}</td>
        </tr>
    `;
}).join('');

}


// ========== ABRIR MODAL DE ATUALIZAÇÃO ==========
let currentTaskIdToUpdate = null;

function openUpdateOsModal(taskId, titulo) {
    currentTaskIdToUpdate = taskId;

    document.getElementById('update-os-form').reset();
    document.getElementById('update-task-id').value = taskId;
    document.getElementById('update-titulo').value = titulo;

    document.getElementById('update-os-modal').classList.add('active');

    console.log("Tarefa selecionada:", taskId, titulo);
}



// ========== ENVIAR ATUALIZAÇÃO (TÉCNICO) ==========
function handleUpdateOs(e) {
    e.preventDefault();

    const osSs = document.getElementById('update-os-ss').value;

    if (!osSs) {
        showToast('Por favor, preencha o campo O.S./S.S.!', 'error');
        return;
    }

    const payload = {
        action: 'updateTask',
        taskId: currentTaskIdToUpdate,
        osSs: osSs,
        tecnico: currentUser.name
    };

    // Mostrar loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         showToast(`Tarefa ${currentTaskIdToUpdate} atualizada com sucesso!`, 'success');
    //         document.getElementById('update-os-modal').classList.remove('active');
    //         loadTasks(); // recarrega a planilha atualizada
    //     } else {
    //         showToast(`Erro: ${data.data}`, 'error');
    //     }
    // })
    // .catch(error => {
    //     console.error('Erro ao atualizar tarefa:', error);
    //     showToast('Erro ao conectar com o servidor!', 'error');
    // })
    .finally(() => {
        document.getElementById('update-os-modal').classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}


// ========== UTILITÁRIOS ==========
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString; 
    }
}

function getStatusBadge(status) {
    let className = '';
    let text = '';

    switch (status) {
        case 'PENDENTE':
            className = 'badge-danger';
            text = 'Pendente';
            break;
        case 'EM_ANDAMENTO':
            className = 'badge-warning';
            text = 'Em Andamento';
            break;
        case 'CONCLUIDA':
            className = 'badge-success';
            text = 'Concluída';
            break;
        default:
            className = 'badge-secondary';
            text = 'Desconhecido';
    }

    return `<span class="badge ${className}">${text}</span>`;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} active`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Função para filtrar tarefas (chamada pelo event listener)
// function filterTasks() {
//     renderTecnicoTasks();
// }