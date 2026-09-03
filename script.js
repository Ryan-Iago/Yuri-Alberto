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

// --- ESTADO DO MINIMAPA (GRADE 3x3 = 9 SALAS) ---
let salas = [];
let posicaoJogador = 0; // Começa na sala 0 (Canto Superior Esquerdo)
let salaEscada = 8;     // Escada no canto inferior direito

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
    
    // Atualiza a interface
    document.getElementById('hero-title').textContent = dados.nome;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    gerarMapaAndar();
    atualizarStats();
    adicionarLog(`🛡️ Você entrou na masmorra como <b>${dados.nome}</b>. Que as sombras tenham piedade...`);
}

// --- 2. SISTEMA DE MINIMAPA E EXPLORAÇÃO ---
function gerarMapaAndar() {
    salas = Array(9).fill().map(() => ({ visitada: false, comInimigo: Math.random() > 0.35 }));
    
    // A primeira sala nunca tem inimigo
    salas[0].comInimigo = false;
    salas[0].visitada = true;
    
    posicaoJogador = 0;
    // A escada fica na última sala (índice 8)
    salaEscada = 8;
    salas[salaEscada].comInimigo = true; // Guardião da escada

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

function avancar() {
    if (emCombate) {
        adicionarLog("Você não pode avançar enquanto estiver em combate!");
        return;
    }

    if (posicaoJogador >= 8) {
        adicionarLog("Você já explorou até o fim deste andar! Procure a escada abaixo.");
        return;
    }

    // Avança para a próxima sala na grade
    posicaoJogador++;
    salas[posicaoJogador].visitada = true;

    // Reduz luz baseado na classe
    luz = Math.max(0, luz - heroiAtual.consumoLuz);

    // Luz baixa aumenta o estresse
    if (luz < 30) {
        const estresseGanho = Math.round(15 * heroiAtual.resistEstresse);
        estresse += estresseGanho;
        adicionarLog(`A escuridão sufocante aumenta seu estresse (+${estresseGanho})!`);
    }

    // Checa se há combate na nova sala
    if (salas[posicaoJogador].comInimigo) {
        iniciarCombate();
    } else {
        adicionarLog("Você entra em uma sala fria e silenciosa... Parece segura.");
    }

    // Se chegou na sala da escada e não há combate
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
    luz = 100; // Recupera tocha ao mudar de andar
    document.getElementById('floor-num').textContent = andarAtual;
    adicionarLog(`🏰 <b>Você desceu para o Andar ${andarAtual}! Os monstros aqui são mais perigosos...</b>`);
    gerarMapaAndar();
    atualizarStats();
}

// --- 3. SISTEMA DE COMBATE ---
function iniciarCombate() {
    emCombate = true;
    
    // Inimigos ficam mais fortes conforme o andar aumenta
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

function atacar() {
    if (!emCombate) {
        adicionarLog("Não há nenhum inimigo nesta sala. Continue explorando!");
        return;
    }

    // Dano baseado no nível e na classe
    const danoBase = heroiAtual.danoBase + (nivel * 3);
    const dano = Math.floor(Math.random() * 8) + danoBase;
    
    enemyHp -= dano;
    adicionarLog(`Você usou ${heroiAtual.habilidadeEspecial} no ${enemyName} causando <b>${dano}</b> de dano.`);

    // Habilidade especial do Ocultista (cura um pouco ao atacar)
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
    if (!emCombate) {
        estresse = Math.max(0, estresse - 15);
        adicionarLog("Você respira fundo na calma da sala (-15 Estresse).");
    } else {
        estresse = Math.max(0, estresse - 20);
        adicionarLog("Você mantém a calma mesmo sob pressão (-20 Estresse).");
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
    // Inimigos no andar mais profundo causam mais dano
    const danoInimigo = Math.floor(Math.random() * 10) + 5 + (andarAtual * 2);
    const estresseInimigo = Math.round((Math.floor(Math.random() * 8) + 5) * heroiAtual.resistEstresse);

    hp -= danoInimigo;
    estresse += estresseInimigo;

    adicionarLog(`💥 O ${enemyName} atacou! Você sofreu <b>${danoInimigo}</b> de dano e +<b>${estresseInimigo}</b> de estresse!`);
}

// --- 4. PROGRESSÃO DE NÍVEL E STATUS ---
function ganharXP(qtd) {
    xp += qtd;
    adicionarLog(`✨ Você ganhou <b>${qtd} XP</b>.`);

    if (xp >= xpNecessario) {
        nivel++;
        xp -= xpNecessario;
        xpNecessario = Math.round(xpNecessario * 1.5);

        // Aumenta vida máxima e recupera vida
        maxHp += 20;
        hp = maxHp;

        adicionarLog(`🌟 <b>LEVEL UP! Você alcançou o Nível ${nivel}!</b> Sua vida foi restaurada e seus atributos aumentaram!`);
    }
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

    // Condições de Derrota
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
