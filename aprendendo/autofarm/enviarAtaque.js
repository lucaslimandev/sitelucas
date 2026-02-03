;(async () => {
  // ================= CONFIGURAÇÃO =================
  const config = {
    origemId: game_data.village.id, // ID da sua aldeia (village=)
    alvoId: "96474", // ID da aldeia alvo (target=)
    coordX: "636", // Coordenada X do alvo
    coordY: "733", // Coordenada Y do alvo
    tipo: "support", // Use 'attack' para ataque ou 'support' para apoio
  }
  // ================================================
const worldAttls = game_data.world
  const placeUrl = `https://${worldAttls}.tribalwars.com.br/game.php?village=${config.origemId}&screen=place`

  console.log(`🚀 Iniciando comando para ${config.coordX}|${config.coordY}...`)

  try {
    // 1. Carregar praça e capturar tokens/tropas
    const r1 = await fetch(`${placeUrl}&target=${config.alvoId}`)
    const t1 = await r1.text()
    const d1 = new DOMParser().parseFromString(t1, "text/html")

    // Token H (Segurança)
    let h = ""
    const scriptContent = Array.from(d1.querySelectorAll("script"))
      .map((s) => s.textContent)
      .join(" ")
    const hMatch = scriptContent.match(/csrf_token\s*=\s*'(.+?)'/)
    if (hMatch) h = hMatch[1]

    // Token do Formulário (Nome dinâmico)
    const form = d1.querySelector("#command-data-form")
    if (!form)
      throw new Error(
        "Praça de reunião não encontrada. Verifique se o ID da aldeia de origem está correto.",
      )

    const sessionInput = form.querySelector('input[type="hidden"]')
    const sessionToken = sessionInput.name
    const sessionValue = sessionInput.value

    // Montar primeiro envio (Seleção de tropas)
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
    fd1.append("x", config.coordX)
    fd1.append("y", config.coordY)
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
      throw new Error("Falha na confirmação. O alvo existe? Você tem tropas?")

    // 3. Envio Final
    const fd2 = new URLSearchParams()
    fd2.append(config.tipo, "true")
    fd2.append("ch", ch)
    fd2.append("cb", "troop_confirm_submit")
    fd2.append("x", config.coordX)
    fd2.append("y", config.coordY)
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

    console.log(
      `✅ SUCESSO: Tropas enviadas para ${config.coordX}|${config.coordY}`,
    )
  } catch (e) {
    console.error("❌ ERRO:", e.message)
  }
})()
