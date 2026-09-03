// --- DADOS DAS CLASSES DE HERÓIS ---
const classesHerois = {
    guerreiro: {
        nome: "Guerreiro",
        hpMax: 120,
        danoBase: 12,
        resistEstresse: 0.8, // Toma 20% a menos de estresse
        consumoLuz: 15,
        habilidadeEspecial: "Soco de Escudo"
    },
    ladrao: {
        nome: "Ladrão",
        hpMax: 85,
        danoBase: 16,
        resistEstresse: 1.0,
        consumoLuz: 10, // Consome menos luz
        habilidadeEspecial: "Golpe Baixo"
    },
    ocultista: {
        nome: "Ocultista",
        hpMax: 90,
        danoBase: 14,
        resistEstresse: 1.2, // Toma 20% a mais de estresse
        consumoLuz: 15,
        habilidadeEspecial: "Drenar Alma"
    }
};

// --- BANCO DE DADOS DE TRAITS (TRAÇOS) ---
const listaTraits = [
    {
        id: "casca_dura",
        nome: "🛡️ Casca Dura",
        desc: "+20 de HP Máximo imediatamente.",
        tipo: "positivo",
        aplicar: () => { maxHp += 20; hp += 20; }
    },
    {
        id: "mente_inabalavel",
        nome: "🧠 Mente Inabalável",
        desc: "Reduz todo o estresse recebido em 25%.",
        tipo: "positivo",
        modEstresse: 0.75
    },
    {
        id: "sanguinario",
        nome: "⚔️ Sanguinário",
        desc: "+5 de dano extra em todos os ataques.",
        tipo: "positivo",
        modDano: 5
    },
    {
        id: "visao_noturna",
        nome: "👁️ Visão Noturna",
        desc: "Reduz o consumo de Luz ao explorar em 5.",
        tipo: "positivo",
        modLuz: -5
    },
    {
        id: "medico_de_campo",
        nome: "🧪 Meditação Profunda",
        desc: "Ação 'Acalmar a Mente' remove 10 de estresse a mais.",
        tipo: "positivo",
        modCalma: 10
    },
    {
        id: "claustrofobia",
        nome: "⛓️ Claustrofobia",
        desc: "+4 de dano bônus, mas ganha +20% de estresse.",
        tipo: "negativo",
        modDano: 4,
        modEstresse: 1.20
    }
];

// --- ESTADO DO JOGO ---
let heroiAtual = null;
let hp = 100;
let maxHp = 100;
let estresse = 0;
let luz = 100;
let nivel = 1;
let xp = 0;
let xpNecessario = 50;
let andarAtual = 1;

// Lista de Traits ativos no herói
let traitsAdquiridos = [];

// --- ESTADO DO MINIMAPA (GRADE 3x3 = 9 SALAS) ---
let salas = [];
let posicaoJogador = 0; // Começa na sala 0
let salaEscada = 8;     // Escada na última sala

// --- ESTADO DO COMBATE ---
let emCombate = false;
let enemyHp = 0;
let enemyMaxHp = 0;
let enemyName = "";
let enemyXpRecompensa = 0;

const logEl = document.getElementById('log');

// --- 1. SELEÇÃO DE PERSONAGEM ---
function selecionarHeroi(tipoClasse) {
    const dados = classesHerois[tipoClasse];
    heroiAtual = { ...dados, tipo: tipoClasse };
    
    maxHp = dados.hpMax;
    hp = maxHp;
    traitsAdquiridos = [];
    
    // Atualiza a interface
    document.getElementById('hero-title').textContent = dados.nome;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    gerarMapaAndar();
    atualizarStats();
    atualizarPainelTraits();
    adicionarLog(`🛡️ Você entrou na masmorra como <b>${dados.nome}</b>. Que as sombras tenham piedade...`);
}

// --- 2. SISTEMA DE MINIMAPA E EXPLORAÇÃO ---
function gerarMapaAndar() {
    salas = Array(9).fill().map(() => ({ visitada: false, comInimigo: Math.random() > 0.35 }));
    
    salas[0].comInimigo = false;
    salas[0].visitada = true;
    
    posicaoJogador = 0;
    salaEscada = 8;
    salas[salaEscada].comInimigo = true;

    document.getElementById('next-floor-box').classList.add('hidden');
    renderizarMinimapa();
}

function renderizarMinimapa() {
    const gridEl = document.getElementById('minimap');
    gridEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const celula = document.createElement('div');
        celula.className = 'map-cell';

        if (i === posicaoJogador) {
            celula.classList.add('current');
            celula.textContent = '👤';
        } else if (i === salaEscada && salas[i].visitada) {
            celula.classList.add('stairs');
            celula.textContent = '🪜';
        } else if (salas[i].visitada) {
            celula.classList.add('visited');
            celula.textContent = '•';
        } else {
            celula.textContent = '?';
        }

        gridEl.appendChild(celula);
    }
}

