/**
 * AUTO-PREENCHIMENTO DE COLETA TRIBAL WARS
 * Funcionalidades: Limite de 2h, Distribuição de Tropas e Ratios Inteligentes
 */
(async function() {
    console.clear();
    console.log("%c CALCULANDO E PREENCHENDO TROPAS... ", "background: #000; color: #0f0; font-weight: bold; padding: 6px;");

    // --- 1. CONFIGURAÇÕES ---
    const CONFIG = {
        BLACKLIST: ['knight', 'scout'], // Unidades que nunca serão usadas
        PRIORIDADE: ['axe', 'light', 'marcher', 'heavy', 'spear', 'sword'], // Ordem de uso
        RESERVA: { // Tropas para manter na aldeia
            "spear": 0, "sword": 0, "axe": 0, "archer": 0, "heavy": 0, "light": 0
        },
        CAPACIDADE_CARGA: {
            "spear": 25, "sword": 15, "axe": 10, "archer": 10,
            "light": 80, "marcher": 50, "heavy": 50, "knight": 100
        },
        TEMPO_MAXIMO: 7200 // 2 Horas em segundos
    };

    // --- 2. CONFIGURAÇÃO DO MUNDO (Fatores de Tempo) ---
    let worldConfig = { factor: 0.77, exponent: 0.55, initial: 1800 }; // Default
    try {
        if (window.ScavengeScreen && window.ScavengeScreen.village) {
            const base = window.ScavengeScreen.village.options[1].base;
            worldConfig = { factor: base.duration_factor, exponent: base.duration_exponent, initial: base.duration_initial_seconds };
        }
    } catch(e) { console.warn("Usando config padrão de mundo."); }

    // --- 3. LEITURA DE TROPAS E NÍVEIS ---
    const tropas = obterTropasDisponiveis(CONFIG);
    const niveis = analisarNiveisColeta();

    if (tropas.totalCapacidade === 0) { alert("Sem tropas disponíveis!"); return; }
    if (niveis.disponiveisParaEnvio.length === 0) { alert("Todas as coletas estão ocupadas ou bloqueadas."); return; }

    // --- 4. DECIDIR QUAL NÍVEL ENVIAR AGORA ---
    // A lógica seleciona o MAIOR nível desbloqueado e livre.
    // Ex: Se 4 está livre, prepara o 4. Se 4 está ocupado e 3 livre, prepara o 3.
    const nivelAlvo = niveis.disponiveisParaEnvio[niveis.disponiveisParaEnvio.length - 1]; // Pega o maior ID disponível
    
    // --- 5. DEFINIR RATIO (Proporção) ---
    // Calcula qual porcentagem das tropas atuais deve ir para este nível
    let ratio = calcularRatio(nivelAlvo.id, niveis.todosDesbloqueados, tropas.totalCapacidade);
    
    // --- 6. CÁLCULOS DE CAPACIDADE ---
    let capacidadePeloRatio = Math.floor(tropas.totalCapacidade * ratio);
    let capacidadePeloTempo = calcularCapacidadeParaTempo(CONFIG.TEMPO_MAXIMO, nivelAlvo.id, worldConfig);
    
    // Usa o menor valor (Respeita a proporção, mas corta se passar de 2h)
    let capacidadeFinal = Math.min(capacidadePeloRatio, capacidadePeloTempo);

    console.log(`> Nível Alvo: ${nivelAlvo.nome} (ID: ${nivelAlvo.id})`);
    console.log(`> Capacidade Total Atual: ${tropas.totalCapacidade.toLocaleString()}`);
    console.log(`> Ratio Aplicado: ${(ratio*100).toFixed(2)}% -> Alvo: ${capacidadePeloRatio.toLocaleString()}`);
    console.log(`> Teto de 2 Horas: ${capacidadePeloTempo.toLocaleString()}`);
    console.log(`> %cCAPACIDADE A ENVIAR: ${capacidadeFinal.toLocaleString()}`, "color: #0f0; font-weight: bold;");

    // --- 7. DISTRIBUIR E PREENCHER INPUTS ---
    limparInputs();
    let unidadesParaPreencher = alocarTropas(capacidadeFinal, tropas.estoque, CONFIG);
    
    await preencherInputs(unidadesParaPreencher);

    // Rola a tela até o botão de começar do nível certo
    nivelAlvo.elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Visual feedback
    nivelAlvo.elemento.style.border = "3px solid #0f0";
    console.log("%c TROPAS PREENCHIDAS! CLIQUE EM COMEÇAR.", "background: green; color: white; font-size: 14px; padding: 5px;");

})();

// =================================================================================
// LÓGICA DE NEGÓCIO
// =================================================================================

