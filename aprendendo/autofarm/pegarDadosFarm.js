// =================================================================================
// ⚔️ SCRAPER COMPLETO TRIBAL WARS - FARM ASSISTANT (COM CONTAGEM DE TROPAS) ⚔️
// =================================================================================

// Pequena pausa para não travar o servidor
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * MÁGICA: Converte o texto sujo do 'title' em um objeto de tropas limpo.
 * Entrada: "&lt;img src=...unit_spy.webp.../&gt;1&lt;br /&gt;&lt;img ...unit_light.webp.../&gt;4..."
 * Saída: { spy: 1, light: 4 }
 */
function lerTropasDoTitulo(textoCodificado) {
  if (!textoCodificado) return null

  // 1. Cria um elemento DIV falso na memória
  const div = document.createElement("div")

  // 2. Injeta o texto. O navegador decodifica automaticamente (&lt; vira <)
  div.innerHTML = textoCodificado

  const tropas = {}

  // 3. Procura todas as imagens de unidades dentro desse HTML decodificado
  const imagens = div.querySelectorAll('img[src*="unit_"]')

  imagens.forEach((img) => {
    // Pega o nome da unidade (ex: graphic/unit/unit_light.webp -> "light")
    const matchNome = img.src.match(/unit_([a-zA-Z]+)\.webp/)
    const nomeUnidade = matchNome ? matchNome[1] : "desconhecido"

    // O número da quantidade está no "nó de texto" logo após a imagem
    // HTML é tipo: <img ...> 4 <br>
    const proximoNo = img.nextSibling

    if (proximoNo && proximoNo.nodeType === 3) {
      // 3 = Nó de Texto
      const quantidade = parseInt(proximoNo.textContent.trim())
      if (!isNaN(quantidade)) {
        tropas[nomeUnidade] = quantidade
      }
    }
  })

  // Se o objeto estiver vazio (ex: botão desativado ou erro), retorna null
  return Object.keys(tropas).length > 0 ? tropas : null
}

/**
 * Analisa cada linha da tabela e extrai todos os dados
 */
function analisarLinha(tr) {
  const tds = tr.querySelectorAll("td")

  // --- 1. ID DA ALDEIA ---
  const idAldeia = parseInt(tr.id.replace("village_", ""))

  // --- 2. STATUS (Cor da bolinha) ---
  let status = "desconhecido"
  const imgStatus = tds[1] ? tds[1].querySelector("img") : null
  if (imgStatus) {
    const src = imgStatus.src
    if (src.includes("green")) status = "vitoria_total"
    else if (src.includes("blue")) status = "explorado"
    else if (src.includes("yellow")) status = "perdas"
    else if (src.includes("red_blue")) status = "derrota_explorado"
    else if (src.includes("red")) status = "derrota"
  }

  // --- 3. SAQUE (Cheio/Parcial) ---
  let saqueCheio = false
  const imgLoot = tds[2] ? tds[2].querySelector("img") : null
  if (imgLoot && imgLoot.src.includes("max_loot/1")) saqueCheio = true

  // --- 4. COORDENADAS ---
  const textoTd3 = tds[3] ? tds[3].innerText : ""
  const matchCoords = textoTd3.match(/(\d{3}\|\d{3})/)
  const coords = matchCoords ? matchCoords[0] : "000|000"

  // --- 5. ATAQUES A CAMINHO ---
  let ataques = 0
  if (tds[3]) {
    const imgAttack = tds[3].querySelector('img[src*="attack"]')
    if (imgAttack) {
      // Tenta pegar do 'title' (ex: "7.Ataques...") ou 'data-title'
      const textoTitle =
        imgAttack.getAttribute("title") ||
        imgAttack.getAttribute("data-title") ||
        ""
      const matchNum = textoTitle.match(/(\d+)/)
      if (matchNum) ataques = parseInt(matchNum[0])
    }
  }

  // --- 6. MURALHA ---
  let muralha = 0
  if (tds[6]) {
    const txt = tds[6].innerText.trim()
    if (txt !== "?" && txt !== "") muralha = parseInt(txt) || 0
  }

  // --- 7. DISTÂNCIA ---
  let distancia = 0
  if (tds[7]) distancia = parseFloat(tds[7].innerText) || 0

  // --- 8. LINK DA PRAÇA ---
  const linkPracaEl = tr.querySelector('a[href*="screen=place"]')
  const linkPraca = linkPracaEl ? linkPracaEl.href : null

  // --- 9. BOTÕES E TROPAS (A Mágica acontece aqui) ---
  const processarBotao = (classe) => {
    const btn = tr.querySelector(`.${classe}`)
    if (!btn) return null // Botão não existe

    // Pega o ID (4016...)
    const onclick = btn.getAttribute("onclick")
    let idModelo = null
    if (onclick) {
      const matchId = onclick.match(/sendUnits\(.*?,.*?,\s*(\d+)\)/)
      if (matchId) idModelo = parseInt(matchId[1])
    }

    // Pega as Tropas (Decodificando o HTML do title)
    const htmlTropas =
      btn.getAttribute("title") || btn.getAttribute("data-title")
    const objetoTropas = lerTropasDoTitulo(htmlTropas)

    return {
      id: idModelo,
      tropas: objetoTropas, // { light: 4, spy: 1 }
    }
  }

  return {
    id: idAldeia,
    coords: coords,
    status: status,
    saqueCheio: saqueCheio,
    ataques: ataques,
    muralha: muralha,
    distancia: distancia,
    linkPraca: linkPraca,
    modelos: {
      a: processarBotao("farm_icon_a"),
      b: processarBotao("farm_icon_b"),
      c: processarBotao("farm_icon_c"),
    },
  }
}

