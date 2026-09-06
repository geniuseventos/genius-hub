const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminForm');
    const listaItens = document.getElementById('listaItens');
    const tipoSelect = document.getElementById('tipoItem');
    const groupCategoria = document.getElementById('groupCategoria');
    const selectUpsell = document.getElementById('itemUpsell');
    let editandoId = null;

    tipoSelect.addEventListener('change', (e) => {
        groupCategoria.style.display = e.target.value === 'solucao' ? 'flex' : 'none';
    });

    async function carregarSistemasParaUpsell() {
        const { data, error } = await supabaseClient.from('portfolio').select('id, titulo').eq('categoria', 'gestao');
        if (data && !error) {
            data.forEach(sistema => {
                const option = document.createElement('option');
                option.value = sistema.id;
                option.innerText = `Sistema: ${sistema.titulo}`;
                selectUpsell.appendChild(option);
            });
        }
    }

    async function carregarItens() {
        listaItens.innerHTML = '<li>Carregando itens...</li>';
        const { data, error } = await supabaseClient.from('portfolio').select('id, titulo, tipo').order('titulo', { ascending: true }); 
        
        if (error || !data) return listaItens.innerHTML = '<li style="color: red;">Erro ao carregar itens.</li>';
        if (data.length === 0) return listaItens.innerHTML = '<li style="color: #888;">Nenhum item cadastrado.</li>';

        listaItens.innerHTML = data.map(item => `
            <li>
                <div><strong>${item.titulo}</strong> <span style="color: #888; font-size: 0.85rem;">(${item.tipo.toUpperCase()})</span></div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-edit" data-id="${item.id}" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Editar</button>
                    <button class="btn-delete" data-id="${item.id}" style="background: #e63946; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Deletar</button>
                </div>
            </li>
        `).join('');
    }

    listaItens.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');

        if (e.target.classList.contains('btn-delete') && confirm(`Deletar definitivamente "${id}"?`)) {
            await supabaseClient.from('portfolio').delete().eq('id', id);
            carregarItens();
        }

        if (e.target.classList.contains('btn-edit')) {
            const { data } = await supabaseClient.from('portfolio').select('*').eq('id', id).single();
            if (!data) return alert('Erro ao carregar dados.');

            document.getElementById('tipoItem').value = data.tipo;
            groupCategoria.style.display = data.tipo === 'solucao' ? 'flex' : 'none';
            document.getElementById('itemId').value = data.id;
            document.getElementById('itemId').disabled = true;
            document.getElementById('itemTitulo').value = data.titulo;
            if (data.categoria) document.getElementById('itemCategoria').value = data.categoria;
            document.getElementById('itemDescricao').value = data.descricao || '';
            document.getElementById('itemTags').value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');

            document.getElementById('itemUpsell').value = data.upsell_ativo || 'nao';
            document.getElementById('itemBeneficios').value = data.beneficios || '';
            
            // Novos campos organizados
            document.getElementById('itemOqueGanha').value = data.oque_ganha || '';
            document.getElementById('itemComoFunciona').value = data.como_funciona || '';
            document.getElementById('itemPersonalizacao').value = data.personalizacao || '';
            document.getElementById('itemEntrega').value = data.entrega || '';

            editandoId = data.id;
            form.dataset.img1 = data.imagem || '';
            form.dataset.img2 = data.imagem2 || '';
            form.dataset.img3 = data.imagem3 || '';
            form.dataset.img4 = data.imagem4 || '';
            form.dataset.img5 = data.imagem5 || '';

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
        btnSubmit.innerText = "Salvando (aguarde o upload)...";

        let idRaw = document.getElementById('itemId').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-'); 

        try {
            const fileInput = document.getElementById('itemImagens');
            const files = fileInput.files;
            
            let imagens = [
                form.dataset.img1 || '', form.dataset.img2 || '', form.dataset.img3 || '', form.dataset.img4 || '', form.dataset.img5 || ''
            ];

            if (files.length > 0) {
                btnSubmit.innerText = `Fazendo upload de ${Math.min(files.length, 5)} imagem(ns)...`;
                imagens = ['', '', '', '', '']; 
                for (let i = 0; i < Math.min(files.length, 5); i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${idRaw}-img${i+1}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const { error } = await supabaseClient.storage.from('imagens').upload(fileName, file);
                    if (!error) {
                        const { data } = supabaseClient.storage.from('imagens').getPublicUrl(fileName);
                        imagens[i] = data.publicUrl;
                    }
                }
            }

            const dadosItem = {
                tipo: document.getElementById('tipoItem').value,
                categoria: document.getElementById('tipoItem').value === 'solucao' ? document.getElementById('itemCategoria').value : null,
                titulo: document.getElementById('itemTitulo').value,
                descricao: document.getElementById('itemDescricao').value,
                tags: document.getElementById('itemTags').value.split(',').map(t => t.trim()),
                upsell_ativo: document.getElementById('itemUpsell').value,
                beneficios: document.getElementById('itemBeneficios').value,
                oque_ganha: document.getElementById('itemOqueGanha').value,
                como_funciona: document.getElementById('itemComoFunciona').value,
                personalizacao: document.getElementById('itemPersonalizacao').value,
                entrega: document.getElementById('itemEntrega').value,
                imagem: imagens[0], imagem2: imagens[1], imagem3: imagens[2], imagem4: imagens[3], imagem5: imagens[4]
            };

            if (editandoId) {
                await supabaseClient.from('portfolio').update(dadosItem).eq('id', editandoId);
            } else {
                dadosItem.id = idRaw;
                await supabaseClient.from('portfolio').insert([dadosItem]);
            }

            form.reset();
            document.getElementById('itemId').disabled = false;
            editandoId = null;
            ['img1','img2','img3','img4','img5'].forEach(k => delete form.dataset[k]);
            carregarItens();
            alert('Operação realizada com sucesso!');
        } catch (error) {
            alert('Erro ao salvar. Verifique o console.');
            console.error(error);
        }

        btnSubmit.innerText = "Adicionar / Salvar Item";
        btnSubmit.style.background = "";
        btnSubmit.disabled = false;
    });

    carregarSistemasParaUpsell();
    carregarItens();
});