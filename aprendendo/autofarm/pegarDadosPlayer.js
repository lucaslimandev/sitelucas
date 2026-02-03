// =========================================================================
// 🏰 COLETOR DE TROPAS EM MASSA (VISUALIZAÇÃO GERAL)
// =========================================================================

async function coletarMinhasTropas(groupId) {
  console.log(`🚀 Buscando dados das aldeias do grupo ${groupId}...`)

  // 1. Monta a URL (Visualização de Unidades, página -1 = todas)
  // Se groupId for nulo, pega de "todos"
  const grupo = groupId ? `&group=${groupId}` : ""
  const url =
    window.game_data.link_base_pure +
    `overview_villages&mode=units&type=there${grupo}&page=-1`

  try {
    const response = await fetch(url)
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    const tabela = doc.querySelector("#units_table")
    if (!tabela) {
      console.error(
        "❌ Tabela de unidades não encontrada. Verifique se você tem conta Premium/Gerente.",
      )
      return []
    }

    // --- 2. Mapear as Colunas (Cabeçalho) ---
    // Descobre em qual posição (index) está cada unidade baseada na imagem do header
    const mapColunas = []
    const ths = tabela.querySelectorAll("thead tr th")

    ths.forEach((th) => {
      const img = th.querySelector("img")
      if (img) {
        // Pega "spear" de ".../unit_spear.webp"
        const match = img.src.match(/unit_([a-zA-Z]+)\.webp/)
        if (match) {
          mapColunas.push(match[1]) // Adiciona 'spear', 'sword', etc na ordem
        }
      }
    })

    // Unidades que queremos ignorar
    const ignorar = ["knight", "snob", "militia"]

    // --- 3. Ler as Linhas (Corpo da Tabela) ---
    // No overview, cada aldeia é um tbody com class "row_marker"
    const linhas = tabela.querySelectorAll("tbody.row_marker")

    let minhasAldeias = []

    linhas.forEach((tbody) => {
      const tr = tbody.querySelector("tr")

      // A. ID DA ALDEIA
      const spanId = tr.querySelector("span.quickedit-vn")
      const idAldeia = spanId ? parseInt(spanId.getAttribute("data-id")) : 0

      // B. COORDENADAS
      // O texto costuma ser "Nome da Aldeia (432|653) K64"
      const texto = tr.innerText
      const matchCoords = texto.match(/(\d{3}\|\d{3})/)
      const coords = matchCoords ? matchCoords[0] : "000|000"

      // C. TROPAS
      // As células de tropa tem a classe .unit-item
      const celulasTropas = tr.querySelectorAll("td.unit-item")

      let inventario = {}
      let indiceUnidade = 0

      celulasTropas.forEach((td) => {
        // Pega o nome da unidade correspondente a essa coluna
        const nomeUnidade = mapColunas[indiceUnidade]

        // Se o nome existe e não está na lista de ignorar
        if (nomeUnidade && !ignorar.includes(nomeUnidade)) {
          // Pega o texto (se for vazio ou hidden, é 0)
          const qtd = parseInt(td.innerText.trim()) || 0
          inventario[nomeUnidade] = qtd
        }

        // Avança para a próxima unidade mapeada no header
        // (Nota: cells .unit-item alinham perfeitamente com as colunas de img do header)
        if (nomeUnidade) {
          indiceUnidade++
        }
      })

      // Adiciona na lista
      minhasAldeias.push({
        id: idAldeia,
        coords: coords,
        tropas: inventario,
      })
    })

    console.log("✅ Coleta finalizada com sucesso!")
    console.log(`📊 ${minhasAldeias.length} aldeias próprias encontradas.`)

    // Salva na variável global para cruzarmos os dados depois
    window.minhasAldeias = minhasAldeias

    return minhasAldeias
  } catch (erro) {
    console.error("Erro na requisição:", erro)
    return []
  }
}

// Configurações e Execução

let meuGroupId = 0

coletarMinhasTropas(meuGroupId).then((dados) => {
  // Mostra a primeira aldeia como exemplo para você conferir
  if (dados.length > 0) {
    console.log("Exemplo da sua primeira aldeia:", dados[0])
  } else {
    console.log("Nenhuma aldeia encontrada nesse grupo.")
  }
})
