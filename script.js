// --- DADOS DAS CLASSES DE HERÓI ---
const CLASSES = {
    guerreiro: {
        nome: "Guerreiro",
        hpMax: 120,
        danoMin: 12,
        danoMax: 20,
        res_estresse: 0.8, // Toma 20% a menos de estresse
        consumo_luz: 15,
        habilidade: "Golpe Pesado"
    },
    ladrao: {
        nome: "Ladrão",
        hpMax: 85,
        danoMin: 15,
        danoMax: 28,
        res_estresse: 1.0,
        consumo_luz: 10, // Consome menos luz
        habilidade: "Ataque Furtivo"
    },
    ocultista: {
        nome: "Ocultista",
        hpMax: 90,
        danoMin: 10,
        danoMax: 18,
        res_estresse: 1.2, // Toma 20% a mais de estresse
        consumo_luz: 15,
        habilidade: "Cura Sombria"
    }
};

// --- ESTADO DO JOGO ---
let heroi = null;
let hp = 100;
let maxHp = 100;
let estresse = 0;
let luz = 100;

let nivel = 1;
let xp = 0;
let xpParaProximoNivel = 50;
let andar = 1;

// --- ESTADO DO COMBATE ---
let emCombate = false;
let enemyHp = 0;
let enemyMaxHp = 0;
let enemyName = "";
let enemyDanoBase = 10;

// --- ESTADO DO MINIMAPA (3x3 = 9 salas) ---
let salaAtual = 0; // Índice de 0 a 8
let salaEscada = 8; // A última sala sempre tem a escada
let salasVisitadas = [0];

const logEl = document.getElementById('log');

// --- 1. INICIALIZAÇÃO E SELEÇÃO DE HERÓI ---
function selecionarHeroi(classeChave) {
    const dadosClasse = CLASSES[classeChave];
    heroi = { ...dadosClasse, chave: classeChave };
    
    hp = heroi.hpMax;
    maxHp = heroi.hpMax;
    
    document.getElementById('hero-title').textContent = heroi.nome;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    adicionarLog(`Você adentrou a penumbra como um <b>${heroi.nome}</b>. Boa sorte...`);
    gerarMapa();
    atualizarStats();
}

// --- 2. SISTEMA DE MINIMAPA ---
function gerarMapa() {
    const minimapEl = document.getElementById('minimap');
    minimapEl.innerHTML = '';
    
    // Sortear a escada para uma sala distante (de 4 a 8)
    salaEscada = Math.floor(Math.random() * 5) + 4; 
    salasVisitadas = [0];
    salaAtual = 0;
    
    renderizarMapa();
}

function renderizarMapa() {
    const minimapEl = document.getElementById('minimap');
    minimapEl.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        
        if (i === salaAtual) {
            cell.classList.add('current');
            cell.textContent = '👾';
        } else if (i === salaEscada && salasVisitadas.includes(i)) {
            cell.classList.add('stairs');
            cell.textContent = '🪜';
        } else if (salasVisitadas.includes(i)) {
            cell.classList.add('visited');
            cell.textContent = '✓';
        } else {
            cell.textContent = '?';
        }
        
        minimapEl.appendChild(cell);
    }
}

// --- 3. ATUALIZAÇÃO DA INTERFACE ---
function adicionarLog(texto) {
    logEl.innerHTML += `<p>${texto}</
