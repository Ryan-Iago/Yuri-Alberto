// --- DADOS DAS CLASSES DE HERÓIS ---
const classesHerois = {
    guerreiro: {
        nome: "Guerreiro",
        hpMax: 120,
        danoBase: 12,
        resistEstresse: 0.8,
        consumoLuz: 15,
        habilidadeEspecial: "Soco de Escudo",
        sprite: "⚔️"
    },
    ladrao: {
        nome: "Ladrão",
        hpMax: 85,
        danoBase: 16,
        resistEstresse: 1.0,
        consumoLuz: 10,
        habilidadeEspecial: "Golpe Baixo",
        sprite: "🗡️"
    },
    ocultista: {
        nome: "Ocultista",
        hpMax: 90,
        danoBase: 14,
        resistEstresse: 1.2,
        consumoLuz: 15,
        habilidadeEspecial: "Drenar Alma",
        sprite: "🔮"
    }
};

// --- ITENS DA LOJA (MERCADO) ---
const itensLoja = [
    { id: "pocao", nome: "🧪 Poção de Cura", preco: 25, desc: "Recupera 35 HP" },
    { id: "tocha", nome: "🕯️ Tocha", preco: 15, desc: "Aumenta 40% de Luz" }
];

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
let ouro = 50;
let nivel = 1;
let xp = 0;
let xpNecessario = 50;
let andarAtual = 1;

// Inventário do Herói
let inventario = {
    pocaodeCura: 2,
    tocha: 3
};

// Lista de Traits ativos no herói
let traitsAdquiridos = [];

// --- ESTADO DO MINIMAPA (GRADE 3x3 = 9 SALAS) ---
let salas = [];
let posicaoJogador = 0;
let salaEscada = 8;
let salaLoja = -1;

// --- ESTADO DO COMBATE ---
let emCombate = false;
let enemyHp = 0;
let enemyMaxHp = 0;
let enemyName = "";
let enemySprite = "";
let enemyXpRecompensa = 0;
let enemyOuroRecompensa = 0;

const logEl = document.getElementById('log');

// --- 1. SELEÇÃO DE PERSONAGEM ---
function selecionarHeroi(tipoClasse) {
    const dados = classesHerois[tipoClasse];
    heroiAtual = { ...dados, tipo: tipoClasse };
    
    maxHp = dados.hpMax;
    hp = maxHp;
    traitsAdquiridos = [];
    ouro = 50;
    inventario = { pocaodeCura: 2, tocha: 3 };
    
    // Atualiza a interface
    const heroTitleEl = document.getElementById('hud-hero-name');
    if (heroTitleEl) heroTitleEl.textContent = dados.nome;
    
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    gerarMapaAndar();
    atualizarStats();
    atualizarInventarioUI();
    atualizarPainelTraits();
    adicionarLog(`🛡️ Você entrou na masmorra como <b>${dados.nome}</b>. Que as sombras tenham piedade...`);
}

// --- 2. SISTEMA DE MINIMAPA E EXPLORAÇÃO ---
function gerarMapaAndar() {
    salas = Array(9).fill().map(() => ({ 
        visitada: false, 
        comInimigo: Math.random() > 0.35,
        ehLoja: false
    }));
    
    salas[0].comInimigo = false;
    salas[0].visitada = true;
    
    posicaoJogador = 0;
    salaEscada = 8;
    salas[salaEscada].comInimigo = true;

    salaLoja = Math.floor(Math.random() * 5) + 2;
    salas[salaLoja].comInimigo = false;
    salas[salaLoja].ehLoja = true;

    const nextFloorBox = document.getElementById('next-floor-box');
    if (nextFloorBox) nextFloorBox.classList.add('hidden');
    
    esconderInimigoCorredor();
    renderizarMinimapa();
}