function calcularConsumoLuz() {
    let consumo = heroiAtual.consumoLuz;
    traitsAdquiridos.forEach(t => {
        if (t.modLuz) consumo += t.modLuz;
    });
    return Math.max(5, consumo);
}

function avancar() {
    if (emCombate) {
        adicionarLog("Você não pode avançar enquanto estiver em combate!");
        return;
    }

    if (posicaoJogador >= 8) {
        adicionarLog("Você já explorou até o fim deste andar! Procure a escada abaixo.");
        return;
    }

    posicaoJogador++;
    salas[posicaoJogador].visitada = true;

    // Reduz luz considerando traços
    luz = Math.max(0, luz - calcularConsumoLuz());

    // Luz baixa aumenta estresse
    if (luz < 30) {
        const estresseGanho = Math.round(15 * calcularMultiplicadorEstresse());
        estresse += estresseGanho;
        adicionarLog(`A escuridão sufocante aumenta seu estresse (+${estresseGanho})!`);
    }

    if (salas[posicaoJogador].comInimigo) {
        iniciarCombate();
    } else {
        adicionarLog("Você entra em uma sala fria e silenciosa... Parece segura.");
    }

    if (posicaoJogador === salaEscada && !emCombate) {
        revelarEscada();
    }

    renderizarMinimapa();
    atualizarStats();
}

function revelarEscada() {
    adicionarLog("🪜 <b>Você encontrou uma escada de pedra liderando para as profundezas!</b>");
    document.getElementById('next-floor-box').classList.remove('hidden');
}

function descenderAndar() {
    andarAtual++;
    luz = 100;
    document.getElementById('floor-num').textContent = andarAtual;
    adicionarLog(`🏰 <b>Você desceu para o Andar ${andarAtual}! Os monstros aqui são mais perigosos...</b>`);
    gerarMapaAndar();
    atualizarStats();
}

// --- 3. SISTEMA DE COMBATE ---
function iniciarCombate() {
    emCombate = true;
    
    const multiplicadorStats = 1 + (andarAtual - 1) * 0.3;

    const listaInimigos = [
        { nome: "Cultista Sombrio", hp: Math.round(35 * multiplicadorStats), xp: 25 },
        { nome: "Aberração Tenebrosa", hp: Math.round(55 * multiplicadorStats), xp: 40 },
        { nome: "Esqueleto Guardião", hp: Math.round(40 * multiplicadorStats), xp: 30 }
    ];

    const escolhido = listaInimigos[Math.floor(Math.random() * listaInimigos.length)];
    enemyName = escolhido.nome;
    enemyHp = escolhido.hp;
    enemyMaxHp = escolhido.hp;
    enemyXpRecompensa = escolhido.xp;

    document.getElementById('enemy-name').textContent = enemyName;
    document.getElementById('enemy-hp').textContent = enemyHp;
    document.getElementById('enemy-max-hp').textContent = enemyMaxHp;

    adicionarLog(`⚔️ Um <b>${enemyName}</b> surge do escuro para atacar!`);
}

function calcularDanoHeroi() {
    let danoBase = heroiAtual.danoBase + (nivel * 3);
    traitsAdquiridos.forEach(t => {
        if (t.modDano) danoBase += t.modDano;
    });
    return Math.floor(Math.random() * 8) + danoBase;
}

function calcularMultiplicadorEstresse() {
    let mult = heroiAtual.resistEstresse;
    traitsAdquiridos.forEach(t => {
        if (t.modEstresse) mult *= t.modEstresse;
    });
    return mult;
}

function atacar() {
    if (!emCombate) {
        adicionarLog("Não há nenhum inimigo nesta sala. Continue explorando!");
        return;
    }

    const dano = calcularDanoHeroi();
    
    enemyHp -= dano;
    adicionarLog(`Você usou ${heroiAtual.habilidadeEspecial} no ${enemyName} causando <b>${dano}</b> de dano.`);

    if (heroiAtual.tipo === 'ocultista' && enemyHp > 0) {
        const cura = 5;
        hp = Math.min(maxHp, hp + cura);
        adicionarLog(`🔮 Sua magia drenou a essência do inimigo (+${cura} HP).`);
    }

    if (enemyHp <= 0) {
        enemyHp = 0;
        adicionarLog(`🎉 Você derrotou o <b>${enemyName}</b>!`);
        emCombate = false;
        salas[posicaoJogador].comInimigo = false;

        document.getElementById('enemy-name').textContent = "Nenhum";
        ganharXP(enemyXpRecompensa);

        if (posicaoJogador === salaEscada) {
            revelarEscada();
        }
    } else {
        turnoInimigo();
    }

    atualizarStats();
}

