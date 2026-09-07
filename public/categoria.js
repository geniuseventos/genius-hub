const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const urlParams = new URLSearchParams(window.location.search);
let categoriaAtiva = urlParams.get('cat') || 'todos';

let todasSolucoes = [];
let solucoesFiltradas = [];
const itensPorPagina = 8;
let paginaAtual = 1;

const grid = document.getElementById('portfolio-grid');
const paginacao = document.getElementById('paginacao');
const breadcrumbCat = document.getElementById('breadcrumb-categoria');
const tituloCat = document.getElementById('titulo-categoria');
const botoesFiltro = document.querySelectorAll('.filter-btn');

const nomesCategorias = {
    'jogos': 'Games',
    'gestao': 'Sistemas',
    'experiencias': 'Experiências & Projetos',
    'ia': 'Lançamentos',
    'todos': 'Catálogo Completo'
};

const padronizar = (texto) => String(texto || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function initFiltros() {
    atualizarTextosCategoria(categoriaAtiva);

    botoesFiltro.forEach(btn => {
        if(btn.getAttribute('data-cat') === categoriaAtiva) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', (e) => {
            botoesFiltro.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            categoriaAtiva = e.target.getAttribute('data-cat');
            atualizarTextosCategoria(categoriaAtiva);
            
            // Atualiza a URL sem recarregar a página
            const url = new URL(window.location);
            url.searchParams.set('cat', categoriaAtiva);
            window.history.pushState({}, '', url);

            filtrarSolucoes();
        });
    });
}

function atualizarTextosCategoria(cat) {
    const nome = nomesCategorias[cat] || 'Soluções';
    breadcrumbCat.textContent = nome;
    tituloCat.textContent = cat === 'todos' ? 'CATÁLOGO DE SOLUÇÕES' : nome.toUpperCase();
}

async function carregarSolucoes() {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;">Carregando catálogo...</div>';
    
    const { data, error } = await supabaseClient.from('portfolio').select('*').order('id', { ascending: false });
    
    if (error) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: red;">Erro ao carregar o catálogo.</div>';
        return;
    }

    // Filtra apenas as soluções (ignora cases de marca)
    todasSolucoes = data.filter(item => padronizar(item.tipo) === 'solucao');
    
    initFiltros();
    filtrarSolucoes();
}

function filtrarSolucoes() {
    if (categoriaAtiva === 'todos') {
        solucoesFiltradas = todasSolucoes;
    } else {
        solucoesFiltradas = todasSolucoes.filter(item => {
            const cat = padronizar(item.categoria);
            if (categoriaAtiva === 'jogos' && (cat.includes('jogo') || cat.includes('game'))) return true;
            if (categoriaAtiva === 'gestao' && (cat.includes('gestao') || cat.includes('sistema'))) return true;
            if (categoriaAtiva === 'experiencias' && (cat.includes('totem') || cat === 'vr' || cat.includes('realidade') || cat.includes('experiencia'))) return true;
            if (categoriaAtiva === 'ia' && (cat === 'ia' || cat.includes('lancamento'))) return true;
            return false;
        });
    }
    renderizarPagina(1);
}

function getNomeTagVisual(itemCategoria) {
    const cat = padronizar(itemCategoria);
    if(cat.includes('jogo') || cat.includes('game')) return 'GAMES';
    if(cat.includes('gestao') || cat.includes('sistema')) return 'SISTEMAS';
    if(cat.includes('totem') || cat === 'vr' || cat.includes('realidade')) return 'EXPERIÊNCIAS';
    if(cat.includes('ia') || cat.includes('lancamento')) return 'LANÇAMENTOS';
    return 'SOLUÇÃO';
}

function renderizarPagina(pagina) {
    paginaAtual = pagina;
    grid.innerHTML = '';
    
    const indexInicio = (pagina - 1) * itensPorPagina;
    const indexFim = indexInicio + itensPorPagina;
    const itensParaMostrar = solucoesFiltradas.slice(indexInicio, indexFim);

    if (itensParaMostrar.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;">Nenhuma solução cadastrada nesta categoria.</div>';
        paginacao.innerHTML = '';
        return;
    }

    itensParaMostrar.forEach((item) => {
        const a = document.createElement('a');
        a.href = `case-interno.html?item=${item.id}`;
        a.className = 'modern-card';

        const tagNome = getNomeTagVisual(item.categoria);
        const desc = item.descricao && item.descricao.length > 80 ? item.descricao.substring(0, 80) + '...' : (item.descricao || '');

        a.innerHTML = `
            <img src="${item.imagem}" alt="${item.titulo}" class="modern-card-img" loading="lazy">
            <div class="modern-card-body">
                <div class="modern-card-tag">* ${tagNome}</div>
                <h4 class="modern-card-title">${item.titulo}</h4>
                <p class="modern-card-desc">${desc}</p>
                <div class="modern-card-btn">Ver Detalhes</div>
            </div>
        `;
        grid.appendChild(a);
    });

    renderizarPaginacao();
}

function renderizarPaginacao() {
    paginacao.innerHTML = '';
    const totalPaginas = Math.ceil(solucoesFiltradas.length / itensPorPagina);

    if (totalPaginas <= 1) return;

    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerText = '←';
    btnPrev.disabled = paginaAtual === 1;
    btnPrev.addEventListener('click', () => { renderizarPagina(paginaAtual - 1); window.scrollTo({top: 0, behavior: 'smooth'}); });
    paginacao.appendChild(btnPrev);

    for (let i = 1; i <= totalPaginas; i++) {
        const btnNum = document.createElement('button');
        btnNum.className = `page-btn ${paginaAtual === i ? 'active' : ''}`;
        btnNum.innerText = i;
        btnNum.addEventListener('click', () => { renderizarPagina(i); window.scrollTo({top: 0, behavior: 'smooth'}); });
        paginacao.appendChild(btnNum);
    }

    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerText = '→';
    btnNext.disabled = paginaAtual === totalPaginas;
    btnNext.addEventListener('click', () => { renderizarPagina(paginaAtual + 1); window.scrollTo({top: 0, behavior: 'smooth'}); });
    paginacao.appendChild(btnNext);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarSolucoes();
    
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const btnMenu = document.getElementById('mobile-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', function() {
            this.classList.toggle('active');
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }
});