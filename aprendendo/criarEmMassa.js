// --- CONFIGURAÇÃO ---
const metaWood = 33
const metaStone = 34
const metaIron = 33 // Ajustado para fechar 100%
// --------------------

const rows = document.querySelectorAll("#offer_creation_villages > tbody > tr")

const data = Array.from(rows)
  .map((tr) => {
    const idInput = tr.querySelector("input[id^='offer_count_']")
    if (!idInput) return null

    const vId = idInput.id.split("_").pop()

    const cleanInt = (el) => {
      if (!el) return 0
      return parseInt(el.innerText.replace(/\./g, ""), 10) || 0
    }

    // 1. Recursos Atuais
    const resTd = tr.querySelector(`#village_info_res_${vId}`)
    const wood = cleanInt(resTd?.querySelector(".wood")?.closest(".nowrap"))
    const stone = cleanInt(resTd?.querySelector(".stone")?.closest(".nowrap"))
    const iron = cleanInt(resTd?.querySelector(".iron")?.closest(".nowrap"))

    const totalRes = wood + stone + iron

    // 2. Cálculo do Equilíbrio
    // Calculamos quanto deveríamos ter de cada um baseado na meta
    const idealWood = Math.floor(totalRes * (metaWood / 100))
    const idealStone = Math.floor(totalRes * (metaStone / 100))
    const idealIron = Math.floor(totalRes * (metaIron / 100))

    // 3. Diferença (Positivo = Excedente / Negativo = Faltante)
    return {
      id: vId,
      nome: tr.querySelector("td:nth-child(1) a")?.innerText.trim(),
      total: totalRes,
      recursos: {
        madeira: { atual: wood, balanco: wood - idealWood },
        argila: { atual: stone, balanco: stone - idealStone },
        ferro: { atual: iron, balanco: iron - idealIron },
      },
      comerciantes: tr.querySelector(`#village_info_traders_${vId}`)?.innerText,
    }
  })
  .filter((item) => item !== null)

// Exibição formatada para facilitar a leitura do que mover
console.table(
  data.map((d) => ({
    Aldeia: d.nome,
    "Madeira (Balanço)":
      d.recursos.madeira.balanco > 0
        ? `+${d.recursos.madeira.balanco}`
        : d.recursos.madeira.balanco,
    "Argila (Balanço)":
      d.recursos.argila.balanco > 0
        ? `+${d.recursos.argila.balanco}`
        : d.recursos.argila.balanco,
    "Ferro (Balanço)":
      d.recursos.ferro.balanco > 0
        ? `+${d.recursos.ferro.balanco}`
        : d.recursos.ferro.balanco,
    Total: d.total,
  })),
)
