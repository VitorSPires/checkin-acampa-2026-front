const BASE_URL = "https://umpalphaville.com"

export default function GuiaPage() {
  return (
    <div className="min-h-screen-safe bg-background px-4 py-8 md:px-6 md:py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">
          Guia do sistema de check-in
        </h1>

        <nav aria-label="Índice" className="mb-10 rounded-lg border bg-muted/40 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Índice
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm md:text-base">
            <li>
              <a
                href="#auto-checkin"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Como fazer o auto check-in
              </a>
            </li>
            <li>
              <a
                href="#lista-presentes"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Visualizar lista de presentes
              </a>
            </li>
            <li>
              <a
                href="#editar-informacoes"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Editar informações
              </a>
            </li>
            <li>
              <a
                href="#cpf-nao-encontrado"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                CPF não encontrado, e agora?
              </a>
            </li>
            <li>
              <a
                href="#cadastros-incompletos"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Cadastros incompletos
              </a>
            </li>
          </ol>
        </nav>

        <section id="auto-checkin" className="scroll-mt-6 space-y-2">
          <h2 className="text-xl font-semibold">1. Como fazer o auto check-in</h2>
          <p>
            O acampante acessa a página de check-in, informa o CPF e é marcado
            como presente. Na hora ele vê na tela o time, o ônibus e o pequeno
            grupo (quando já estiverem definidos). Pode acessar de novo quando
            quiser para rever as informações.
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a
              href={`${BASE_URL}/checkin`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {BASE_URL}/checkin
            </a>
          </p>
        </section>

        <section id="lista-presentes" className="scroll-mt-6 space-y-2 pt-8">
          <h2 className="text-xl font-semibold">
            2. Visualizar lista de presentes
          </h2>
          <p>
            Acesse a área de administração com a senha informada no grupo. Na
            aba &quot;Lista de presentes&quot; você vê quem já fez check-in e
            quem ainda não fez. Recarregue a página para atualizar os dados.
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a
              href={`${BASE_URL}/adm`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {BASE_URL}/adm
            </a>
          </p>
        </section>

        <section id="editar-informacoes" className="scroll-mt-6 space-y-2 pt-8">
          <h2 className="text-xl font-semibold">3. Editar informações</h2>
          <p>
            Na tela de administração, abra a aba &quot;Configuração&quot;. Lá
            você pode: alterar a mensagem exibida quando o CPF não for
            encontrado; cadastrar e editar ônibus, times e pequenos grupos; e
            ver ou editar em qual time, ônibus e pequeno grupo cada usuário está.
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a
              href={`${BASE_URL}/adm`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {BASE_URL}/adm
            </a>{" "}
            (aba Configuração).
          </p>
        </section>

        <section id="cpf-nao-encontrado" className="scroll-mt-6 space-y-2 pt-8">
          <h2 className="text-xl font-semibold">
            4. CPF não encontrado, e agora?
          </h2>
          <p>
            Se o acampante digitou o CPF errado no cadastro, ele não conseguirá
            fazer o check-in. Use a aba &quot;Corrigir cadastro&quot; na
            administração: digite o nome (ou parte do nome) no campo &quot;Buscar por nome&quot; — a busca aceita vários termos separados por espaço. Quando
            encontrar, clique em &quot;Corrigir CPF&quot;, ajuste o número e
            salve. Depois oriente o acampante a fazer o check-in normalmente.
          </p>
          <p>
            Se a pessoa não aparecer na busca, use &quot;Adicionar usuário&quot;:
            cadastre com nome e CPF corretos e, ao salvar, ela já será marcada
            como presente. Avise que em breve ela será designada a um time e a
            um pequeno grupo.
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a
              href={`${BASE_URL}/adm`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {BASE_URL}/adm
            </a>{" "}
            (aba Corrigir cadastro).
          </p>
        </section>

        <section
          id="cadastros-incompletos"
          className="scroll-mt-6 space-y-2 pt-8"
        >
          <h2 className="text-xl font-semibold">5. Cadastros incompletos</h2>
          <p>
            Na aba &quot;Cadastros incompletos&quot; há duas listas: uma de
            quem ainda não tem <strong>time</strong> e outra de quem ainda não
            tem <strong>pequeno grupo</strong>. O mesmo acampante pode aparecer
            nas duas até que tudo seja preenchido. Cada responsável usa a lista
            da sua área (times ou PGs) e atribui as informações pelos botões
            &quot;Atribuir time&quot; ou &quot;Atribuir PG&quot;.
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <a
              href={`${BASE_URL}/adm`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {BASE_URL}/adm
            </a>{" "}
            (aba Cadastros incompletos).
          </p>
        </section>
      </article>
    </div>
  )
}
