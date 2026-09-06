document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item') || urlParams.get('projeto'); 

    const nomesCategorias = { 'jogos': 'Games', 'gestao': 'Sistemas', 'totem': 'Experiências & Projetos', 'vr': 'Experiências & Projetos', 'ia': 'Lançamentos' };

    async function carregarDetalhes() {
        if (!itemId) return mostrarErro();

        try {
            const { data, error } = await supabaseClient.from('portfolio').select('*').eq('id', itemId).single(); 
            if (error || !data) return mostrarErro();

            // 1. Informações Básicas
            document.getElementById('case-titulo').innerText = data.titulo;
            document.getElementById('case-titulo-mobile').innerText = data.titulo;
            
            document.getElementById('case-desc').innerText = data.descricao || '';
            document.getElementById('case-desc-mobile').innerText = data.descricao || '';
            
            const btnWhats = document.getElementById('btn-whatsapp-produto');
            if (btnWhats) btnWhats.href = `https://wa.me/5583920036455?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre: ${data.titulo}`)}`;

            // 2. Galeria Carrossel
            const imagensGaleria = [data.imagem, data.imagem2, data.imagem3, data.imagem4, data.imagem5].filter(img => img && img.trim() !== '');
            const imgMain = document.getElementById('case-img-main');
            const wrapper = document.getElementById('thumbs-wrapper');
            const thumbsContainer = document.getElementById('gallery-thumbs');
            const btnPrev = document.getElementById('gal-prev');
            const btnNext = document.getElementById('gal-next');

            if (imagensGaleria.length > 0) {
                imgMain.src = imagensGaleria[0];
                if (imagensGaleria.length > 1) {
                    wrapper.style.display = 'flex';
                    thumbsContainer.innerHTML = imagensGaleria.map((imgUrl, index) => 
                        `<img src="${imgUrl}" class="thumb-img ${index === 0 ? 'active' : ''}" data-index="${index}">`
                    ).join('');

                    let currentIndex = 0;
                    let autoPlay;

                    const updateImage = (index) => {
                        currentIndex = index;
                        thumbsContainer.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                        thumbsContainer.querySelector(`[data-index="${index}"]`).classList.add('active');
                        imgMain.style.opacity = '0.7';
                        setTimeout(() => { imgMain.src = imagensGaleria[index]; imgMain.style.opacity = '1'; }, 150);
                    };

                    const nextImg = () => updateImage((currentIndex + 1) % imagensGaleria.length);
                    const prevImg = () => updateImage((currentIndex - 1 + imagensGaleria.length) % imagensGaleria.length);

                    btnNext.onclick = nextImg;
                    btnPrev.onclick = prevImg;

                    thumbsContainer.querySelectorAll('.thumb-img').forEach(thumb => {
                        thumb.onclick = () => updateImage(parseInt(thumb.getAttribute('data-index')));
                    });

                    const startAutoPlay = () => autoPlay = setInterval(nextImg, 3500);
                    const stopAutoPlay = () => clearInterval(autoPlay);
                    
                    document.querySelector('.hero-gallery').addEventListener('mouseenter', stopAutoPlay);
                    document.querySelector('.hero-gallery').addEventListener('mouseleave', startAutoPlay);
                    startAutoPlay();
                }
            } else {
                imgMain.style.display = 'none';
            }

            // 3. Upsell Inteligente
            const upsellBox = document.getElementById('upsell-container');
            if (data.upsell_ativo && data.upsell_ativo !== 'nao') {
                const { data: upsellData } = await supabaseClient.from('portfolio').select('id, titulo, descricao, imagem, categoria').eq('id', data.upsell_ativo).single();
                if (upsellData) {
                    upsellBox.style.display = 'block';
                    document.getElementById('upsell-img').src = upsellData.imagem;
                    document.getElementById('upsell-titulo').innerText = upsellData.titulo;
                    
                    const upsellCatName = nomesCategorias[upsellData.categoria] || upsellData.categoria || 'SISTEMAS';
                    document.getElementById('upsell-tag').innerText = `* ${upsellCatName}`;

                    const shortDesc = upsellData.descricao && upsellData.descricao.length > 80 ? upsellData.descricao.substring(0, 80) + '...' : upsellData.descricao;
                    document.getElementById('upsell-desc').innerText = shortDesc || '';
                    document.getElementById('upsell-link').href = `case-interno.html?item=${upsellData.id}`;
                }
            }

            // 4. Benefícios Rápidos e Tags
            const ulBeneficios = document.getElementById('case-beneficios');
            if (data.beneficios) {
                document.getElementById('box-beneficios-topo').style.display = 'block';
                ulBeneficios.innerHTML = data.beneficios.split('\n').filter(l => l.trim()).map(line => 
                    `<li>
                        <div class="check-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                        <span>${line}</span>
                    </li>`
                ).join('');
            } else {
                document.getElementById('box-beneficios-topo').style.display = 'none';
            }

            const tagsContainer = document.getElementById('case-tags');
            if (data.tags && data.tags.length > 0 && data.tags[0] !== "") {
                document.getElementById('box-tags').style.display = 'block';
                tagsContainer.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
            }

            // 5. As 4 Listas do Bento Box (Ícones Brancos)
            function preencherListaBento(elementId, boxId, textoRaw) {
                const box = document.getElementById(boxId);
                const ul = document.getElementById(elementId);
                if (!textoRaw || !textoRaw.trim()) {
                    if (box) box.style.display = 'none';
                    return;
                }
                if (box) box.style.display = 'flex';
                const linhas = textoRaw.split('\n').filter(l => l.trim() !== '');
                
                // Mudei a cor de #111 para #ffffff
                ul.innerHTML = linhas.map(line => `<li><svg style="flex-shrink: 0; color: #ffffff; margin-top: 2px;" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg> <span>${line}</span></li>`).join('');
            }

            preencherListaBento('case-oque-ganha', 'box-oque-ganha', data.oque_ganha);
            preencherListaBento('case-como-funciona', 'box-como-funciona', data.como_funciona);
            preencherListaBento('case-personalizacao', 'box-personalizacao', data.personalizacao);
            preencherListaBento('case-entrega', 'box-entrega', data.entrega);

            // 6. Breadcrumb e Voltar
            const catName = nomesCategorias[data.categoria] || data.categoria;
            let linkCat = data.categoria === 'totem' || data.categoria === 'vr' ? 'experiencias' : data.categoria;
            document.getElementById('breadcrumb-titulo').innerText = data.titulo;

            if (data.tipo === 'solucao' && data.categoria) {
                document.getElementById('breadcrumb-categoria').innerText = catName;
                document.getElementById('breadcrumb-categoria').href = `categoria.html?cat=${linkCat}`;
                document.getElementById('breadcrumb-categoria').style.display = 'inline';
                document.getElementById('breadcrumb-separador').style.display = 'inline';
                document.getElementById('btn-voltar').href = `categoria.html?cat=${linkCat}`;
            } else {
                document.getElementById('btn-voltar').href = 'index.html#cases';
            }
        } catch (erro) {
            mostrarErro();
        }
    }

    function mostrarErro() {
        document.getElementById('case-titulo').innerText = "Conteúdo não encontrado";
        document.getElementById('case-desc').innerText = "O projeto ou solução que você procura não está disponível.";
        document.getElementById('case-titulo-mobile').innerText = "Conteúdo não encontrado";
        document.getElementById('case-desc-mobile').innerText = "O projeto ou solução que você procura não está disponível.";
        document.getElementById('case-img-main').style.display = 'none';
    }

    carregarDetalhes();

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => navbar && (window.scrollY > 50 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled')));

    const btnMenu = document.getElementById('mobile-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', function() {
            this.classList.toggle('is-active');
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }

    // Interatividade das estrelas para os blocos .section-dark
    const sectionsDark = document.querySelectorAll('.section-dark');
    const moverEstrelas = (e) => {
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX === undefined || clientY === undefined) return;
        const x = (clientX / window.innerWidth - 0.5) * 2;
        const y = (clientY / window.innerHeight - 0.5) * 2;
        sectionsDark.forEach(s => { 
            s.style.setProperty('--x', `${x * 30}px`); 
            s.style.setProperty('--y', `${y * 30}px`); 
        });
    };
    document.addEventListener('mousemove', moverEstrelas);
    document.addEventListener('touchmove', moverEstrelas, { passive: true });
});