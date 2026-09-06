document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');

    const tituloEl = document.getElementById('titulo-categoria');
    const breadcrumbEl = document.getElementById('breadcrumb-categoria');
    const gridContainer = document.getElementById('portfolio-grid');
    const paginacaoContainer = document.getElementById('paginacao');

    const nomesCategorias = { 'jogos': 'Games', 'gestao': 'Sistemas', 'experiencias': 'Experiências & Projetos', 'ia': 'Lançamentos' };

    const nomeDaCategoria = nomesCategorias[cat] || 'Soluções';
    if (tituloEl) tituloEl.innerText = nomeDaCategoria;
    if (breadcrumbEl) breadcrumbEl.innerText = nomeDaCategoria;

    let projetosFiltrados = [];
    let paginaAtual = 1;
    const itensPorPagina = 8; 

    async function carregarCategoria() {
        if (!gridContainer) return;
        gridContainer.innerHTML = '<p style="color: #666; font-weight: bold;">Carregando soluções...</p>';

        try {
            const { data, error } = await supabase.from('portfolio').select('*').eq('tipo', 'solucao');

            if (error) throw error;

            if (data) {
                const catFiltro = cat ? cat.toLowerCase().trim() : '';
                
                if (catFiltro === 'experiencias') {
                    projetosFiltrados = data.filter(p => p.categoria && (p.categoria.toLowerCase() === 'totem' || p.categoria.toLowerCase() === 'vr'));
                } else if (catFiltro) {
                    projetosFiltrados = data.filter(p => p.categoria && p.categoria.toLowerCase() === catFiltro);
                } else {
                    projetosFiltrados = data; 
                }

                if (projetosFiltrados.length === 0) {
                    gridContainer.innerHTML = '<p style="color: #666; padding: 20px;">Nenhuma solução cadastrada nesta categoria ainda.</p>';
                    return;
                }

                renderizarGrade();
            }
        } catch (error) {
            gridContainer.innerHTML = '<p style="color: red;">Erro de conexão com o banco de dados.</p>';
        }
    }

    function renderizarGrade() {
        gridContainer.innerHTML = '';
        
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const itensPagina = projetosFiltrados.slice(inicio, fim);

        itensPagina.forEach((projeto) => {
            const card = document.createElement('a');
            card.href = `case-interno.html?item=${projeto.id}`;
            card.className = 'modern-card'; // Classe CSS do design premium

            const descResumida = projeto.descricao && projeto.descricao.length > 80 
                ? projeto.descricao.substring(0, 80) + '...' 
                : projeto.descricao || '';

            const catName = nomesCategorias[projeto.categoria] || projeto.categoria || 'Solução';

            // Estrutura HTML que imita perfeitamente o card escuro com tag azul (Imagem 3)
            card.innerHTML = `
                <img src="${projeto.imagem}" alt="${projeto.titulo}" class="modern-card-img" loading="lazy">
                <div class="modern-card-body">
                    <div class="modern-card-tag">* ${catName}</div>
                    <h4 class="modern-card-title">${projeto.titulo}</h4>
                    <p class="modern-card-desc">${descResumida}</p>
                    <div class="modern-card-btn">Ver Detalhes</div>
                </div>
            `;
            gridContainer.appendChild(card);
        });

        renderizarBotoesPaginacao();
    }

    function renderizarBotoesPaginacao() {
        if (!paginacaoContainer) return;
        paginacaoContainer.innerHTML = '';
        const totalPaginas = Math.ceil(projetosFiltrados.length / itensPorPagina);
        if (totalPaginas <= 1) return;

        const btnPrev = document.createElement('button');
        btnPrev.className = 'page-btn';
        btnPrev.innerHTML = '&lt;';
        btnPrev.disabled = paginaAtual === 1;
        btnPrev.onclick = () => { paginaAtual--; renderizarGrade(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        paginacaoContainer.appendChild(btnPrev);

        for (let i = 1; i <= totalPaginas; i++) {
            const btnPage = document.createElement('button');
            btnPage.className = `page-btn ${i === paginaAtual ? 'active' : ''}`;
            btnPage.innerText = i;
            btnPage.onclick = () => { paginaAtual = i; renderizarGrade(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
            paginacaoContainer.appendChild(btnPage);
        }

        const btnNext = document.createElement('button');
        btnNext.className = 'page-btn';
        btnNext.innerHTML = '&gt;';
        btnNext.disabled = paginaAtual === totalPaginas;
        btnNext.onclick = () => { paginaAtual++; renderizarGrade(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        paginacaoContainer.appendChild(btnNext);
    }

    carregarCategoria();

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) window.scrollY > 50 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled');
    });

    const btnMenu = document.getElementById('mobile-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', function() {
            this.classList.toggle('is-active');
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }
});