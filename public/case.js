// Inicialização do Supabase
const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 1. Pega os parâmetros na URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('item'); 
const projetoId = urlParams.get('projeto'); 

// O ID que vamos buscar no banco (na tabela do Supabase todos usam a coluna 'id')
const idBuscado = itemId || projetoId;

async function carregarDetalhes() {
    // Se não tiver nenhum ID na URL, mostra erro
    if (!idBuscado) {
        mostrarErro();
        return;
    }

    // 2. Busca o item específico no Supabase
    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('id', idBuscado)
        .single(); // .single() garante que retorne apenas o objeto correto, e não um array

    // Se der erro (ex: id não existe no banco) ou não vier dados
    if (error || !data) {
        mostrarErro();
        console.error("Erro ao buscar detalhes:", error);
        return;
    }

    // 3. Injeta os dados na tela
    document.getElementById('case-titulo').innerText = data.titulo;
    document.getElementById('case-img').src = data.imagem;
    document.getElementById('case-desc').innerText = data.descricao;

    // Cria as tags
    const tagsContainer = document.getElementById('case-tags');
    tagsContainer.innerHTML = ''; 
    if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach(tag => {
            const li = document.createElement('li');
            li.className = 'tag';
            li.innerText = tag;
            tagsContainer.appendChild(li);
        });
    }
}

// Função para exibir mensagem caso o link esteja quebrado ou o item não exista
function mostrarErro() {
    document.getElementById('case-titulo').innerText = "Conteúdo não encontrado";
    document.getElementById('case-desc').innerText = "O projeto ou solução que você procura não está disponível ou o link está incorreto.";
    
    const imgElement = document.getElementById('case-img');
    if (imgElement) imgElement.style.display = 'none';
    
    const tagsElement = document.getElementById('case-tags');
    if (tagsElement) tagsElement.innerHTML = '';
}

// Inicia a busca automaticamente quando a página carrega
carregarDetalhes();