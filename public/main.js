function initReveal() {
    const reveals = document.querySelectorAll('.reveal:not(.active)');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    reveals.forEach(reveal => observer.observe(reveal));
}
initReveal();

let projetos = []; 
const gridContainer = document.getElementById('portfolio-grid');
const filtros = document.querySelectorAll('#filtros-menu li');

async function carregarProjetosDoBanco() {
    if (!window.supabase) {
        console.error("Script do Supabase não carregou.");
        renderizarProjetos('todos');
        return;
    }

    try {
        const supabaseUrl = 'https://dwytzdsadnhbtgvlfswi.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXR6ZHNhZG5oYnRndmxmc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTIzNTEsImV4cCI6MjEwNDA2ODM1MX0.s6MBWZRgo5lwf_VYKr2rN4eGqlbXC3VKMzUPb6TseTU';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.from('portfolio').select('*'); 

        if (error) throw error;

        if (data) {
            projetos = data.filter(i => i.tipo === 'solucao').map(item => ({
                id: item.id,
                titulo: item.titulo,
                categoria: item.categoria,
                imagem: item.imagem,
                link: `case-interno.html?item=${item.id}`
            }));

            const casesHome = data.filter(i => i.tipo === 'projeto').map(item => ({
                id: item.id,
                titulo: item.titulo,
                imagem: item.imagem,
                link: `case-interno.html?projeto=${item.id}`
            }));

            renderizarCases(casesHome);
        }
    } catch (erro) {
        console.error("Erro ao conectar no banco:", erro);
    } finally {
        renderizarProjetos('todos'); 
    }
}
carregarProjetosDoBanco();

