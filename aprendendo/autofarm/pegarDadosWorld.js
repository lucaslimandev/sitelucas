// =========================================================================
// ⏱️ MÓDULO DE VELOCIDADE E TEMPO (FÍSICA DO JOGO)
// =========================================================================

// 1. Tabela de Velocidade Base (Minutos por Campo em Vel 1)
const VELOCIDADE_BASE = {
  spear: 18, // Lanceiro
  sword: 22, // Espadachim
  axe: 18, // Bárbaro
  archer: 18, // Arqueiro
  spy: 9, // Explorador
  light: 10, // Cavalaria Leve
  marcher: 10, // Arqueiro a Cavalo
  heavy: 11, // Cavalaria Pesada
  ram: 30, // Aríete
  catapult: 30, // Catapulta
  knight: 10, // Paladino
  snob: 35, // Nobre
  militia: 0, // Milícia (não ataca)
}

/**
 * Busca as configurações do mundo e salva a constante de velocidade
 */
async function configurarVelocidadeMundo() {
  console.log("🌍 Verificando configurações de velocidade do mundo...")

  try {
    // Faz o fetch na interface de configuração do Tribal Wars
    const response = await fetch("/interface.php?func=get_config")
    const xmlText = await response.text()

    // Converte o texto XML para navegar nele
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlText, "text/xml")

    // Pega os valores do XML
    const unitSpeed = parseFloat(xml.querySelector("unit_speed").textContent)
    const worldSpeed = parseFloat(xml.querySelector("speed").textContent)

    // A constante mágica é a multiplicação dos dois
    const constanteVel = unitSpeed * worldSpeed

    // Salva no LocalStorage com o nome do mundo atual (ex: constanteVel_br139)
    const worldAtual = game_data.world
    localStorage.setItem(`constanteVel_${worldAtual}`, constanteVel)

    console.log(`✅ Configuração Salva!`)
    console.log(`   - Velocidade do Mundo: ${worldSpeed}`)
    console.log(`   - Velocidade da Unidade: ${unitSpeed}`)
    console.log(`   - Constante Calculada: ${constanteVel}`)

    return constanteVel
  } catch (erro) {
    console.error("❌ Erro ao obter configurações do mundo:", erro)
    return 1 // Retorna 1 por segurança para não dividir por zero
  }
}

/**
 * Calcula o tempo de viagem em SEGUNDOS
 * @param {string} unidade - Nome da unidade (ex: 'light', 'spear')
 * @param {number} distancia - Distância entre as aldeias (float)
 * @returns {number} Tempo em segundos
 */
function calcularTempoViagem(unidade, distancia) {
  // 1. Recupera a constante do mundo atual
  const worldAtual = game_data.world
  let constanteVel = localStorage.getItem(`constanteVel_${worldAtual}`)

  // Se não tiver salvo ainda, assume 1 (ou avisa o usuário)
  if (!constanteVel) {
    console.warn(
      "⚠️ Constante de velocidade não encontrada. Usando padrão 1. Rode configurarVelocidadeMundo()!",
    )
    constanteVel = 1
  }

  // 2. Pega o tempo base da unidade
  const baseMinutos = VELOCIDADE_BASE[unidade]

  if (!baseMinutos) {
    console.error(`❌ Unidade desconhecida: ${unidade}`)
    return 0
  }

  // 3. A Fórmula: (Base / Constante) * Distância
  // Multiplicamos por 60 para transformar minutos em segundos
  const tempoSegundos = (baseMinutos / constanteVel) * distancia * 60

  return Math.round(tempoSegundos)
}

// =========================================================================
// EXECUÇÃO IMEDIATA
// =========================================================================
// Roda a configuração assim que você cola o script
configurarVelocidadeMundo()
// Digite isso no console:
