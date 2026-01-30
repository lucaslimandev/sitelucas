;(async () => {
  const url =
    window.game_data.link_base_pure +
    "overview_villages&mode=trader&type=inc&group=0&page=-1&type=inc"
  console.log("🚀 Analisando estrutura da tabela e buscando recursos...")

  try {
    const response = await fetch(url)
    const htmlText = await response.text()
    const doc = new DOMParser().parseFromString(htmlText, "text/html")
    const table = doc.getElementById("trades_table")

    if (!table) {
      console.error("❌ Tabela 'trades_table' não encontrada.")
      return
    }

    // 1. Descobrir dinamicamente qual a coluna da "Aldeia" (Destino)
    const headers = Array.from(table.querySelectorAll("th"))
    // Procuramos o índice da coluna que contém o texto "Aldeia"
    const colIndexDestino = headers.findIndex((th) =>
      th.innerText.includes("Aldeia"),
    )

    if (colIndexDestino === -1) {
      console.error(
        "❌ Não foi possível encontrar a coluna 'Aldeia' no cabeçalho.",
      )
      return
    }

    const rows = table.querySelectorAll("tr.row_a, tr.row_b")
    const resumo = {}

    rows.forEach((row) => {
      // Pegamos a célula específica baseada no índice que encontramos no cabeçalho
      const celulaDestino = row.cells[colIndexDestino]
      const linkDestino = celulaDestino?.querySelector(
        'a[href*="screen=info_village"]',
      )

      if (linkDestino) {
        const urlObj = new URL(linkDestino.href, window.location.origin)
        const idDestino = urlObj.searchParams.get("id")
        const nomeAldeia = linkDestino.innerText.trim()

        if (!resumo[idDestino]) {
          resumo[idDestino] = {
            nome: nomeAldeia,
            madeira: 0,
            barro: 0,
            ferro: 0,
            total: 0,
          }
        }

        // 2. Localizar a coluna de Recursos (normalmente a última ou que diz 'Recursos')
        const colIndexRecursos = headers.findIndex((th) =>
          th.innerText.includes("Recursos"),
        )
        const celulaRecursos =
          row.cells[colIndexRecursos || row.cells.length - 1]

        if (celulaRecursos) {
          const resourceSpans = celulaRecursos.querySelectorAll("span.nowrap")
          resourceSpans.forEach((span) => {
            const valor = parseInt(span.innerText.replace(/\./g, "")) || 0

            if (span.querySelector(".wood")) resumo[idDestino].madeira += valor
            else if (span.querySelector(".stone"))
              resumo[idDestino].barro += valor
            else if (span.querySelector(".iron"))
              resumo[idDestino].ferro += valor

            resumo[idDestino].total += valor
          })
        }
      }
    })

    if (Object.keys(resumo).length === 0) {
      console.warn(
        "⚠️ Nenhuma aldeia processada. Verifique se há mercadores ativos.",
      )
    } else {
      console.log(
        `✅ Coluna 'Aldeia' identificada no índice: ${colIndexDestino}`,
      )
      console.table(resumo)
    }
  } catch (error) {
    console.error("❌ Erro ao processar:", error)
  }
})()
