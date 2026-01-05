// ========================================
// CONFIGURAÇÃO DO SUPABASE
// ========================================
const SUPABASE_URL = 'https://wcfrwsgnxochxvwhxnvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZnJ3c2dueG9jaHh2d2h4bnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzExMDgsImV4cCI6MjA4MzIwNzEwOH0.Yb4cT5chXp3S8NZaWbLpv436HzxGCO7CZTruPpOPDdU';

let db;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase não carregado.');
        return null;
    }
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ========================================
// FUNÇÕES DE SESSÃO
// ========================================
function checkSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        return JSON.parse(savedUser);
    }
    return null;
}

function saveSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('currentUser');
}

function protectPage() {
    const user = checkSession();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// ========================================
// FUNÇÕES DE ALERTA
// ========================================
function showAlert(elementId, message, type) {
    const alertBox = document.getElementById(elementId);
    if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => alertBox.innerHTML = '', 5000);
    }
}

// ========================================
// AUTENTICAÇÃO
// ========================================
async function handleLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value;

    if (!usuario || !senha) {
        showAlert('alertLogin', 'Preencha todos os campos!', 'error');
        return;
    }

    const btnLogin = document.getElementById('btnLogin');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    try {
        const { data, error } = await db
            .from('usuarios')
            .select('*')
            .eq('usuario', usuario)
            .eq('senha', senha)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            showAlert('alertLogin', 'Usuário ou senha incorretos!', 'error');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar';
            return;
        }

        saveSession(data);
        window.location.href = 'menu.html';

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertLogin', 'Erro ao fazer login. Tente novamente.', 'error');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        clearSession();
        window.location.href = 'login.html';
    }
}

