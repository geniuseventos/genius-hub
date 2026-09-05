// Inicialização do Supabase
const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';

// Mudamos de "supabase" para "supabaseClient" para não conflitar com a biblioteca
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminForm');
    const listaItens = document.getElementById('listaItens');
    const tipoSelect = document.getElementById('tipoItem');
    const categoriaGroup = document.getElementById('itemCategoria').parentElement;
    
    let editandoId = null;

    tipoSelect.addEventListener('change', (e) => {
        categoriaGroup.style.display = e.target.value === 'solucao' ? 'flex' : 'none';
    });

    async function carregarItens() {
        listaItens.innerHTML = '<li>Carregando itens do banco de dados...</li>';
        
        const { data, error } = await supabaseClient
            .from('portfolio')
            .select('id, titulo, tipo')
            .order('titulo', { ascending: true }); 
        
        if (error) {
            console.error(error);
            listaItens.innerHTML = '<li style="color: red;">Erro ao carregar itens.</li>';
            return;
        }

        listaItens.innerHTML = '';
        if (data.length === 0) {
            listaItens.innerHTML = '<li style="color: #888;">Nenhum item cadastrado.</li>';
            return;
        }

        data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${item.titulo}</strong> <span style="color: #888; font-size: 0.85rem;">(${item.tipo.toUpperCase()})</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-edit" data-id="${item.id}" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Editar</button>
                    <button class="btn-delete" data-id="${item.id}">Deletar</button>
                </div>
            `;
            listaItens.appendChild(li);
        });
    }

    listaItens.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');

        if (e.target.classList.contains('btn-delete')) {
            if (confirm(`Deletar definitivamente "${id}"?`)) {
                const { error } = await supabaseClient.from('portfolio').delete().eq('id', id);
                if (error) {
                    alert('Erro ao deletar o item.');
                    console.error(error);
                } else {
                    carregarItens();
                }
            }
        }

        if (e.target.classList.contains('btn-edit')) {
            const { data, error } = await supabaseClient
                .from('portfolio')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                alert('Erro ao carregar dados para edição.');
                return;
            }

            document.getElementById('tipoItem').value = data.tipo;
            categoriaGroup.style.display = data.tipo === 'solucao' ? 'flex' : 'none';

            const itemIdInput = document.getElementById('itemId');
            itemIdInput.value = data.id;
            itemIdInput.disabled = true;

            document.getElementById('itemTitulo').value = data.titulo;
            if (data.tipo === 'solucao' && data.categoria) {
                document.getElementById('itemCategoria').value = data.categoria;
            }

            document.getElementById('itemDescricao').value = data.descricao;
            document.getElementById('itemTags').value = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags;

            editandoId = data.id;
            form.dataset.imagemAtual = data.imagem;

            const btnSubmit = form.querySelector('button[type="submit"]');
            btnSubmit.innerText = "Salvar Alterações";
            btnSubmit.style.background = "#2563eb";

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;

        let idRaw = document.getElementById('itemId').value.trim().toLowerCase();
        idRaw = idRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-'); 

        const fileInput = document.getElementById('itemImagem');
        const file = fileInput.files[0];
        let imagemPublicUrl = form.dataset.imagemAtual || '';

        if (file) {
            btnSubmit.innerText = "Fazendo upload da imagem...";
            const fileExt = file.name.split('.').pop();
            const fileName = `${idRaw}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('imagens')
                .upload(fileName, file);

            if (uploadError) {
                alert('Erro ao enviar imagem. Verifique o Storage do Supabase.');
                console.error(uploadError);
                btnSubmit.innerText = editandoId ? "Salvar Alterações" : "Adicionar Item";
                btnSubmit.disabled = false;
                return;
            }

            const { data: publicUrlData } = supabaseClient.storage
                .from('imagens')
                .getPublicUrl(fileName);

            imagemPublicUrl = publicUrlData.publicUrl;
        }

        btnSubmit.innerText = "Salvando dados...";

        const dadosItem = {
            tipo: document.getElementById('tipoItem').value,
            titulo: document.getElementById('itemTitulo').value,
            imagem: imagemPublicUrl,
            descricao: document.getElementById('itemDescricao').value,
            tags: document.getElementById('itemTags').value.split(',').map(tag => tag.trim())
        };

        if (dadosItem.tipo === 'solucao') {
            dadosItem.categoria = document.getElementById('itemCategoria').value;
        } else {
            dadosItem.categoria = null;
        }

        let error;

        if (editandoId) {
            const res = await supabaseClient
                .from('portfolio')
                .update(dadosItem)
                .eq('id', editandoId);
            error = res.error;
        } else {
            dadosItem.id = idRaw;
            const res = await supabaseClient
                .from('portfolio')
                .insert([dadosItem]);
            error = res.error;
        }

        if (error) {
            alert('Erro ao salvar o item.');
            console.error(error);
        } else {
            form.reset();
            document.getElementById('itemId').disabled = false;
            editandoId = null;
            delete form.dataset.imagemAtual;
            carregarItens();
            alert('Operação realizada com sucesso!');
        }

        btnSubmit.innerText = "Adicionar Item";
        btnSubmit.style.background = "";
        btnSubmit.disabled = false;
    });

    carregarItens();
});