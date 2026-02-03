/**
 * Envia um ataque de farm usando o Assistente de Saque
 * @param {number} origemId - ID da sua aldeia
 * @param {number} alvoId - ID da aldeia bárbara/inimiga
 * @param {number} modeloId - ID do modelo (A, B, ou C configurado)
 */
async function enviarFarming(origemId, alvoId, modeloId) {
  // Pega o token de segurança atual da sessão automaticamente
  const csrfToken = window.game_data.csrf

  // Monta a URL dinâmica baseada na aldeia de origem
  const url = `/game.php?village=${origemId}&screen=am_farm&mode=farm&ajaxaction=farm&json=1`

  // Monta o corpo da requisição
  const corpo = `target=${alvoId}&template_id=${modeloId}&source=${origemId}&h=${csrfToken}`

  try {
    const response = await fetch(url, {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "tribalwars-ajax": "1",
        "x-requested-with": "XMLHttpRequest",
      },
      body: corpo,
      method: "POST",
      mode: "cors",
      credentials: "include",
    })

    const data = await response.json()

    if (data.error) {
      console.error(`❌ Erro ao atacar ${alvoId}:`, data.error)
    } else {
      console.log(
        `✅ Ataque enviado com sucesso de ${origemId} para ${alvoId} (Modelo: ${modeloId})`,
      )
      // console.log(data); // Descomente se quiser ver a resposta completa do servidor
    }
  } catch (erro) {
    console.error("Erro na requisição:", erro)
  }
}
// Exemplo: Aldeia 21114 ataca Aldeia 22549 com o modelo 4016
enviarFarming(21114, 22549, 4016);