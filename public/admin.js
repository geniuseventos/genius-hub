// Inicialização do Supabase
const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminForm');
    const listaItens = document.getElementById('listaItens');
    const tipoSelect = document.getElementById('tipoItem');
    const categoriaGroup = document.getElementById('itemCategoria').parentElement;

    // Mostra/Esconde Categoria dependendo do tipo
    tipoSelect.addEventListener('change', (e) => {
        categoriaGroup.style.display = e.target.value === 'solucao' ? 'flex' : 'none';
    });

    async function carregarItens() {
        listaItens.innerHTML = '<li>Carregando itens do banco de dados...</li>';
        
        const { data, error } = await supabase
            .from('portfolio')
            .select('id, titulo, tipo')
            .order('titulo', { ascending: true }); 
        
        if (error) {
            console.error(error);
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
                <button class="btn-delete" data-id="${item.id}">Deletar</button>
            `;
            listaItens.appendChild(li);
        });
    }

    listaItens.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.getAttribute('data-id');
            if (confirm(`Deletar definitivamente "${id}"?`)) {
                await supabase.from('portfolio').delete().eq('id', id);
                carregarItens();
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.innerText = "Fazendo upload da imagem...";
        btnSubmit.disabled = true;

        let idRaw = document.getElementById('itemId').value.trim().toLowerCase();
        idRaw = idRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-'); 

        // 1. Upload de Imagem para o Storage
        const fileInput = document.getElementById('itemImagem');
        const file = fileInput.files[0];
        let imagemPublicUrl = '';

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${idRaw}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Envia o arquivo para o bucket "imagens"
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('imagens')
                .upload(fileName, file);

            if (uploadError) {
                alert('Erro ao enviar imagem. Verifique o Storage do Supabase.');
                console.error(uploadError);
                btnSubmit.innerText = "Adicionar Item";
                btnSubmit.disabled = false;
                return;
            }

            // Pega a URL pública do arquivo recém upado
            const { data: publicUrlData } = supabase.storage
                .from('imagens')
                .getPublicUrl(fileName);

            imagemPublicUrl = publicUrlData.publicUrl;
        }

        // 2. Salvar Dados no Banco
        btnSubmit.innerText = "Salvando dados...";

        const novoItem = {
            id: idRaw,
            tipo: document.getElementById('tipoItem').value,
            titulo: document.getElementById('itemTitulo').value,
            imagem: imagemPublicUrl,
            descricao: document.getElementById('itemDescricao').value,
            tags: document.getElementById('itemTags').value.split(',').map(tag => tag.trim())
        };

        if (novoItem.tipo === 'solucao') {
            novoItem.categoria = document.getElementById('itemCategoria').value;
        }

        const { error } = await supabase.from('portfolio').insert([novoItem]);

        if (error) {
            alert('Erro ao salvar. ID já existe?');
            console.error(error);
        } else {
            form.reset();
            carregarItens();
            alert('Item e Imagem cadastrados com sucesso!');
        }

        btnSubmit.innerText = "Adicionar Item";
        btnSubmit.disabled = false;
    });

    carregarItens();
});