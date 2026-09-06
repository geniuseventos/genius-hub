// ============================================================
// GENIUS HUB - MAIN.JS
// ============================================================

// ============================================================
// 0. UTILITÁRIOS
// ============================================================
// Função global para remover acentos, espaços extras e maiúsculas
const padronizar = (texto) => 
    String(texto || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ============================================================
// 1. ANIMAÇÕES DE REVEAL
// ============================================================
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

    reveals.forEach((element) => {
        observer.observe(element);
    });
}

// ============================================================
// 2. TYPEWRITER DO HERO
// ============================================================
function initHeroTypewriter() {
    const elemento = document.getElementById('hero-typewriter');
    if (!elemento) return;

    const textos = [
        'TECNOLOGIA QUE GERA EXPERIÊNCIAS.',
        'INTERAÇÃO QUE GERA RESULTADOS.',
        'INOVAÇÃO QUE CONECTA PESSOAS.'
    ];

    let textoAtual = 0;
    let caractereAtual = 0;
    let apagando = false;

    function escrever() {
        const texto = textos[textoAtual];

        if (!apagando) {
            elemento.textContent = texto.substring(0, caractereAtual + 1);
            caractereAtual++;

            if (caractereAtual === texto.length) {
                apagando = true;
                setTimeout(escrever, 2500);
                return;
            }
            setTimeout(escrever, 70);
        } else {
            elemento.textContent = texto.substring(0, caractereAtual - 1);
            caractereAtual--;

            if (caractereAtual === 0) {
                apagando = false;
                textoAtual = (textoAtual + 1) % textos.length;
                setTimeout(escrever, 500);
                return;
            }
            setTimeout(escrever, 40);
        }
    }

    escrever();
}

// ============================================================
// 3. ATUALIZAR CONTADORES DAS SOLUÇÕES (VERSÃO ALIAS)
// ============================================================
function atualizarContadoresSolucoes(itens) {
    // 1. Filtra as Soluções
    const solucoes = itens.filter(item => padronizar(item.tipo) === 'solucao');
    console.log('Total de soluções no banco:', solucoes.length);

    // 2. Contadores (Agrupando nomes do BD antigo e do Formulário Novo)
    const contagens = {
        jogos: 0,
        gestao: 0,
        totem: 0,
        vr: 0,
        ia: 0
    };

    solucoes.forEach(item => {
        const cat = padronizar(item.categoria);
        // Mapeia tanto os nomes antigos (jogos, gestao) quanto os do form novo (games, sistemas)
        if (cat === 'jogos' || cat === 'games') contagens.jogos++;
        else if (cat === 'gestao' || cat === 'sistemas') contagens.gestao++;
        else if (cat === 'totem' || cat === 'totem fotografico') contagens.totem++;
        else if (cat === 'vr' || cat === 'realidade virtual' || cat === 'experiencias & projetos') contagens.vr++;
        else if (cat === 'ia' || cat === 'lancamentos' || cat === 'lancamentos / ia') contagens.ia++;
    });

    console.log('Contagens por categoria (corrigido):', contagens);

    // 3. Função inteligente para atualizar o HTML
    function atualizarElemento(elemento, quantidade) {
        if (!elemento) return;
        const contadorInterno = elemento.querySelector('.quantidade-solucao, .contador, .count, .numero, .quantidade');
        
        if (contadorInterno) {
            contadorInterno.textContent = quantidade;
        } else {
            // Se for "0 soluções" tudo junto, troca o primeiro número que achar
            elemento.innerHTML = elemento.innerHTML.replace(/\d+/, quantidade);
        }
    }

    // 4. Atualizar por ID
    atualizarElemento(document.getElementById('contador-jogos'), contagens.jogos);
    atualizarElemento(document.getElementById('contador-gestao'), contagens.gestao);
    atualizarElemento(document.getElementById('contador-totem'), contagens.totem);
    atualizarElemento(document.getElementById('contador-vr'), contagens.vr);
    atualizarElemento(document.getElementById('contador-ia'), contagens.ia);

    // 5. Atualizar por data-categoria ou classes
    const elementosCategoria = document.querySelectorAll('[data-categoria], .quantidade-solucao');
    
    elementosCategoria.forEach((elemento) => {
        const cat = padronizar(elemento.getAttribute('data-categoria'));
        
        if (cat === 'jogos' || cat === 'games') atualizarElemento(elemento, contagens.jogos);
        else if (cat === 'gestao' || cat === 'sistemas') atualizarElemento(elemento, contagens.gestao);
        else if (cat === 'totem' || cat === 'totem fotografico') atualizarElemento(elemento, contagens.totem);
        else if (cat === 'vr' || cat === 'realidade virtual' || cat === 'experiencias & projetos') atualizarElemento(elemento, contagens.vr);
        else if (cat === 'ia' || cat === 'lancamentos' || cat === 'lancamentos / ia') atualizarElemento(elemento, contagens.ia);
    });
}

