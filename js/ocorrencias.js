let allOcorrencias = [];
let filteredOcorrencias = [];

async function loadOcorrencias() {
    const canViewPredial = hasPermission('perm_predial_visualizar');
    const canViewEquipamentos = hasPermission('perm_equipamentos_visualizar');
    
    if (!canViewPredial && !canViewEquipamentos) {
        document.getElementById('listaOcorrencias').innerHTML = 
            '<p class="loading">Você não tem permissão para visualizar ocorrências.</p>';
        return;
    }

    try {
        let ocorrencias = [];

        if (canViewPredial) {
            const { data: prediais, error: errorPredial } = await db
                .from('manutencao_predial')
                .select('*')
                .order('created_at', { ascending: false });

            if (errorPredial) throw errorPredial;

            if (prediais) {
                prediais.forEach(item => {
                    ocorrencias.push({
                        ...item,
                        tipo_manutencao: 'predial',
                        titulo: item.local,
                        subtitulo: item.tipo,
                        tipo_badge: item.tipo
                    });
                });
            }
        }

        if (canViewEquipamentos) {
            const { data: equipamentos, error: errorEquip } = await db
                .from('manutencao_equipamentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (errorEquip) throw errorEquip;

            if (equipamentos) {
                equipamentos.forEach(item => {
                    ocorrencias.push({
                        ...item,
                        tipo_manutencao: 'equipamento',
                        titulo: item.equipamento,
                        subtitulo: item.tipo,
                        tipo_badge: item.tipo
                    });
                });
            }
        }

        ocorrencias.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        allOcorrencias = ocorrencias;
        filteredOcorrencias = [...ocorrencias];
        
        renderOcorrencias(filteredOcorrencias);

    } catch (error) {
        console.error('Erro ao carregar ocorrências:', error);
        document.getElementById('listaOcorrencias').innerHTML = 
            '<p class="loading">Erro ao carregar ocorrências.</p>';
    }
}

function renderOcorrencias(ocorrencias) {
    const lista = document.getElementById('listaOcorrencias');
    
    if (!ocorrencias || ocorrencias.length === 0) {
        lista.innerHTML = '<p class="loading">Nenhuma ocorrência encontrada com os filtros aplicados.</p>';
        return;
    }

    let html = `
        <div style="margin-bottom: 16px; padding: 12px 16px; background: linear-gradient(135deg, #e8ecff 0%, #f4f6ff 100%); border-radius: 10px; display: flex; align-items: center; gap: 10px; font-weight: 600; color: #667eea;">
            📊 Total de Ocorrências: ${ocorrencias.length}
        </div>
        <div class="table-container">
        <table id="tabelaOcorrencias">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Criado Por</th>
                    <th>Data Abertura</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    ocorrencias.forEach(item => {
        const dataAbertura = new Date(item.created_at).toLocaleDateString('pt-BR');
        const tipoIcon = item.tipo_manutencao === 'predial' ? '🏢' : '⚙️';
        const tipoLabel = item.tipo_manutencao === 'predial' ? 'Predial' : 'Equipamento';
        
        const prioridadeBadge = item.prioridade ? 
            `<span class="badge badge-${item.prioridade}">${item.prioridade}</span>` : 
            '<span class="badge badge-media">média</span>';
        
        let actions = `<button class="btn btn-small btn-secondary" onclick="abrirDetalhesOcorrencia(${item.id}, '${item.tipo_manutencao}')">👁️ Ver</button>`;
        
        if (item.tipo_manutencao === 'predial' && hasPermission('perm_predial_editar')) {
            if (!item.bloqueado || currentUser.perfil === 'admin') {
                actions += `<button class="btn btn-small btn-warning" onclick="editarManutencaoPredial(${item.id})">✏️ Editar</button>`;
            }
        } else if (item.tipo_manutencao === 'equipamento' && hasPermission('perm_equipamentos_editar')) {
            if (!item.bloqueado || currentUser.perfil === 'admin') {
                actions += `<button class="btn btn-small btn-warning" onclick="editarManutencaoEquip(${item.id})">✏️ Editar</button>`;
            }
        }

        html += `
            <tr>
                <td>
                    <span style="font-size: 20px;">${tipoIcon}</span>
                    <span style="font-size: 12px; color: #666; display: block; margin-top: 2px;">${tipoLabel}</span>
                </td>
                <td><span class="codigo-badge">${item.codigo}</span></td>
                <td><strong>${item.titulo}</strong></td>
                <td>${item.tipo_badge}</td>
                <td>${prioridadeBadge}</td>
                <td><span class="badge badge-${item.status}">${item.status}</span></td>
                <td>${item.criado_por || '-'}</td>
                <td>${dataAbertura}</td>
                <td><div class="action-buttons">${actions}</div></td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    lista.innerHTML = html;

    document.getElementById('searchOcorrencias').addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        const table = document.getElementById('tabelaOcorrencias');
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        let visibleCount = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const text = row.textContent.toLowerCase();
            
            if (text.includes(term)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        }
        
        const container = table.closest('.table-container') || table.parentElement;
        let noResults = container.querySelector('.no-results-message');
        
        if (visibleCount === 0 && term !== '') {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.className = 'no-results-message loading';
                noResults.textContent = '🔍 Nenhum resultado encontrado para "' + e.target.value + '"';
                container.appendChild(noResults);
            }
            table.style.display = 'none';
        } else {
            if (noResults) {
                noResults.remove();
            }
            table.style.display = '';
        }
    });
}

async function populateFiltroUsuarios() {
    try {
        const usuarios = new Set();
        
        allOcorrencias.forEach(item => {
            if (item.criado_por) {
                usuarios.add(item.criado_por);
            }
        });
        
        const select = document.getElementById('filtroCriadoPor');
        select.innerHTML = '<option value="">Todos</option>';
        
        Array.from(usuarios).sort().forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario;
            option.textContent = usuario;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular filtro de usuários:', error);
    }
}

function aplicarFiltros() {
    const tipoManutencao = document.getElementById('filtroTipoManutencao').value;
    const status = document.getElementById('filtroStatus').value;
    const prioridade = document.getElementById('filtroPrioridade').value;
    const criadoPor = document.getElementById('filtroCriadoPor').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;

    filteredOcorrencias = allOcorrencias.filter(item => {
        if (tipoManutencao && item.tipo_manutencao !== tipoManutencao) {
            return false;
        }
        
        if (status && item.status !== status) {
            return false;
        }
        
        if (prioridade && item.prioridade !== prioridade) {
            return false;
        }
        
        if (criadoPor && item.criado_por !== criadoPor) {
            return false;
        }
        
        if (dataInicio) {
            const itemDate = new Date(item.created_at);
            const filterDate = new Date(dataInicio);
            if (itemDate < filterDate) {
                return false;
            }
        }
        
        if (dataFim) {
            const itemDate = new Date(item.created_at);
            const filterDate = new Date(dataFim);
            filterDate.setHours(23, 59, 59, 999);
            if (itemDate > filterDate) {
                return false;
            }
        }
        
        return true;
    });

    renderOcorrencias(filteredOcorrencias);
}

function limparFiltros() {
    document.getElementById('filtroTipoManutencao').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroPrioridade').value = '';
    document.getElementById('filtroCriadoPor').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    
    filteredOcorrencias = [...allOcorrencias];
    renderOcorrencias(filteredOcorrencias);
}

async function abrirDetalhesOcorrencia(id, tipo) {
    if (tipo === 'predial') {
        await abrirForumPredial(id);
    } else {
        await abrirForumEquipamento(id);
    }
}