// ========================================
// GESTÃO DE USUÁRIOS
// ========================================
async function handleCadastroUsuario(event) {
    event.preventDefault();
    
    const nome = document.getElementById('usuarioNome').value.trim();
    const usuario = document.getElementById('usuarioLogin').value.trim();
    const senha = document.getElementById('usuarioSenha').value;
    const perfil = document.getElementById('usuarioPerfil').value;

    if (!nome || !usuario || !senha || !perfil) {
        showAlert('alertUsuarios', 'Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    if (senha.length < 6) {
        showAlert('alertUsuarios', 'A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }

    try {
        const { data: existing } = await db
            .from('usuarios')
            .select('usuario')
            .eq('usuario', usuario)
            .maybeSingle();

        if (existing) {
            showAlert('alertUsuarios', 'Este nome de usuário já está em uso!', 'error');
            return;
        }

        const { error } = await db
            .from('usuarios')
            .insert([{ nome, usuario, senha, perfil }]);

        if (error) throw error;

        showAlert('alertUsuarios', 'Usuário cadastrado com sucesso!', 'success');
        document.getElementById('formUsuario').reset();
        loadUsuarios();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertUsuarios', 'Erro ao cadastrar usuário: ' + error.message, 'error');
    }
}

async function loadUsuarios() {
    try {
        const { data, error } = await db
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const lista = document.getElementById('listaUsuarios');
        
        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="loading">Nenhum usuário cadastrado.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>Perfil</th>
                        <th>Cadastro</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(user => {
            const date = new Date(user.created_at).toLocaleDateString('pt-BR');
            html += `
                <tr>
                    <td>${user.nome}</td>
                    <td>@${user.usuario}</td>
                    <td><span class="badge badge-${user.perfil}">${user.perfil}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        lista.innerHTML = html;

    } catch (error) {
        console.error('Erro:', error);
        const lista = document.getElementById('listaUsuarios');
        if (lista) {
            lista.innerHTML = '<p class="loading">Erro ao carregar usuários.</p>';
        }
    }
}

// ========================================
// MANUTENÇÃO PREDIAL
// ========================================
async function handleManutencaoPredial(event) {
    event.preventDefault();
    
    const local = document.getElementById('predialLocal').value.trim();
    const tipo = document.getElementById('predialTipo').value;
    const prioridade = document.getElementById('predialPrioridade').value;
    const data_prevista = document.getElementById('predialData').value;
    const descricao = document.getElementById('predialDescricao').value.trim();

    if (!local || !tipo || !prioridade || !data_prevista || !descricao) {
        showAlert('alertPredial', 'Preencha todos os campos!', 'error');
        return;
    }

    try {
        const { error } = await db
            .from('manutencao_predial')
            .insert([{ 
                local, 
                tipo, 
                prioridade, 
                data_prevista, 
                descricao,
                status: 'pendente'
            }]);

        if (error) throw error;

        showAlert('alertPredial', 'Manutenção registrada com sucesso!', 'success');
        document.getElementById('formPredial').reset();
        loadManutencoesPrediais();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertPredial', 'Erro ao registrar: ' + error.message, 'error');
    }
}

async function loadManutencoesPrediais() {
    try {
        const { data, error } = await db
            .from('manutencao_predial')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const lista = document.getElementById('listaPredial');
        
        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="loading">Nenhuma manutenção registrada.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Local</th>
                        <th>Tipo</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Data Prevista</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(item => {
            const date = new Date(item.data_prevista).toLocaleDateString('pt-BR');
            html += `
                <tr>
                    <td>${item.local}</td>
                    <td>${item.tipo}</td>
                    <td><span class="badge badge-${item.prioridade}">${item.prioridade}</span></td>
                    <td><span class="badge badge-${item.status}">${item.status}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        lista.innerHTML = html;

    } catch (error) {
        console.error('Erro:', error);
        const lista = document.getElementById('listaPredial');
        if (lista) {
            lista.innerHTML = '<p class="loading">Erro ao carregar manutenções.</p>';
        }
    }
}

// ========================================
// MANUTENÇÃO DE EQUIPAMENTOS
// ========================================
async function handleManutencaoEquipamento(event) {
    event.preventDefault();
    
    const nome = document.getElementById('equipNome').value.trim();
    const patrimonio = document.getElementById('equipPatrimonio').value.trim();
    const tipo = document.getElementById('equipTipo').value;
    const status = document.getElementById('equipStatus').value;
    const data_manutencao = document.getElementById('equipData').value;
    const responsavel = document.getElementById('equipResponsavel').value.trim();
    const observacoes = document.getElementById('equipObservacoes').value.trim();

    if (!nome || !tipo || !status || !data_manutencao || !observacoes) {
        showAlert('alertEquipamentos', 'Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    try {
        const { error } = await db
            .from('manutencao_equipamentos')
            .insert([{ 
                equipamento: nome,
                patrimonio,
                tipo, 
                status, 
                data_manutencao, 
                responsavel,
                observacoes
            }]);

        if (error) throw error;

        showAlert('alertEquipamentos', 'Manutenção registrada com sucesso!', 'success');
        document.getElementById('formEquipamento').reset();
        loadManutencoesEquipamentos();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertEquipamentos', 'Erro ao registrar: ' + error.message, 'error');
    }
}

async function loadManutencoesEquipamentos() {
    try {
        const { data, error } = await db
            .from('manutencao_equipamentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const lista = document.getElementById('listaEquipamentos');
        
        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="loading">Nenhuma manutenção registrada.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Equipamento</th>
                        <th>Patrimônio</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Responsável</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(item => {
            const date = new Date(item.data_manutencao).toLocaleDateString('pt-BR');
            html += `
                <tr>
                    <td>${item.equipamento}</td>
                    <td>${item.patrimonio || '-'}</td>
                    <td>${item.tipo}</td>
                    <td><span class="badge badge-${item.status}">${item.status}</span></td>
                    <td>${date}</td>
                    <td>${item.responsavel || '-'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        lista.innerHTML = html;

    } catch (error) {
        console.error('Erro:', error);
        const lista = document.getElementById('listaEquipamentos');
        if (lista) {
            lista.innerHTML = '<p class="loading">Erro ao carregar manutenções.</p>';
        }
    }
}

// ========================================
// NAVEGAÇÃO
// ========================================
function showSection(section) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    document.getElementById(section).classList.add('active');
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    db = initSupabase();
    
    if (!db) {
        alert('Erro ao conectar com o banco de dados. Verifique as credenciais.');
        return;
    }
});