function renderizarMinimapa() {
    const gridEl = document.getElementById('minimap');
    if (!gridEl) return;
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
        } else if (salas[i].ehLoja && salas[i].visitada) {
            celula.classList.add('shop');
            celula.textContent = '🍺';
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

    luz = Math.max(0, luz - calcularConsumoLuz());

    if (luz < 30) {
        const estresseGanho = Math.round(15 * calcularMultiplicadorEstresse());
        estresse += estresseGanho;
        adicionarLog(`A escuridão sufocante aumenta seu estresse (+${estresseGanho})!`);
    }

    if (salas[posicaoJogador].comInimigo) {
        iniciarCombate();
    } else if (salas[posicaoJogador].ehLoja) {
        adicionarLog("🍺 Você encontrou a Taverna & Mercado das Sombras!");
        abrirLoja();
    } else {
        esconderInimigoCorredor();
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
    const nextFloorBox = document.getElementById('next-floor-box');
    if (nextFloorBox) nextFloorBox.classList.remove('hidden');
}

function descenderAndar() {
    andarAtual++;
    luz = 100;
    const floorNumEl = document.getElementById('floor-num');
    if (floorNumEl) floorNumEl.textContent = andarAtual;
    adicionarLog(`🏰 <b>Você desceu para o Andar ${andarAtual}! Os monstros aqui são mais perigosos...</b>`);
    gerarMapaAndar();
    atualizarStats();
}

// --- 3. SISTEMA DE COMBATE E CORREDOR VISUAL ---
function iniciarCombate() {
    emCombate = true;
    
    const multiplicadorStats = 1 + (andarAtual - 1) * 0.3;

    const listaInimigos = [
        { nome: "Cultista Sombrio", hp: Math.round(35 * multiplicadorStats), xp: 25, ouro: 15, sprite: "🧙‍♂️" },
        { nome: "Aberração Tenebrosa", hp: Math.round(55 * multiplicadorStats), xp: 40, ouro: 25, sprite: "👾" },
        { nome: "Esqueleto Guardião", hp: Math.round(40 * multiplicadorStats), xp: 30, ouro: 20, sprite: "💀" }
    ];

    const escolhido = listaInimigos[Math.floor(Math.random() * listaInimigos.length)];
    enemyName = escolhido.nome;
    enemyHp = escolhido.hp;
    enemyMaxHp = escolhido.hp;
    enemyXpRecompensa = escolhido.xp;
    enemyOuroRecompensa = escolhido.ouro;
    enemySprite = escolhido.sprite;

    exibirInimigoCorredor();
    adicionarLog(`⚔️ Um <b>${enemyName}</b> surge do escuro para atacar!`);
}

function exibirInimigoCorredor() {
    const enemySilh = document.getElementById('enemy-silhouette');
    const enemyInfo = document.getElementById('hud-enemy-info');
    const enemySpriteEl = document.getElementById('enemy-sprite');

    if (enemySilh) enemySilh.classList.remove('hidden');
    if (enemyInfo) enemyInfo.classList.remove('hidden');
    if (enemySpriteEl) enemySpriteEl.textContent = enemySprite;

    const nameEl = document.getElementById('enemy-name');
    const hpEl = document.getElementById('enemy-hp');
    const maxHpEl = document.getElementById('enemy-max-hp');

    if (nameEl) nameEl.textContent = enemyName;
    if (hpEl) hpEl.textContent = enemyHp;
    if (maxHpEl) maxHpEl.textContent = enemyMaxHp;
}

function esconderInimigoCorredor() {
    const enemySilh = document.getElementById('enemy-silhouette');
    const enemyInfo = document.getElementById('hud-enemy-info');

    if (enemySilh) enemySilh.classList.add('hidden');
    if (enemyInfo) enemyInfo.classList.add('hidden');
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
        ouro += enemyOuroRecompensa;
        adicionarLog(`🎉 Você derrotou o <b>${enemyName}</b> e encontrou 🪙 <b>${enemyOuroRecompensa} de ouro</b>!`);
        
        emCombate = false;
        salas[posicaoJogador].comInimigo = false;

        esconderInimigoCorredor();
        ganharXP(enemyXpRecompensa);

        if (posicaoJogador === salaEscada) {
            revelarEscada();
        }
    } else {
        exibirInimigoCorredor();
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
    if (inventario.tocha <= 0) {
        adicionarLog("Você não possui tochas no seu inventário!");
        return;
    }
    inventario.tocha--;
    luz = Math.min(100, luz + 40);
    adicionarLog("🕯️ Você acendeu uma tocha. A escuridão recua (+40% Luz).");
    atualizarInventarioUI();
    atualizarStats();
}

function usarPocao() {
    if (inventario.pocaodeCura <= 0) {
        adicionarLog("Você não tem poções de cura!");
        return;
    }
    if (hp >= maxHp) {
        adicionarLog("Sua vida já está no máximo!");
        return;
    }
    inventario.pocaodeCura--;
    const cura = 35;
    hp = Math.min(maxHp, hp + cura);
    adicionarLog(`🧪 Você bebeu uma poção de cura e recuperou <b>${cura} HP</b>.`);
    atualizarInventarioUI();
    atualizarStats();
}

function turnoInimigo() {
    const danoInimigo = Math.floor(Math.random() * 10) + 5 + (andarAtual * 2);
    const estresseInimigo = Math.round((Math.floor(Math.random() * 8) + 5) * calcularMultiplicadorEstresse());

    hp -= danoInimigo;
    estresse += estresseInimigo;

    adicionarLog(`💥 O ${enemyName} atacou! Você sofreu <b>${danoInimigo}</b> de dano e +<b>${estresseInimigo}</b> de estresse!`);
}

// --- 4. TAVERNA / MERCADO DAS SOMBRAS ---
function abrirLoja() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
        renderizarItensLoja();
        alternarAbaLoja('comprar');
        modal.classList.remove('hidden');
    }
}

function fecharLoja() {
    const modal = document.getElementById('shop-modal');
    if (modal) modal.classList.add('hidden');
}

