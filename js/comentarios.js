let currentManutencaoId = null;
let currentManutencaoType = null;
let commentImages = [];

async function abrirForumPredial(id) {
    currentManutencaoId = id;
    currentManutencaoType = 'predial';
    commentImages = [];
    
    try {
        const { data, error } = await db
            .from('manutencao_predial')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        renderDetalhesManutencao(data, 'predial');
        await loadComentarios(id, 'predial');
        openModal('modalForumPredial');
        
    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertPredial', 'Erro ao carregar dados.', 'error');
    }
}

async function abrirForumEquipamento(id) {
    currentManutencaoId = id;
    currentManutencaoType = 'equipamento';
    commentImages = [];
    
    try {
        const { data, error } = await db
            .from('manutencao_equipamentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        renderDetalhesManutencao(data, 'equipamento');
        await loadComentarios(id, 'equipamento');
        openModal('modalForumEquipamento');
        
    } catch (error) {
        console.error('Erro:', error);
        showAlert('alertEquipamentos', 'Erro ao carregar dados.', 'error');
    }
}

function renderDetalhesManutencao(data, tipo) {
    const contentId = tipo === 'predial' ? 'forumPredialContent' : 'forumEquipamentoContent';
    const content = document.getElementById(contentId);
    
    let html = `
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 10px 0;">${tipo === 'predial' ? '🏢' : '⚙️'} ${tipo === 'predial' ? data.local : data.equipamento}</h3>
                    <span class="codigo-badge">${data.codigo}</span>
                </div>
                <div style="text-align: right;">
                    <span class="badge badge-${data.status}" style="font-size: 14px; padding: 6px 14px;">${data.status.toUpperCase()}</span>
                </div>
            </div>
    `;
    
    if (tipo === 'predial') {
        html += `
            <div class="form-grid">
                <div><strong>Tipo:</strong> ${data.tipo}</div>
                <div><strong>Prioridade:</strong> <span class="badge badge-${data.prioridade}">${data.prioridade}</span></div>
                <div><strong>Data Prevista:</strong> ${new Date(data.data_prevista).toLocaleDateString('pt-BR')}</div>
                <div><strong>Criado por:</strong> ${data.criado_por || '-'}</div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Descrição:</strong>
                <p style="margin: 5px 0 0 0; color: #666;">${data.descricao}</p>
            </div>
        `;
    } else {
        html += `
            <div class="form-grid">
                <div><strong>Patrimônio:</strong> ${data.patrimonio || '-'}</div>
                <div><strong>Tipo:</strong> ${data.tipo}</div>
                <div><strong>Responsável:</strong> ${data.responsavel || '-'}</div>
                <div><strong>Criado por:</strong> ${data.criado_por || '-'}</div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Observações:</strong>
                <p style="margin: 5px 0 0 0; color: #666;">${data.observacoes}</p>
            </div>
        `;
    }
    
    if (data.imagens && data.imagens.length > 0) {
        html += `
            <div style="margin-top: 15px;">
                <strong>Imagens:</strong>
                <div class="image-preview" style="margin-top: 10px;">
        `;
        data.imagens.forEach(img => {
            html += `
                <div class="image-preview-item">
                    <img src="${img}" alt="Imagem" onclick="openImageModal('${img}')">
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    const isBloqueado = data.bloqueado || data.status === 'concluido';
    const isAdmin = currentUser && currentUser.perfil === 'admin';
    
    if (isBloqueado && !isAdmin) {
        html += `
            <div class="locked-message" style="margin-top: 20px;">
                🔒 <strong>Manutenção concluída e bloqueada para edição.</strong>
                Apenas comentários são permitidos.
            </div>
        `;
    } else if (isBloqueado && isAdmin) {
        html += `
            <div class="locked-message" style="margin-top: 20px;">
                🔒 <strong>Manutenção bloqueada.</strong>
                <button class="unlock-btn" onclick="desbloquearManutencao(${data.id}, '${tipo}')">
                    Desbloquear para Edição
                </button>
            </div>
        `;
    }
    
    html += `</div>`;
    
    content.innerHTML = html;
}

async function loadComentarios(manutencaoId, tipo) {
    try {
        const tabela = tipo === 'predial' ? 'comentarios_predial' : 'comentarios_equipamentos';
        
        const { data, error } = await db
            .from(tabela)
            .select('*')
            .eq('manutencao_id', manutencaoId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const listId = tipo === 'predial' ? 'comentariosPredialList' : 'comentariosEquipamentoList';
        const countId = tipo === 'predial' ? 'comentariosPredialCount' : 'comentariosEquipamentoCount';
        
        document.getElementById(countId).textContent = data.length;
        
        const lista = document.getElementById(listId);
        
        if (!data || data.length === 0) {
            lista.innerHTML = `
                <div class="no-comments">
                    💬 Seja o primeiro a comentar!
                </div>
            `;
            return;
        }
        
        let html = '';
        data.forEach(comment => {
            const date = formatarDataComentario(comment.created_at);
            const initials = comment.usuario_nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            html += `
                <div class="comment-item">
                    <div class="comment-header">
                        <div class="comment-author">
                            <div class="comment-avatar">${initials}</div>
                            <div class="comment-author-info">
                                <div class="comment-author-name">${comment.usuario_nome}</div>
                                <div class="comment-date">${date}</div>
                            </div>
                        </div>
                    </div>
                    <div class="comment-text">${comment.comentario}</div>
            `;
            
            if (comment.imagens && comment.imagens.length > 0) {
                html += `<div class="comment-images">`;
                comment.imagens.forEach(img => {
                    html += `
                        <div class="comment-image" onclick="openImageModal('${img}')">
                            <img src="${img}" alt="Imagem do comentário">
                        </div>
                    `;
                });
                html += `</div>`;
            }
            
            html += `</div>`;
        });
        
        lista.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    }
}

async function adicionarComentario(tipo) {
    const textareaId = tipo === 'predial' ? 'comentarioPredialText' : 'comentarioEquipamentoText';
    const texto = document.getElementById(textareaId).value.trim();
    
    if (!texto) {
        alert('Digite um comentário!');
        return;
    }
    
    try {
        const tabela = tipo === 'predial' ? 'comentarios_predial' : 'comentarios_equipamentos';
        
        const { error } = await db
            .from(tabela)
            .insert([{
                manutencao_id: currentManutencaoId,
                usuario_nome: currentUser.nome,
                usuario_id: currentUser.id,
                comentario: texto,
                imagens: commentImages
            }]);

        if (error) throw error;

        document.getElementById(textareaId).value = '';
        commentImages = [];
        updateCommentImagesPreview(tipo);
        await loadComentarios(currentManutencaoId, tipo);
        
        const listId = tipo === 'predial' ? 'comentariosPredialList' : 'comentariosEquipamentoList';
        const lista = document.getElementById(listId);
        lista.scrollTop = lista.scrollHeight;
        
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        alert('Erro ao adicionar comentário: ' + error.message);
    }
}

function handleCommentImageUpload(event, tipo) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                commentImages.push(e.target.result);
                updateCommentImagesPreview(tipo);
            };
            reader.readAsDataURL(file);
        }
    });
    
    event.target.value = '';
}

function updateCommentImagesPreview(tipo) {
    const previewId = tipo === 'predial' ? 'comentarioPredialImagesPreview' : 'comentarioEquipamentoImagesPreview';
    const preview = document.getElementById(previewId);
    
    if (!preview) return;
    
    if (commentImages.length === 0) {
        preview.innerHTML = '';
        return;
    }
    
    let html = '';
    commentImages.forEach((img, index) => {
        html += `
            <div class="comment-image-item">
                <img src="${img}" alt="Imagem ${index + 1}">
                <button type="button" class="comment-image-remove" onclick="removeCommentImage(${index}, '${tipo}')">×</button>
            </div>
        `;
    });
    
    preview.innerHTML = html;
}

function removeCommentImage(index, tipo) {
    commentImages.splice(index, 1);
    updateCommentImagesPreview(tipo);
}

async function desbloquearManutencao(id, tipo) {
    if (currentUser.perfil !== 'admin') {
        alert('Apenas administradores podem desbloquear manutenções!');
        return;
    }
    
    if (!confirm('Desbloquear esta manutenção para permitir edições?')) return;
    
    try {
        const tabela = tipo === 'predial' ? 'manutencao_predial' : 'manutencao_equipamentos';
        
        const { error } = await db
            .from(tabela)
            .update({ bloqueado: false, status: 'andamento' })
            .eq('id', id);

        if (error) throw error;

        alert('Manutenção desbloqueada com sucesso!');
        
        if (tipo === 'predial') {
            closeModal('modalForumPredial');
            loadManutencoesPrediais();
        } else {
            closeModal('modalForumEquipamento');
            loadManutencoesEquipamentos();
        }
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao desbloquear: ' + error.message);
    }
}

function formatarDataComentario(dataStr) {
    const data = new Date(dataStr);
    const agora = new Date();
    const diff = agora - data;
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (segundos < 60) return 'Agora mesmo';
    if (minutos < 60) return `${minutos} min atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;
    
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; max-height: 90vh; padding: 0; background: transparent; overflow: hidden;">
            <button class="modal-close" style="position: absolute; top: 10px; right: 10px; z-index: 1; background: white;" 
                    onclick="this.closest('.modal').remove()">×</button>
            <img src="${imageSrc}" style="width: 100%; height: auto; max-height: 90vh; object-fit: contain; border-radius: 12px;">
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}
