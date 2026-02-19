# Como testar se as alterações estão na aplicação

## 1. Ver que a build atual está carregada

- **Em desenvolvimento** (`npm run dev`): no canto **inferior esquerdo** da tela deve aparecer um badge **"dev"**. Se aparecer, o código do `npm run dev` é o que está rodando.
- **Em produção / preview** (`npm run build` + `npm run preview` ou deploy): abra a app com **`?build=1`** na URL (ex.: `http://localhost:4173/preview?build=1`). Deve aparecer um badge **"ok"** no canto inferior esquerdo. Se aparecer, a build que está servida é a que você acabou de gerar.

## 2. Se não aparecer o badge

1. **Parar o servidor** (Ctrl+C no terminal onde está o `npm run dev` ou o preview).
2. **Limpar cache do Vite** (só em dev):
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Subir de novo**:
   ```bash
   npm run dev
   ```
4. No **celular ou no navegador**: fazer um **reload forçado** (recarregar ignorando cache):
   - **Chrome no Android**: menu (⋮) → “Recarregar” ou abrir o site em aba anônima.
   - **Safari no iOS**: fechar a aba e abrir de novo, ou em Ajustes → Safari → “Limpar Histórico e Dados”.
   - **Desktop**: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac).

## 3. Testar o menu na preview (celular)

- Com o badge “dev” (ou “ok” com `?build=1`) visível, ir para a tela de **preview** (louvor ou sermão).
- **Primeiro toque** na área do canto superior direito: deve **só mostrar** os botões (tela cheia e configuração), sem abrir nada.
- **Segundo toque** em um dos botões: aí sim deve abrir a ação (tela cheia ou config).
- Se no primeiro toque já abrir a config, a versão com o `preventDefault` no toque ainda não está a ser usada: repetir o passo 2 e recarregar com cache limpo.

## 4. Testar o scroll das notas (sermão)

- Na preview em modo **sermão**, rolar as notas para baixo.
- Mudar o slide (noutro dispositivo ou no ProPresenter, ou com os botões Anterior/Próximo).
- O scroll das notas **não** deve voltar ao topo sozinho; deve manter a posição (ou o mais próximo possível).
- Se voltar ao topo, confirmar que está a ver o badge “dev” ou “ok” e que fez um reload forçado depois da última alteração.
