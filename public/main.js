const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const padronizar = (texto) => String(texto || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach((element) => { observer.observe(element); });
}

function initHeroTypewriter() {
    const elemento = document.getElementById('hero-typewriter');
    if (!elemento) return;
    const textos = ['TECNOLOGIA QUE GERA EXPERIÊNCIAS.', 'INTERAÇÃO QUE GERA RESULTADOS.', 'INOVAÇÃO QUE CONECTA PESSOAS.'];
    let textoAtual = 0, caractereAtual = 0, apagando = false;

    function escrever() {
        const texto = textos[textoAtual];
        if (!apagando) {
            elemento.textContent = texto.substring(0, caractereAtual + 1);
            caractereAtual++;
            if (caractereAtual === texto.length) { apagando = true; setTimeout(escrever, 2500); return; }
            setTimeout(escrever, 70);
        } else {
            elemento.textContent = texto.substring(0, caractereAtual - 1);
            caractereAtual--;
            if (caractereAtual === 0) { apagando = false; textoAtual = (textoAtual + 1) % textos.length; setTimeout(escrever, 500); return; }
            setTimeout(escrever, 40);
        }
    }
    escrever();
}

function atualizarContadoresSolucoes(itens) {
    let jogos = 0, sistemas = 0, experiencias = 0, lancamentos = 0;
    itens.forEach(item => {
        const tipo = padronizar(item.tipo);
        if (tipo === 'solucao') {
            const cat = padronizar(item.categoria);
            if (cat === 'jogos') jogos++;
            else if (cat === 'gestao') sistemas++;
            else if (cat === 'totem' || cat === 'vr') experiencias++;
            else if (cat === 'ia') lancamentos++;
        }
    });

    const elGames = document.getElementById('count-games'); if (elGames) elGames.textContent = `${jogos} soluções`;
    const elSistemas = document.getElementById('count-sistemas'); if (elSistemas) elSistemas.textContent = `${sistemas} soluções`;
    const elExperiencias = document.getElementById('count-experiencias'); if (elExperiencias) elExperiencias.textContent = `${experiencias} soluções`;
    const elLancamentos = document.getElementById('count-lancamentos'); if (elLancamentos) elLancamentos.textContent = `${lancamentos} soluções`;
}

async function carregarProjetosHome() {
    try {
        const { data, error } = await supabaseClient.from('portfolio').select('*').order('id', { ascending: false });
        if (error) { console.error('Erro:', error); return; }

        const itens = data || [];
        atualizarContadoresSolucoes(itens);

        const solucoes = itens.filter(item => padronizar(item.tipo) === 'solucao');
        renderizarVitrineSolucoes(solucoes);

        const projetos = itens.filter(item => padronizar(item.tipo) === 'projeto');
        renderizarCases(projetos);

    } catch (error) { console.error('Erro:', error); }
}

function renderizarVitrineSolucoes(solucoes) {
    const track = document.getElementById('vitrine-track');
    if (!track) return;
    track.innerHTML = '';
    
    solucoes.forEach((solucao) => {
        const a = document.createElement('a');
        a.href = `case-interno.html?item=${solucao.id}`;
        a.className = 'modern-card';

        const categoriasMap = { 'jogos': 'GAMES', 'gestao': 'SISTEMAS', 'totem': 'EXPERIÊNCIAS', 'vr': 'REALIDADE VIRTUAL', 'ia': 'LANÇAMENTOS' };
        const catName = categoriasMap[solucao.categoria] || 'SOLUÇÃO';
        const desc = solucao.descricao && solucao.descricao.length > 80 ? solucao.descricao.substring(0, 80) + '...' : (solucao.descricao || '');

        a.innerHTML = `
            <img src="${solucao.imagem}" alt="${solucao.titulo}" class="modern-card-img" loading="lazy">
            <div class="modern-card-body">
                <div class="modern-card-tag">* ${catName}</div>
                <h4 class="modern-card-title">${solucao.titulo}</h4>
                <p class="modern-card-desc">${desc}</p>
                <div class="modern-card-btn">Ver Detalhes</div>
            </div>
        `;
        track.appendChild(a);
    });
}

function renderizarCases(projetos) {
    const container = document.getElementById('cases-track');
    if (!container) return;
    if (!projetos || projetos.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Nenhum projeto cadastrado no momento.</p></div>`;
        return;
    }
    container.innerHTML = '';

    projetos.slice(0, 6).forEach((projeto) => {
        const imagem = projeto.imagem || 'assets/img/placeholder.jpg';
        const titulo = projeto.titulo || 'Projeto Genius Hub';
        const descricao = projeto.descricao || 'Conheça este projeto.';
        const id = projeto.id;

        const card = document.createElement('a');
        card.href = `case-interno.html?projeto=${id}`;
        card.className = 'case-card';
        card.style.backgroundImage = `url('${imagem}')`;

        card.innerHTML = `
            <div class="case-overlay"></div>
            <h3>${titulo}</h3>
        `;
        container.appendChild(card);
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }, { passive: true });
}

function initCarousels() {
    const trackVitrine = document.getElementById('vitrine-track');
    const prevVitrine = document.getElementById('prev-vitrine');
    const nextVitrine = document.getElementById('next-vitrine');

    if (trackVitrine && prevVitrine && nextVitrine) {
        nextVitrine.addEventListener('click', () => { trackVitrine.scrollBy({ left: 345, behavior: 'smooth' }); });
        prevVitrine.addEventListener('click', () => { trackVitrine.scrollBy({ left: -345, behavior: 'smooth' }); });
    }

    const trackCases = document.getElementById('cases-track');
    const prevCases = document.getElementById('prev-cases');
    const nextCases = document.getElementById('next-cases');

    if (trackCases && prevCases && nextCases) {
        nextCases.addEventListener('click', () => { trackCases.scrollBy({ left: 340, behavior: 'smooth' }); });
        prevCases.addEventListener('click', () => { trackCases.scrollBy({ left: -340, behavior: 'smooth' }); });
    }
}

function initMobileMenu() {
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-links');
    if (!menuButton || !menu) return;

    menuButton.addEventListener('click', () => {
        menu.classList.toggle('active');
        menuButton.classList.toggle('active');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuButton.classList.remove('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initHeroTypewriter();
    initReveal();
    initNavbarScroll();
    initCarousels();
    initMobileMenu();
    carregarProjetosHome();
});