function renderizarProjetos(filtroAtual) {
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; 

    let projetosFiltrados = projetos;
    if (filtroAtual !== 'todos') {
        projetosFiltrados = projetos.filter(p => p.categoria === filtroAtual);
    }

    if (projetosFiltrados.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state reveal">
                <h3 style="color: white; margin-bottom: 10px;">Soluções sob medida!</h3>
                <p style="color: #ccc;">Nossa equipe está pronta para desenvolver esta tecnologia para o seu evento.</p>
            </div>
        `;
        setTimeout(initReveal, 50);
        return;
    }

    projetosFiltrados.forEach((projeto, index) => {
        const card = document.createElement('a');
        card.href = projeto.link;
        card.className = 'card-solucao reveal';
        card.style.transitionDelay = `${index * 0.1}s`; 
        card.innerHTML = `
            <div class="card-img"><img src="${projeto.imagem}" alt="${projeto.titulo}" loading="lazy"></div>
            <div class="card-title">${projeto.titulo}</div>
        `;
        gridContainer.appendChild(card);
    });
    setTimeout(initReveal, 50);
}

function renderizarCases(cases) {
    const track = document.getElementById('cases-track');
    if (!track) return;
    track.innerHTML = '';

    if (cases.length === 0) {
        track.innerHTML = '<div style="padding: 20px; color: #555; text-align: center; width: 100%;">Nenhum projeto cadastrado no banco ainda.</div>';
        return;
    }

    cases.forEach((projeto, index) => {
        const a = document.createElement('a');
        a.href = projeto.link;
        a.className = 'case-card'; 
        a.style.backgroundImage = `url('${projeto.imagem}')`;
        a.innerHTML = `<h3>${projeto.titulo}</h3>`;
        track.appendChild(a);
    });

    initCarousel();
}

filtros.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filtros.forEach(f => f.classList.remove('active'));
        e.target.classList.add('active');
        const categoria = e.target.getAttribute('data-filter');
        renderizarProjetos(categoria);
    });
});

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-item');

window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') && item.getAttribute('href').includes(current)) {
            item.classList.add('active');
        }
    });
});

window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollPosition', window.scrollY);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedScroll = sessionStorage.getItem('scrollPosition');
    if (savedScroll) {
        setTimeout(() => { window.scrollTo({ top: parseInt(savedScroll), behavior: 'auto' }); }, 100);
        sessionStorage.removeItem('scrollPosition'); 
    }
});

function initCarousel() {
    const track = document.getElementById('cases-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (track && prevBtn && nextBtn && track.children.length > 0) {
        const cardsArray = Array.from(track.children);
        cardsArray.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });

        const getScrollAmount = () => {
            const cardElement = track.querySelector('.case-card');
            if(!cardElement) return 300;
            return cardElement.offsetWidth + 30; 
        };

        nextBtn.addEventListener('click', () => { track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }); });
        prevBtn.addEventListener('click', () => { track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }); });

        let autoplayInterval = setInterval(autoScroll, 3000);
        function autoScroll() {
            if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            }
        }

        track.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
        track.addEventListener('mouseleave', () => { autoplayInterval = setInterval(autoScroll, 3000); });
    }
}

const sectionsDark = document.querySelectorAll('.section-dark');
const moverEstrelas = (e) => {
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;

    sectionsDark.forEach(section => {
        section.style.setProperty('--x', `${x * 30}px`);
        section.style.setProperty('--y', `${y * 30}px`);
    });
};
document.addEventListener('mousemove', moverEstrelas);
document.addEventListener('touchmove', moverEstrelas, { passive: true });

const heroElement = document.getElementById('hero-typewriter');
const heroCursor = document.querySelector('.hero-cursor');
if (heroElement) {
    const textoHero = "MUDE A FORMA DE INTERAGIR COM O SEU PÚBLICO.";
    let i = 0;
    function digitarHero() {
        if (i < textoHero.length) {
            heroElement.textContent += textoHero.charAt(i);
            i++;
            setTimeout(digitarHero, 50);
        } else if (heroCursor) {
            heroCursor.style.animation = "blinkTextCursor 0.8s infinite normal";
        }
    }
    setTimeout(digitarHero, 600);
}

const typewriterElement = document.getElementById('typewriter-text');
if (typewriterElement) {
    const palavras = ["QUEM SOMOS", "NOSSA HISTÓRIA", "SOMOS A GENIUS HUB", "CÓDIGO E IMERSÃO"];
    let palavraIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
        const currentPalavra = palavras[palavraIndex];
        if (isDeleting) {
            typewriterElement.textContent = currentPalavra.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterElement.textContent = currentPalavra.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === currentPalavra.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            palavraIndex = (palavraIndex + 1) % palavras.length;
            typeSpeed = 500;
        }
        setTimeout(typeWriter, typeSpeed);
    }
    setTimeout(typeWriter, 1000);
}

const tituloFujao = document.getElementById('titulo-fujao');
if (tituloFujao) {
    const fugir = () => {
        const moveX = (Math.random() - 0.5) * 400; 
        const moveY = (Math.random() - 0.5) * 150;
        const rotacao = (Math.random() - 0.5) * 15;
        tituloFujao.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1) rotate(${rotacao}deg)`;
        tituloFujao.style.color = "var(--btn-dark)";
    };
    tituloFujao.addEventListener('mouseenter', fugir);
    tituloFujao.addEventListener('touchstart', fugir, { passive: true });

    const casesSection = document.getElementById('cases');
    if (casesSection) {
        casesSection.addEventListener('mouseleave', () => {
            tituloFujao.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
            tituloFujao.style.color = "var(--text-dark)";
        });
    }
}

const tituloSolucoes = document.getElementById('titulo-solucoes');
const letrasAleatorias = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>";
if (tituloSolucoes) {
    let intervalo = null;
    const embaralhar = (evento) => {
        let iteracao = 0;
        const textoOriginal = evento.target.dataset.valor;
        clearInterval(intervalo);

        intervalo = setInterval(() => {
            evento.target.innerText = textoOriginal
                .split("")
                .map((letra, index) => {
                    if (index < iteracao) return textoOriginal[index];
                    return letrasAleatorias[Math.floor(Math.random() * letrasAleatorias.length)];
                })
                .join("");

            if (iteracao >= textoOriginal.length) clearInterval(intervalo);
            iteracao += 1 / 3; 
        }, 40);
    };
    tituloSolucoes.addEventListener('mouseover', embaralhar);
    tituloSolucoes.addEventListener('touchstart', embaralhar, { passive: true });
}

// ==========================================
// MENU MOBILE (HAMBÚRGUER LOGIC)
// ==========================================
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenu && navMenu) {
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('is-active');
        navMenu.classList.toggle('active');
    });

    const navLinksArray = document.querySelectorAll('.nav-links li a');
    navLinksArray.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('is-active');
            navMenu.classList.remove('active');
        });
    });
}