// ============================================================
// 4. CARREGAR DADOS DO SUPABASE
// ============================================================
async function carregarProjetosHome() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase não foi carregado.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('portfolio')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Erro ao carregar dados do Supabase:', error);
            return;
        }

        const itens = data || [];
        console.log('Itens carregados do Supabase:', itens);

        // ====================================================
        // CONTADORES GERAIS
        // ====================================================
        const contadorProjetos = document.getElementById('contador-projetos');
        const contadorSolucoes = document.getElementById('contador-solucoes');
        const contadorExperiencias = document.getElementById('contador-experiencias');

        const totalProjetos = itens.filter(
            item => padronizar(item.tipo) === 'projeto'
        ).length;
        if (contadorProjetos) contadorProjetos.textContent = totalProjetos;

        const totalSolucoes = itens.filter(
            item => padronizar(item.tipo) === 'solucao'
        ).length;
        if (contadorSolucoes) contadorSolucoes.textContent = totalSolucoes;

        // Atualizado para considerar os novos nomes de categoria no contador global
        const totalExperiencias = itens.filter(item => {
            const tipo = padronizar(item.tipo);
            const categoria = padronizar(item.categoria);
            return tipo === 'solucao' && (
                categoria === 'totem' || 
                categoria === 'totem fotografico' || 
                categoria === 'vr' || 
                categoria === 'realidade virtual'
            );
        }).length;
        if (contadorExperiencias) contadorExperiencias.textContent = totalExperiencias;

        // ====================================================
        // ATUALIZA OS CARDS DE SOLUÇÕES
        // ====================================================
        atualizarContadoresSolucoes(itens);

        // ====================================================
        // CARREGAR CASES
        // ====================================================
        const projetos = itens.filter(
            item => padronizar(item.tipo) === 'projeto'
        );
        renderizarCases(projetos);

    } catch (error) {
        console.error('Erro inesperado:', error);
    }
}

// ============================================================
// 5. RENDERIZAR CASES
// ============================================================
function renderizarCases(projetos) {
    const container = document.getElementById('cases-container');
    if (!container) return;

    if (!projetos || projetos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum projeto cadastrado no momento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    projetos.slice(0, 6).forEach((projeto) => {
        const imagem = projeto.imagem || projeto.imagem_1 || 'assets/img/placeholder.jpg';
        const titulo = projeto.titulo || 'Projeto Genius Hub';
        const descricao = projeto.descricao || 'Conheça este projeto desenvolvido pelo Genius Hub.';
        const categoria = projeto.categoria || 'Experiência';
        const id = projeto.id;

        const card = document.createElement('article');
        card.className = 'case-card reveal';

        card.innerHTML = `
            <a href="case-interno.html?item=${id}" class="case-link">
                <div class="case-image">
                    <img src="${imagem}" alt="${titulo}" loading="lazy">
                    <div class="case-overlay">
                        <span>VER PROJETO →</span>
                    </div>
                </div>
                <div class="case-content">
                    <span class="case-category">${categoria}</span>
                    <h3>${titulo}</h3>
                    <p>${descricao}</p>
                </div>
            </a>
        `;
        container.appendChild(card);
    });

    initReveal();
}

// ============================================================
// 6. NAVBAR
// ============================================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function atualizarNavbar() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', atualizarNavbar, { passive: true });
    atualizarNavbar();
}

// ============================================================
// 7. CARROSSEL
// ============================================================
function initCarousel() {
    const carousel = document.querySelector('.cases-grid');
    if (!carousel) return;

    const cards = carousel.querySelectorAll('.case-card');
    if (cards.length <= 1) return;

    let indice = 0;

    function atualizarCarousel() {
        cards.forEach((card, index) => {
            card.classList.remove('active');
            if (index === indice) {
                card.classList.add('active');
            }
        });
    }

    function proximo() {
        indice = (indice + 1) % cards.length;
        atualizarCarousel();
    }

    if (window.innerWidth <= 768) {
        setInterval(proximo, 5000);
    }
}

// ============================================================
// 8. EFEITO DARK / PARALLAX
// ============================================================
function initDarkSectionEffect() {
    const section = document.querySelector('#solucoes');
    if (!section) return;

    let ticking = false;

    function atualizarParallax() {
        if (ticking) return;

        window.requestAnimationFrame(() => {
            const rect = section.getBoundingClientRect();
            const altura = window.innerHeight;

            if (rect.bottom > 0 && rect.top < altura) {
                const progresso = (altura - rect.top) / (altura + rect.height);
                section.style.setProperty('--parallax-progress', progresso);
            }
            ticking = false;
        });

        ticking = true;
    }

    window.addEventListener('scroll', atualizarParallax, { passive: true });
    atualizarParallax();
}

// ============================================================
// 9. TÍTULO NOSSOS CLIENTES
// ============================================================
function initTituloFujao() {
    const titulo = document.getElementById('titulo-fujao');
    if (!titulo) return;

    const valorOriginal = titulo.textContent.trim();

    titulo.addEventListener('mouseenter', () => {
        titulo.textContent = 'NOSSOS CLIENTES';
    });

    titulo.addEventListener('mouseleave', () => {
        titulo.textContent = valorOriginal;
    });
}

// ============================================================
// 10. MENU MOBILE
// ============================================================
function initMobileMenu() {
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-links');
    if (!menuButton || !menu) return;

    menuButton.addEventListener('click', () => {
        menu.classList.toggle('active');
        menuButton.classList.toggle('active');
    });

    const links = menu.querySelectorAll('a');
    links.forEach((link) => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuButton.classList.remove('active');
        });
    });
}

// ============================================================
// 11. REMOVER SOLUÇÕES DO HOME
// ============================================================
function corrigirTituloSolucoes() {
    const home = document.getElementById('home');
    if (!home) return;

    const elementos = home.querySelectorAll('#titulo-solucoes');
    elementos.forEach((elemento) => {
        elemento.remove();
    });
}

// ============================================================
// 12. INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Genius Hub iniciado.');

    initHeroTypewriter();
    initReveal();
    initNavbarScroll();
    initCarousel();
    initDarkSectionEffect();
    initTituloFujao();
    initMobileMenu();
    corrigirTituloSolucoes();
    carregarProjetosHome();
});