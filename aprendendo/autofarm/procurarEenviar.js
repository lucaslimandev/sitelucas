;(async () => {
  // ================= CONFIGURAÇÃO =================
  const config = {
    origemId: game_data.village.id,
    tipo: "attack", // 'attack' ou 'support'
  }
  // ================================================

  const world = game_data.world
  const placeUrl = `https://${world}.tribalwars.com.br/game.php?village=${config.origemId}&screen=place`

  console.log("🔍 Buscando aldeia de bárbaros no mapa...")

  try {
    // 0. Buscar e processar o arquivo de aldeias do mundo
    const rMap = await fetch(
      `https://${world}.tribalwars.com.br/map/village.txt`,
    )
    const mapText = await rMap.text()

    // Transforma o texto em array e procura a primeira que tem o campo PlayerID (índice 4) como 0
    const linhas = mapText.split("\n")
    const barbaro = linhas.find((linha) => {
      const dados = linha.split(",")
      return dados[4] === "0" // O 5º elemento é o ID do dono (0 = Bárbaro)
    })

    if (!barbaro)
      throw new Error(
        "Nenhuma aldeia de bárbaros encontrada no arquivo do mapa.",
      )

    const [idAlvo, nome, x, y, playerID] = barbaro.split(",")

    console.log(
      `🎯 Alvo encontrado: ${decodeURIComponent(nome)} (${x}|${y}) - ID: ${idAlvo}`,
    )

    // 1. Carregar praça e capturar tokens/tropas
    const r1 = await fetch(`${placeUrl}&target=${idAlvo}`)
    const t1 = await r1.text()
    const d1 = new DOMParser().parseFromString(t1, "text/html")

    // Token H (Segurança)
    let h = ""
    const scriptContent = Array.from(d1.querySelectorAll("script"))
      .map((s) => s.textContent)
      .join(" ")
    const hMatch = scriptContent.match(/csrf_token\s*=\s*'(.+?)'/)
    if (hMatch) h = hMatch[1]

    // Token do Formulário
    const form = d1.querySelector("#command-data-form")
    if (!form) throw new Error("Praça de reunião não encontrada.")

    const sessionInput = form.querySelector('input[type="hidden"]')
    const sessionToken = sessionInput.name
    const sessionValue = sessionInput.value

    // Montar primeiro envio (Todas as tropas disponíveis)
    const fd1 = new URLSearchParams()
    fd1.append(sessionToken, sessionValue)
    ;[
      "spear",
      "sword",
      "axe",
      "spy",
      "light",
      "heavy",
      "ram",
      "catapult",
      "knight",
      "snob",
    ].forEach((u) => {
      const val =
        d1.querySelector(`#unit_input_${u}`)?.getAttribute("data-all-count") ||
        "0"
      fd1.append(u, val)
    })
    fd1.append("x", x)
    fd1.append("y", y)
    fd1.append("target_type", "coord")
    fd1.append(config.tipo, config.tipo === "attack" ? "Ataque" : "Apoio")

    // 2. POST de Confirmação
    const r2 = await fetch(`${placeUrl}&try=confirm`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: fd1.toString(),
    })
    const t2 = await r2.text()
    const d2 = new DOMParser().parseFromString(t2, "text/html")

    const ch = d2.querySelector('input[name="ch"]')?.value
    if (!ch)
      throw new Error("Falha na confirmação. Você tem tropas disponíveis?")

    // 3. Envio Final
    const fd2 = new URLSearchParams()
    fd2.append(config.tipo, "true")
    fd2.append("ch", ch)
    fd2.append("cb", "troop_confirm_submit")
    fd2.append("x", x)
    fd2.append("y", y)
    fd2.append("source_village", config.origemId)
    fd2.append("village", config.origemId)

    ;[
      "spear",
      "sword",
      "axe",
      "spy",
      "light",
      "heavy",
      "ram",
      "catapult",
      "knight",
      "snob",
    ].forEach((u) => {
      fd2.append(u, fd1.get(u))
    })

    fd2.append(
      "submit_confirm",
      config.tipo === "attack" ? "Enviar ataque" : "Enviar apoio",
    )
    if (h) fd2.append("h", h)

    await fetch(`${placeUrl}&action=command`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: fd2.toString(),
    })

    console.log(`✅ SUCESSO: Ataque enviado para Bárbaro em ${x}|${y}`)
  } catch (e) {
    console.error("❌ ERRO:", e.message)
  }
})()
