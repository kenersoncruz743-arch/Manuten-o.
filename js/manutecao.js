// Registrar manutenção predial
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
        showAlert('alertPredial', 'Erro ao registrar manutenção: ' + error.message, 'error');
    }
}

// Carregar manutenções prediais
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
        document.getElementById('listaPredial').innerHTML = 
            '<p class="loading">Erro ao carregar manutenções.</p>';
    }
}

// Registrar manutenção de equipamento
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
        showAlert('alertEquipamentos', 'Erro ao registrar manutenção: ' + error.message, 'error');
    }
}

// Carregar manutenções de equipamentos
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
        document.getElementById('listaEquipamentos').innerHTML = 
            '<p class="loading">Erro ao carregar manutenções.</p>';
    }
}
