const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// parte 1
async function parte1() {
  const buttonsRename = document.querySelectorAll(
    ".rename-icon[data-title='Renomear']",
  )

  for (const button of buttonsRename) {
    button.click()
    await esperar(10)
  }

  await esperar(500)
}

// parte 2
async function parte2() {
  const inputsRename = document.querySelectorAll(
    'span.quickedit-edit input[type="text"]',
  )

  inputsRename.forEach((inputRename, index) => {
    const number = String(index).padStart(3, "0")
    const text = `${number} | Lucz`

    inputRename.value = text

    inputRename.dispatchEvent(new Event("input", { bubbles: true }))
  })

  await esperar(500)
}

// parte 3
async function ClicarButtons() {
  const inputsRenameButton = document.querySelectorAll(
    'span.quickedit-edit input[type="button"]',
  )

  for (const [index, botao] of inputsRenameButton.entries()) {
    botao.click()

    await esperar(200)
  }
}
async function iniciarRenomeador() {
  try {
    await parte1()
    await parte2()
    await ClicarButtons()
  } catch (erro) {
    console.error("Algo deu errado: ", erro)
  }
}
iniciarRenomeador()
