function calcularCapacidadeAvancada() {
  // --- 1. CONFIGURAÇÃO DE RESERVA (Qtd para MANTER na aldeia) ---
  // Se a unidade não estiver listada aqui, a reserva será 0.
  const RESERVA = {
    spear: 100, // Guardar 100 Lanças
    sword: 100, // Guardar 100 Espadachins
    axe: 50, // Guardar 50 Bárbaros
    archer: 100, // Guardar 100 Arqueiros
    light: 0, // Reserva de CL
    marcher: 0, // Reserva de AC
    heavy: 50, // Guardar 50 CP
  }

  // --- 2. CONFIGURAÇÃO DE BLACKLIST (Ignorar completamente) ---
  const BLACKLIST = ["light", "knight", "scout"]

  // --- 3. DADOS DO JOGO (Carga por unidade) ---
  const CAPACIDADE_CARGA = {
    spear: 25,
    sword: 15,
    axe: 10,
    archer: 10,
    light: 80,
    marcher: 50,
    heavy: 50,
    knight: 100,
  }

  // --- LÓGICA ---
  const widget = document.querySelector(".candidate-squad-widget.vis")
  if (!widget) {
    console.error("Tabela de tropas não encontrada!")
    return 0
  }

  let capacidadeTotal = 0
  let relatorio = []

  const unidadesEncontradas = widget.querySelectorAll(
    "a.units-entry-all[data-unit]",
  )

  unidadesEncontradas.forEach((el) => {
    const unit = el.getAttribute("data-unit")
    const qtdTotal = parseInt(el.innerText.replace(/\D/g, "")) || 0

    if (CAPACIDADE_CARGA[unit]) {
      let qtdUsavel = 0
      let status = ""
      let cargaGerada = 0

      // 1. Verifica Blacklist
      if (BLACKLIST.includes(unit)) {
        qtdUsavel = 0
        status = "⛔ BLACKLIST"
      } else {
        // 2. Verifica Reserva Individual (Default 0 se não definir)
        const reservaDestaUnidade = RESERVA[unit] || 0

        // 3. Subtrai
        let saldo = qtdTotal - reservaDestaUnidade
        qtdUsavel = saldo > 0 ? saldo : 0

        // 4. Calcula Carga
        cargaGerada = qtdUsavel * CAPACIDADE_CARGA[unit]

        if (qtdUsavel === 0 && qtdTotal > 0) {
          status = "⚠️ RESERVA ATIVA"
        } else {
          status = "✅ OK"
        }
      }

      // Adiciona ao relatório se tiver a tropa ou se tiver regra de reserva
      if (qtdTotal > 0) {
        capacidadeTotal += cargaGerada
        relatorio.push({
          Unidade: unit,
          Total: qtdTotal,
          "Reserva Config": BLACKLIST.includes(unit) ? "-" : RESERVA[unit] || 0,
          Disponível: qtdUsavel,
          Carga: cargaGerada.toLocaleString(),
          Status: status,
        })
      }
    }
  })

  // --- EXIBIÇÃO ---
  console.clear()
  console.log(
    "%c CÁLCULO DETALHADO POR UNIDADE ",
    "background: #111; color: #d4a04e; font-weight: bold; padding: 5px;",
  )
  console.table(relatorio)
  console.log(
    `%c CAPACIDADE REAL TOTAL: ${capacidadeTotal.toLocaleString()} `,
    "background: green; color: white; font-size: 16px; padding: 8px; border-radius: 4px;",
  )

  return capacidadeTotal
}

calcularCapacidadeAvancada()
