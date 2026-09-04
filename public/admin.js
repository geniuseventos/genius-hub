// Inicialização do Supabase
const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminForm');
    const listaItens = document.getElementById('listaItens');
    const tipoSelect = document.getElementById('tipoItem');
    const categoriaGroup = document.getElementById('itemCategoria').parentElement;

    // Ocultar/Mostrar categoria dependendo do tipo
    tipoSelect.addEventListener('change', (e) => {
        categoriaGroup.style.display = e.target.value === 'solucao' ? 'flex' : 'none';
    });

    // Função para carregar itens da base de dados
    async function carregarItens() {
        listaItens.innerHTML = '<li>Carregando itens do banco de dados...</li>';
        
        const { data, error } = await supabase
            .from('portfolio')
            .select('id, titulo, tipo')
            .order('titulo', { ascending: true }); // Ordena por ordem alfabética
        
        if (error) {
            alert('Erro ao carregar itens.');
            console.error(error);
            return;
        }

        listaItens.innerHTML = '';
        if (data.length === 0) {
            listaItens.innerHTML = '<li style="color: #888;">Nenhum item no banco de dados.</li>';
            return;
        }

        // Renderiza cada item encontrado
        data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${item.titulo}</strong> <span style="color: #888; font-size: 0.85rem;">(${item.tipo.toUpperCase()} - ID: ${item.id})</span>
                </div>
                <button class="btn-delete" data-id="${item.id}">Deletar</button>
            `;
            listaItens.appendChild(li);
        });
    }

    // Ação de Deletar
    listaItens.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.getAttribute('data-id');
            
            if (confirm(`Atenção: Tem certeza que deseja excluir definitivamente "${id}"? Essa ação não pode ser desfeita.`)) {
                
                // Exclui do Supabase
                const { error } = await supabase
                    .from('portfolio')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    alert('Erro ao deletar o item.');
                    console.error(error);
                } else {
                    carregarItens();
                    alert('Item deletado com sucesso!');
                }
            }
        }
    });

    // Ação de Salvar (Inserir novo item)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.innerText = "Salvando...";
        btnSubmit.disabled = true;

        // Limpa e cria o ID (transforma em formato de link URL)
        let idRaw = document.getElementById('itemId').value.trim().toLowerCase();
        idRaw = idRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // Tira acentos
        idRaw = idRaw.replace(/[^a-z0-9-]/g, '-'); // Tira caracteres especiais

        const novoItem = {
            id: idRaw,
            tipo: document.getElementById('tipoItem').value,
            titulo: document.getElementById('itemTitulo').value,
            imagem: document.getElementById('itemImagem').value,
            descricao: document.getElementById('itemDescricao').value,
            tags: document.getElementById('itemTags').value.split(',').map(tag => tag.trim())
        };

        if (novoItem.tipo === 'solucao') {
            novoItem.categoria = document.getElementById('itemCategoria').value;
        }

        // Insere no Supabase
        const { error } = await supabase
            .from('portfolio')
            .insert([novoItem]);

        if (error) {
            alert('Erro ao salvar o item. Verifique se esse ID já não está cadastrado.');
            console.error(error);
        } else {
            form.reset();
            carregarItens();
            alert('Item adicionado com sucesso! Já está online.');
        }

        btnSubmit.innerText = "Adicionar Item";
        btnSubmit.disabled = false;
    });

    // Inicializa a lista ao carregar a página
    carregarItens();
});