function defender() {
    let alivioExtra = 0;
    traitsAdquiridos.forEach(t => {
        if (t.modCalma) alivioExtra += t.modCalma;
    });

    if (!emCombate) {
        const total = 15 + alivioExtra;
        estresse = Math.max(0, estresse - total);
        adicionarLog(`Você respira fundo na calma da sala (-${total} Estresse).`);
    } else {
        const total = 20 + alivioExtra;
        estresse = Math.max(0, estresse - total);
        adicionarLog(`Você mantém a calma mesmo sob pressão (-${total} Estresse).`);
        turnoInimigo();
    }
    atualizarStats();
}

function usarTocha() {
    luz = Math.min(100, luz + 40);
    adicionarLog("Você reacendeu a tocha. A escuridão recua (+40% Luz).");
    atualizarStats();
}

function turnoInimigo() {
    const danoInimigo = Math.floor(Math.random() * 10) + 5 + (andarAtual * 2);
    const estresseInimigo = Math.round((Math.floor(Math.random() * 8) + 5) * calcularMultiplicadorEstresse());

    hp -= danoInimigo;
    estresse += estresseInimigo;

    adicionarLog(`💥 O ${enemyName} atacou! Você sofreu <b>${danoInimigo}</b> de dano e +<b>${estresseInimigo}</b> de estresse!`);
}

// --- 4. PROGRESSÃO, TRAITS E STATUS ---
function ganharXP(qtd) {
    xp += qtd;
    adicionarLog(`✨ Você ganhou <b>${qtd} XP</b>.`);

    if (xp >= xpNecessario) {
        nivel++;
        xp -= xpNecessario;
        xpNecessario = Math.round(xpNecessario * 1.5);

        maxHp += 20;
        hp = maxHp;

        adicionarLog(`🌟 <b>LEVEL UP! Você alcançou o Nível ${nivel}!</b> Sua vida foi restaurada e seus atributos aumentaram!`);

        // Checa se é um nível par para liberar Traço
        if (nivel % 2 === 0) {
            abrirModalTraits();
        }
    }
}

function abrirModalTraits() {
    const modal = document.getElementById('trait-modal');
    const container = document.getElementById('trait-options');
    container.innerHTML = '';

    // Filtra traços que o herói ainda não possui
    const disponiveis = listaTraits.filter(t => !traitsAdquiridos.some(adq => adq.id === t.id));

    if (disponiveis.length === 0) return;

    // Sorteia até 3 opções aleatórias
    const embaralhados = [...disponiveis].sort(() => 0.5 - Math.random());
    const opcoes = embaralhados.slice(0, 3);

    opcoes.forEach(trait => {
        const card = document.createElement('div');
        card.className = 'trait-card';
        card.innerHTML = `
            <h4>${trait.nome}</h4>
            <p>${trait.desc}</p>
        `;
        card.onclick = () => escolherTrait(trait);
        container.appendChild(card);
    });

    modal.classList.remove('hidden');
}

function escolherTrait(trait) {
    traitsAdquiridos.push(trait);

    if (trait.aplicar) {
        trait.aplicar();
    }

    adicionarLog(`🧬 Você adquiriu o traço: <b>${trait.nome}</b>!`);
    document.getElementById('trait-modal').classList.add('hidden');
    
    atualizarPainelTraits();
    atualizarStats();
}

function atualizarPainelTraits() {
    const container = document.getElementById('traits-list');
    container.innerHTML = '';

    if (traitsAdquiridos.length === 0) {
        container.innerHTML = '<span class="no-traits">Nenhum traço ativo</span>';
        return;
    }

    traitsAdquiridos.forEach(t => {
        const badge = document.createElement('span');
        badge.className = `trait-badge ${t.tipo === 'negativo' ? 'negative' : ''}`;
        badge.textContent = t.nome;
        badge.title = t.desc;
        container.appendChild(badge);
    });
}

function atualizarStats() {
    document.getElementById('hp').textContent = hp;
    document.getElementById('max-hp').textContent = maxHp;
    document.getElementById('estresse').textContent = estresse;
    document.getElementById('luz').textContent = luz;
    document.getElementById('hero-level').textContent = nivel;
    document.getElementById('hero-xp').textContent = xp;
    document.getElementById('xp-next').textContent = xpNecessario;

    if (enemyMaxHp > 0) {
        document.getElementById('enemy-hp').textContent = enemyHp;
    }

    if (estresse >= 100) {
        adicionarLog("⚠️ <b>Seu herói enlouqueceu completamente pelo estresse da escuridão! Fim de jogo.</b>");
        encerrarJogo();
    } else if (hp <= 0) {
        hp = 0;
        adicionarLog("💀 <b>Seu herói sucumbiu aos ferimentos nas profundezas... Fim de jogo.</b>");
        encerrarJogo();
    }
}

function adicionarLog(texto) {
    logEl.innerHTML += `<p>${texto}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function encerrarJogo() {
    document.getElementById('actions').innerHTML = `
        <button class="btn btn-avancar" onclick="location.reload()">🔄 Tentar Novamente</button>
    `;
    document.getElementById('next-floor-box').classList.add('hidden');
}
