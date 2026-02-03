**Project Overview**
- **Tipo:** Site estático com scripts de automação/integração para a UI do jogo Tribal Wars.
- **Onde olhar:** o código principal de automações fica em [aprendendo](aprendendo) (ex.: [aprendendo/autocoleta/coletar.js](aprendendo/autocoleta/coletar.js#L1)).

**Arquitetura e porquê**
- **Separação por domínio:** cada pasta em `aprendendo/` representa um conjunto de features (ex.: `autocoleta/` e `autofarm/`) para facilitar teste manual direto no navegador.
- **Execução alvo:** os scripts são destinados a rodar no contexto do navegador (console/bookmarklet) e interagem com variáveis globais do jogo (`window.game_data`, `ScavengeScreen`) e DOM.

**Padrões de código e convenções específicas**
- **Selector-driven:** o código depende fortemente de seletores CSS (`.candidate-squad-widget.vis`, `#units_table`, `.scavenge-option`). Ao alterar, valide os seletores no DOM do jogo.
- **Config via objeto:** constantes/fatores por script ficam em objetos `CONFIG` no topo (ver [aprendendo/autocoleta/coletar.js](aprendendo/autocoleta/coletar.js#L6)).
- **Funções sincrônicas + async:** operações de rede usam `fetch` + parsing de HTML (ex.: [aprendendo/autofarm/pegarDadosPlayer.js](aprendendo/autofarm/pegarDadosPlayer.js#L1)).
- **Logs para debug:** uso intensivo de `console.log/warn/error` para inspeção em tempo real — padrão esperado para validação manual.

**Fluxos de dados e integrações**
- **Leitura do jogo:** scripts leem HTML via `fetch` (overview_villages) e parseiam com `DOMParser` para extrair tabelas, colunas e quantidades.
- **Envio de comandos:** preenchimento de inputs é feito via `input.value` + eventos (`keydown`, `input`, `change`) para acionar lógica do jogo (ver `preencherInputs()` em `coletar.js`).
- **Dependências externas:** não há bibliotecas externas no repositório; a integração depende do ambiente do jogo (premium/manager features podem alterar disponibilidade de tabelas).

**Como testar / executar**
- Não há build system: abrir a página do jogo no navegador e colar o conteúdo do script no console ou usar como bookmarklet.
- Para validar, observe `console` e variáveis globais criadas (ex.: `window.minhasAldeias` é populada por `pegarDadosPlayer.js`).
- Quando alterar seletores, reproduza o fluxo manual no jogo e confirme que os elementos existem (`document.querySelector(...)`).

**Boas práticas específicas ao projeto**
- Evite mudar nomes de classes/ids no HTML local sem atualizar selectors nos scripts.
- Preserve estruturas `CONFIG` e `CAPACIDADE_CARGA` — muitas funções dependem desses mapas.
- Ao adicionar utilitários reutilizáveis, coloque-os em `aprendendo/` e comente claramente a expectativa de ambiente (ex.: precisa de `window.game_data`).

**Pontos de atenção / riscos**
- Scripts interagem diretamente com o jogo; mudanças do site (estrutura DOM) quebram lógicas de parsing.
- Algumas funções assumem elementos premium/visíveis — tratar null checks antes de operar.

**Exemplos rápidos**
- Mapear colunas de unidades: ver [aprendendo/autofarm/pegarDadosPlayer.js](aprendendo/autofarm/pegarDadosPlayer.js#L20).
- Alocação de tropas por prioridade: ver `alocarTropas()` em [aprendendo/autocoleta/coletar.js](aprendendo/autocoleta/coletar.js#L60).

**O que o agente deve priorizar**
- Entender e validar seletores DOM no navegador antes de alterar lógica.
- Evitar mudanças amplas em convenções de `CONFIG` sem ajustar todos os scripts.
- Fornecer instruções de teste manual (passo-a-passo) sempre que modificar comportamento de input/eventos.

Se algo acima estiver incompleto ou você quiser que eu acrescente exemplos de outras pastas (ex.: `tribalwars/`), me diga qual arquivo quer que eu destaque.