function alternarAbaLoja(aba) {
    const buySection = document.getElementById('shop-buy-section');
    const restSection = document.getElementById('shop-rest-section');
    const tabs = document.querySelectorAll('.shop-tab');

    tabs.forEach(tab => tab.classList.remove('active'));

    if (aba === 'comprar') {
        if (buySection) buySection.classList.remove('hidden');
        if (restSection) restSection.classList.add('hidden');
        if (tabs[0]) tabs[0].classList.add('active');
    } else {
        if (buySection) buySection.classList.add('hidden');
        if (restSection) restSection.classList.remove('hidden');
        if (tabs[1]) tabs[1].classList.add('active');
    }
}

function renderizarItensLoja() {
    const container = document.getElementById('shop-items-list');
    if (!container) return;

    container.innerHTML = '';
    itensLoja.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'shop-item-card';
        itemCard.innerHTML = `
            <h4>${item.nome} (${item.preco} Ouro)</h4>
            <p>${item.desc}</p>
            <button class="btn" onclick="comprarItem('${item.id}')">Comprar</button>
        `;
        container.appendChild(itemCard);
    });
}

function comprarItem(tipo) {
    if (tipo === 'pocao') {
        if (ouro >= 25) {
            ouro -= 25;
            inventario.pocaodeCura++;
            adicionarLog("🛒 Você comprou uma Poção de Cura.");
        } else {
            adicionarLog("Ouro insuficiente para comprar a Poção!");
        }
    } else if (tipo === 'tocha') {
        if (ouro >= 15) {
            ouro -= 15;
            inventario.tocha++;
            adicionarLog("🛒 Você comprou uma Tocha.");
        } else {
            adicionarLog("Ouro insuficiente para comprar a Tocha!");
        }
    }
    atualizarStats();
    atualizarInventarioUI();
}

function comprarDescanso(tipo) {
    if (tipo === 'bebida') {
        if (ouro >= 30) {
            ouro -= 30;
            estresse = Math.max(0, estresse - 30);
            adicionarLog("🍺 Você bebeu uma bebida quente. Sente-se renovado (-30 Estresse).");
        } else {
            adicionarLog("Ouro insuficiente para comprar uma bebida!");
        }
    } else if (tipo === 'pernoite') {
        if (ouro >= 50) {
            ouro -= 50;
            hp = maxHp;
            estresse = Math.max(0, estresse - 50);
            adicionarLog("🛏️ Você descansou por uma noite inteira (HP Restaurado, -50 Estresse).");
        } else {
            adicionarLog("Ouro insuficiente para o pernoite!");
        }
    }
    atualizarStats();
}

// --- 5. PROGRESSÃO E TRAITS ---
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

        if (nivel % 2 === 0) {
            abrirModalTraits();
        }
    }
}

function abrirModalTraits() {
    const modal = document.getElementById('trait-modal');
    const container = document.getElementById('trait-options');
    if (!modal || !container) return;
    
    container.innerHTML = '';

    const disponiveis = listaTraits.filter(t => !traitsAdquiridos.some(adq => adq.id === t.id));

    if (disponiveis.length === 0) return;

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
    const traitModal = document.getElementById('trait-modal');
    if (traitModal) traitModal.classList.add('hidden');
    
    atualizarPainelTraits();
    atualizarStats();
}

// --- 6. INTERFACE E ATUALIZADORES ---
function atualizarPainelTraits() {
    const container = document.getElementById('traits-list');
    if (!container) return;
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

function atualizarInventarioUI() {
    const container = document.getElementById('inventory-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="item-slot" onclick="usarPocao()">🧪 Poção (${inventario.pocaodeCura})</div>
        <div class="item-slot" onclick="usarTocha()">🕯️ Tocha (${inventario.tocha})</div>
    `;
}

function atualizarStats() {
    const setElem = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setElem('hp', hp);
    setElem('max-hp', maxHp);
    setElem('estresse', estresse);
    setElem('luz', luz);
    setElem('gold', ouro);
    setElem('hero-level', nivel);
    setElem('hero-xp', xp);
    setElem('xp-next', xpNecessario);

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
    if (!logEl) return;
    logEl.innerHTML += `<p>${texto}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function encerrarJogo() {
    const actionsPanel = document.getElementById('actions');
    if (actionsPanel) {
        actionsPanel.innerHTML = `
            <button class="btn btn-avancar" onclick="location.reload()">🔄 Tentar Novamente</button>
        `;
    }
    const nextFloorBox = document.getElementById('next-floor-box');
    if (nextFloorBox) nextFloorBox.classList.add('hidden');
}

// --- EXPOSIÇÃO GLOBAL DAS FUNÇÕES ---
window.selecionarHeroi = selecionarHeroi;
window.atacar = atacar;
window.defender = defender;
window.usarTocha = usarTocha;
window.usarPocao = usarPocao;
window.avancar = avancar;
window.descenderAndar = descenderAndar;
window.fecharLoja = fecharLoja;
window.alternarAbaLoja = alternarAbaLoja;
window.comprarItem = comprarItem;
window.comprarDescanso = comprarDescanso;