function calcularRatio(idAlvo, idsDesbloqueados, capacidadeTotal) {
    // idsDesbloqueados ex: [1, 2, 3, 4]
    
    // CASO 1: Apenas Coleta 1
    if (igual(idsDesbloqueados, [1])) return 1.0; 

    // CASO 2: Coletas 1 e 2 (Ignora 1, foca na 2)
    if (igual(idsDesbloqueados, [1, 2])) {
        return idAlvo === 2 ? 1.0 : 0; 
    }

    // CASO 3: Coletas 1, 2, 3 (Ratio /24)
    if (igual(idsDesbloqueados, [1, 2, 3])) {
        if (idAlvo === 3) return 3/24; // Grande
        if (idAlvo === 2) return 6/24; // Média
        if (idAlvo === 1) return 15/24; // Pequena
    }

    // CASO 4: Coletas 1, 2, 3, 4
    if (contem(idsDesbloqueados, [1, 2, 3, 4])) {
        // Regra de Capacidade
        if (capacidadeTotal > 15000) {
            // Full Power (/26)
            if (idAlvo === 4) return 2/26;
            if (idAlvo === 3) return 3/26;
            if (idAlvo === 2) return 6/26;
            if (idAlvo === 1) return 15/26;
        } else {
            // Econômica (<15k, ignora Pequena, usa /11)
            if (idAlvo === 4) return 2/11;
            if (idAlvo === 3) return 3/11;
            if (idAlvo === 2) return 6/11;
            if (idAlvo === 1) return 0; // Ignora pequena
        }
    }

    // Fallback genérico
    return 1.0;
}

function alocarTropas(capAlvo, estoque, config) {
    let capAtual = 0;
    let alocacao = {};

    // Itera pela ordem de prioridade (ex: Axe -> Light -> Heavy -> Spear -> Sword)
    for (let u of config.PRIORIDADE) {
        if (!estoque[u] || estoque[u] <= 0) continue;
        
        let cargaUnit = config.CAPACIDADE_CARGA[u];
        let capFaltante = capAlvo - capAtual;
        
        if (capFaltante <= 0) break;

        // Calcula quantas unidades precisa para cobrir o faltante
        let qtdNecessaria = Math.ceil(capFaltante / cargaUnit);
        
        // Verifica quantas tem disponivel
        let qtdParaUsar = Math.min(qtdNecessaria, estoque[u]);
        
        if (qtdParaUsar > 0) {
            alocacao[u] = qtdParaUsar;
            capAtual += qtdParaUsar * cargaUnit;
        }
    }
    return alocacao;
}

async function preencherInputs(alocacao) {
    for (let [unit, qtd] of Object.entries(alocacao)) {
        let input = document.querySelector(`.unitsInput[name='${unit}']`);
        if (input) {
            input.value = qtd;
            // Dispara eventos para o jogo reconhecer (atualizar o tempo na tela)
            input.dispatchEvent(new Event('keydown', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('keyup', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    // Pequeno delay para UI atualizar
    await new Promise(r => setTimeout(r, 200));
}

// =================================================================================
// FUNÇÕES UTILITÁRIAS E DE LEITURA
// =================================================================================

function obterTropasDisponiveis(config) {
    const widget = document.querySelector(".candidate-squad-widget.vis");
    if (!widget) return { totalCapacidade: 0, estoque: {} };

    let totalCapacidade = 0;
    let estoque = {};

    const els = widget.querySelectorAll("a.units-entry-all[data-unit]");
    els.forEach(el => {
        let u = el.getAttribute("data-unit");
        let qtd = parseInt(el.innerText.replace(/\D/g, '')) || 0;
        
        if (!config.BLACKLIST.includes(u)) {
            let disponivel = Math.max(0, qtd - (config.RESERVA[u] || 0));
            estoque[u] = disponivel;
            totalCapacidade += disponivel * (config.CAPACIDADE_CARGA[u] || 0);
        }
    });
    return { totalCapacidade, estoque };
}

function analisarNiveisColeta() {
    const opcoes = document.querySelectorAll(".scavenge-option");
    let disponiveisParaEnvio = [];
    let todosDesbloqueados = [];

    opcoes.forEach((div, idx) => {
        const id = idx + 1;
        const bloqueado = div.querySelector(".locked-view");
        const ocupado = div.querySelector(".return-countdown") || div.querySelector(".cancel-icon"); // Verifica se já tem coleta rodando
        const botaoComecar = div.querySelector(".free_send_button"); // Verifica se tem botão de começar

        if (!bloqueado) {
            todosDesbloqueados.push(id);
            // Só está livre se não estiver ocupado e tiver o botão visível
            if (!ocupado && botaoComecar) {
                disponiveisParaEnvio.push({
                    id: id,
                    nome: div.querySelector(".title")?.innerText || `Nível ${id}`,
                    elemento: div
                });
            }
        }
    });
    return { disponiveisParaEnvio, todosDesbloqueados };
}

function calcularCapacidadeParaTempo(segundos, nivelId, config) {
    const lootFactors = [0, 0.1, 0.25, 0.5, 0.75];
    const fatorNivel = lootFactors[nivelId];
    if (!fatorNivel) return 0;
    
    let time = segundos;
    let val = (time / config.factor) - config.initial;
    if (val < 0) return 0;
    val = Math.pow(val, 1 / config.exponent);
    val = val / 100;
    let baseLoot = Math.pow(val, 0.5);
    return Math.floor(baseLoot / fatorNivel);
}

function limparInputs() {
    document.querySelectorAll(".unitsInput").forEach(el => {
        el.value = "";
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function contem(arr, subset) { return subset.every(val => arr.includes(val)); }

;