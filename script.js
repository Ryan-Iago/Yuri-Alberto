// Estado do Jogador
let hp = 100;
let estresse = 0;
let luz = 100;

// Estado do Inimigo
let emCombate = false;
let enemyHp = 0;
let enemyMaxHp = 0;
let enemyName = "";

const logEl = document.getElementById('log');

function adicionarLog(texto) {
    logEl.innerHTML += `<p>${texto}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function atualizarStats() {
    document.getElementById('hp').textContent = hp;
    document.getElementById('estresse').textContent = estresse;
    document.getElementById('luz').textContent = luz;
    
    if (enemyMaxHp > 0) {
        document.getElementById('enemy-hp').textContent = enemyHp;
    }

    if (estresse >= 100) {
        adicionarLog("⚠️ <b>Seu herói sucumbiu à loucura pelo estresse! Fim de jogo.</b>");
        encerrarJogo();
    }
    if (hp <= 0) {
        adicionarLog("💀 <b>Seu herói foi derrotado nas sombras... Fim de jogo.</b>");
        encerrarJogo();
    }
}

function avancar() {
    if (emCombate) {
        adicionarLog("Você não pode avançar enquanto estiver em combate!");
        return;
    }

    // Reduz a luz a cada passo
    luz = Math.max(0, luz - 15);
    
    // Quanto menor a luz, mais estresse o jogador ganha
    if (luz < 30) {
        estresse += 15;
        adicionarLog("A escuridão sufocante aumenta seu estresse!");
    }

    // Chance de encontrar inimigo
    const sorteio = Math.random();
    if (sorteio > 0.3) {
        iniciarCombate();
    } else {
        adicionarLog("Você caminha pelos corredores frios... Nada além de silêncio.");
    }
    
    atualizarStats();
}

function iniciarCombate() {
    emCombate = true;
    const inimigos = [
        { nome: "Cultista Sombrio", hp: 35 },
        { nome: "Aberração Tenebrosa", hp: 50 },
        { nome: "Esqueleto Antigo", hp: 30 }
    ];
    
    const escolhido = inimigos[Math.floor(Math.random() * inimigos.length)];
    enemyName = escolhido.nome;
    enemyHp = escolhido.hp;
    enemyMaxHp = escolhido.hp;

    document.getElementById('enemy-name').textContent = enemyName;
    document.getElementById('enemy-hp').textContent = enemyHp;
    adicionarLog(`⚔️ Um <b>${enemyName}</b> surge da escuridão!`);
}

function atacar() {
    if (!emCombate) {
        adicionarLog("Não há nada para atacar. Avance na masmorra!");
        return;
    }

    // Ataque do jogador
    const dano = Math.floor(Math.random() * 15) + 10;
    enemyHp -= dano;
    adicionarLog(`Você golpeou o ${enemyName} causando ${dano} de dano.`);

    if (enemyHp <= 0) {
        enemyHp = 0;
        adicionarLog(`🎉 Você derrotou o ${enemyName}!`);
        emCombate = false;
        document.getElementById('enemy-name').textContent = "Nenhum";
    } else {
        turnoInimigo();
    }

    atualizarStats();
}

function defender() {
    if (!emCombate) {
        // Reduz estresse fora de combate
        estresse = Math.max(0, estresse - 10);
        adicionarLog("Você respira fundo e ganha um pouco de clareza mental (-10 Estresse).");
    } else {
        estresse = Math.max(0, estresse - 15);
        adicionarLog("Você se foca e ignora o medo (-15 Estresse).");
        turnoInimigo();
    }
    atualizarStats();
}

function usarTocha() {
    luz = Math.min(100, luz + 40);
    adicionarLog("Você acende uma tocha. A luz afasta as sombras (+40% Luz).");
    atualizarStats();
}

function turnoInimigo() {
    // Ataque do inimigo causa dano e estresse
    const danoInimigo = Math.floor(Math.random() * 12) + 5;
    const estresseInimigo = Math.floor(Math.random() * 10) + 5;

    hp -= danoInimigo;
    estresse += estresseInimigo;

    adicionarLog(` O ${enemyName} ataca! Caverna ${danoInimigo} de dano e +${estresseInimigo} de estresse!`);
}

function encerrarJogo() {
    document.getElementById('actions').innerHTML = `<button class="btn btn-avancar" onclick="location.reload()">Recomeçar</button>`;
}