/**
 * Função Principal (Itera sobre todas as páginas)
 */
async function obterTodosFarms() {
  console.clear()
  console.log("🚀 INICIANDO VARREDURA COMPLETA...")

  const urlBase =
    window.game_data.link_base_pure +
    "am_farm&order=distance&dir=asc&Farm_page="
  let listaFarms = []

  // 1. Descobrir Paginação
  let totalPaginas = 1
  try {
    const r = await fetch(urlBase + "0")
    const t = await r.text()
    const doc = new DOMParser().parseFromString(t, "text/html")
    const nav = doc.querySelector("#plunder_list_nav")
    if (nav) {
      nav.querySelectorAll(".paged-nav-item").forEach((el) => {
        const n = parseInt(el.innerText.match(/\d+/))
        if (n > totalPaginas) totalPaginas = n
      })
    }
  } catch (e) {
    console.error("Erro paginação", e)
    return
  }

  console.log(`📄 Total de páginas: ${totalPaginas}`)

  // 2. Loop
  for (let i = 0; i < totalPaginas; i++) {
    console.log(`📡 Lendo página ${i + 1}...`)
    try {
      const req = await fetch(urlBase + i)
      const html = await req.text()
      const docVirtual = new DOMParser().parseFromString(html, "text/html")
      const linhas = docVirtual.querySelectorAll(
        "#plunder_list tr.row_a, #plunder_list tr.row_b",
      )

      linhas.forEach((tr) => {
        listaFarms.push(analisarLinha(tr))
      })
      await esperar(200)
    } catch (erro) {
      console.error(`Erro pg ${i}`, erro)
    }
  }

  console.log("✅ FINALIZADO!")
  console.log(`📊 ${listaFarms.length} aldeias coletadas.`)

  // Salva na variável global
  window.farmFullData = listaFarms

  return listaFarms
}

// Executa
obterTodosFarms().then((dados) => {
  // Exibe um exemplo rico para você conferir
  if (dados.length > 0) {
    // Tenta achar um que tenha tropas misturadas (spy e light) para mostrar
    const exemplo =
      dados.find(
        (d) =>
          d.modelos.a &&
          d.modelos.a.tropas &&
          Object.keys(d.modelos.a.tropas).length > 1,
      ) || dados[0]
    console.log("🔎 Exemplo de dados coletados:", exemplo)
  }
})
