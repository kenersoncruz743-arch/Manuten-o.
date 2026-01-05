// Cadastrar usuário
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
        // Verificar se usuário já existe
        const { data: existing } = await db
            .from('usuarios')
            .select('usuario')
            .eq('usuario', usuario)
            .maybeSingle();

        if (existing) {
            showAlert('alertUsuarios', 'Este nome de usuário já está em uso!', 'error');
            return;
        }

        // Inserir novo usuário
        const { data, error } = await db
            .from('usuarios')
            .insert([{ nome, usuario, senha, perfil }])
            .select();

        if (error) {
            console.error('Erro:', error);
            showAlert('alertUsuarios', 'Erro ao cadastrar: ' + error.message, 'error');
            return;
        }

        showAlert('alertUsuarios', 'Usuário cadastrado com sucesso!', 'success');
        event.target.reset();
        loadUsuarios();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertUsuarios', 'Erro ao cadastrar usuário: ' + error.message, 'error');
    }
}

// Carregar usuários
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
        console.error('Erro ao carregar usuários:', error);
        document.getElementById('listaUsuarios').innerHTML = 
            '<p class="loading">Erro ao carregar usuários.</p>';
    }
}
