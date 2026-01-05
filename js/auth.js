// Configuração do Supabase
const SUPABASE_URL = 'https://wcfrwsgnxochxvwhxnvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZnJ3c2dueG9jaHh2d2h4bnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzExMDgsImV4cCI6MjA4MzIwNzEwOH0.Yb4cT5chXp3S8NZaWbLpv436HzxGCO7CZTruPpOPDdU';

// Inicializar cliente Supabase
let db;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase não carregado.');
        return null;
    }
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Verificar sessão
function checkSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        return JSON.parse(savedUser);
    }
    return null;
}

// Salvar sessão
function saveSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Limpar sessão
function clearSession() {
    localStorage.removeItem('currentUser');
}

// Fazer login
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

        // Salvar sessão e redirecionar
        saveSession(data);
        window.location.href = 'menu.html';

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertLogin', 'Erro ao fazer login. Tente novamente.', 'error');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

// Fazer logout
function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        clearSession();
        window.location.href = 'login.html';
    }
}

// Proteger página (usar em menu.html)
function protectPage() {
    const user = checkSession();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Mostrar alerta
function showAlert(elementId, message, type) {
    const alertBox = document.getElementById(elementId);
    if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => alertBox.innerHTML = '', 5000);
    }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    db = initSupabase();
});
