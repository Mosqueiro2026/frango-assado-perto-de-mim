
/* Frango Assado Perto de Mim
   Catálogo público, fotografias e avaliações.
   Administração e vendedores permanecem separados.
*/

const SUPABASE_URL =
  "https://mublqamdknlkrhtzzwfj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_zCQTgOMfeHlIkuaiZ5CW0g_pCku9j85";

const lista = document.getElementById("listaVendedores");

let vendedores = [];
let produtos = [];
let avaliacoes = [];
let bairroSelecionado = "Todos";

function textoSeguro(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[caractere]));
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "A confirmar";
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    : "A confirmar";
}

function normalizarTelefone(valor) {
  let numero = String(valor ?? "").replace(/\D/g, "");

  if (numero.startsWith("55") && numero.length > 11) {
    numero = numero.substring(2);
  }

  return /^\d{10,11}$/.test(numero) ? numero : null;
}

function criarContato(valor, identificacao) {
  const telefone = normalizarTelefone(valor);

  if (!telefone) return "";

  return `
    <div class="contato-vendedor">
      <p>
        <strong>${textoSeguro(identificacao)}:</strong>
        ${textoSeguro(telefone)}
      </p>
      <p>
        <a href="https://wa.me/55${telefone}"
           target="_blank"
           rel="noopener noreferrer">
          💬 WhatsApp
        </a>
        &nbsp; | &nbsp;
        <a href="tel:+55${telefone}">
          📞 Ligar
        </a>
      </p>
    </div>
  `;
}

function criarPedido(produto, vendedor) {
  const telefone =
    normalizarTelefone(vendedor.whatsapp) ||
    normalizarTelefone(vendedor.whatsapp2);

  if (!telefone) return "";

  const mensagem =
    `Olá! Gostaria de pedir ${produto.nome} ` +
    `(${formatarPreco(produto.preco)}). ` +
    `Vi no Frango Assado Perto de Mim.`;

  return `
    <a href="https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}"
       target="_blank"
       rel="noopener noreferrer">
      💬 Pedir pelo WhatsApp
    </a>
  `;
}

function obterFotoSegura(valor) {
  if (!valor || typeof valor !== "string") return "";

  try {
    const url = new URL(valor);
    const origemPermitida = new URL(SUPABASE_URL).origin;
    const caminhoPermitido =
      "/storage/v1/object/public/fotos-produtos/";

    if (
      url.protocol !== "https:" ||
      url.origin !== origemPermitida ||
      !url.pathname.startsWith(caminhoPermitido)
    ) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function criarFoto(produto) {
  const foto = obterFotoSegura(produto.foto_url);

  if (!foto) {
    return `
      <div class="produto-foto"
           aria-label="Foto não cadastrada"
           style="font-size:40px;text-align:center;padding:12px;">
        🍗
      </div>
    `;
  }

  return `
    <div class="produto-foto">
      <img
        src="${textoSeguro(foto)}"
        alt="Fotografia de ${textoSeguro(produto.nome || "produto")}"
        loading="lazy"
        style="width:100%;max-width:280px;height:auto;
               max-height:220px;object-fit:cover;
               border-radius:10px;"
        onerror="this.hidden=true;this.parentElement.textContent='🍗';"
      >
    </div>
  `;
}

function mostrarAvaliacao(produtoId) {
  const notas = avaliacoes.filter(
    avaliacao =>
      String(avaliacao.produto_id) === String(produtoId)
  );

  if (!notas.length) {
    return '<p class="observacao">⭐ Ainda sem avaliações</p>';
  }

  const media =
    notas.reduce((soma, avaliacao) =>
      soma + Number(avaliacao.nota), 0) / notas.length;

  const quantidadeEstrelas = Math.round(media);

  const estrelas =
    "★".repeat(quantidadeEstrelas) +
    "☆".repeat(5 - quantidadeEstrelas);

  const mediaFormatada = media.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  return `
    <p aria-label="Avaliação média ${mediaFormatada} de 5">
      ⭐ ${estrelas}
      ${mediaFormatada}/5
      (${notas.length}
      ${notas.length === 1 ? "avaliação" : "avaliações"})
    </p>
  `;
}

function criarBotoesAvaliacao(produto) {
  return `
    <div class="avaliacao-produto">
      <p><strong>Dê sua nota:</strong></p>

      <div role="group"
           aria-label="Avaliar ${textoSeguro(produto.nome || "produto")}">
        ${[1, 2, 3, 4, 5].map(nota => `
          <button
            type="button"
            class="botao-estrela"
            data-avaliar-produto="${produto.id}"
            data-nota="${nota}"
            aria-label="Avaliar com ${nota} estrelas"
            title="${nota} estrela${nota > 1 ? "s" : ""}"
            style="font-size:24px;cursor:pointer;">
            ★
          </button>
        `).join("")}
      </div>

      <p class="observacao">
        Entre na sua conta para registrar sua avaliação.
      </p>
    </div>
  `;
}

function renderizarProdutos(vendedor) {
  const itens = produtos.filter(
    produto =>
      String(produto.vendedor_id) === String(vendedor.id)
  );

  if (!itens.length) {
    return `
      <p class="observacao">
        Cardápio em preparação.
        Consulte o vendedor pelo WhatsApp.
      </p>
    `;
  }

  return `
    <div class="catalogo-produtos">
      <h4>Cardápio</h4>

      ${itens.map(produto => `
        <div class="produto-card"
             style="border:1px solid #e7e5e4;
                    border-radius:10px;
                    padding:12px;margin:12px 0;">

          ${criarFoto(produto)}

          <div class="produto-detalhes">
            <strong>
              ${textoSeguro(produto.nome || "Produto")}
            </strong>

            ${produto.descricao
              ? `<p>${textoSeguro(produto.descricao)}</p>`
              : ""}

            <p>
              <strong>${formatarPreco(produto.preco)}</strong>
            </p>

            ${mostrarAvaliacao(produto.id)}

            ${criarBotoesAvaliacao(produto)}

            <p>
              ${produto.disponivel === true
                ? "Disponível"
                : "Indisponível"}
            </p>

            ${produto.disponivel === true
              ? criarPedido(produto, vendedor)
              : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderizar() {
  const filtrados = vendedores.filter(
    vendedor =>
      bairroSelecionado === "Todos" ||
      vendedor.bairro === bairroSelecionado
  );

  if (!filtrados.length) {
    lista.innerHTML =
      "<p>Nenhum vendedor cadastrado neste bairro ainda.</p>";
    return;
  }

  lista.innerHTML = filtrados.map(vendedor => `
    <article class="vendedor-card">

      <h3>${textoSeguro(vendedor.nome || "Vendedor")}</h3>

      <p>
        <strong>Bairro:</strong>
        ${textoSeguro(vendedor.bairro || "A confirmar")}
      </p>

      <p>
        <strong>Endereço:</strong>
        ${textoSeguro(vendedor.endereco || "A confirmar")}
      </p>

      ${renderizarProdutos(vendedor)}

      ${criarContato(vendedor.whatsapp, "Contato 1")}
      ${criarContato(vendedor.whatsapp2, "Contato 2")}

      <p class="observacao">
        Confirme preços, horários e disponibilidade
        diretamente com o vendedor.
      </p>

    </article>
  `).join("");
}

async function consultarTabela(tabela, parametros) {
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${tabela}?${parametros}`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      },
      cache: "no-store"
    }
  );

  if (!resposta.ok) {
    throw new Error(
      `Erro ao consultar ${tabela}: HTTP ${resposta.status}`
    );
  }

  const dados = await resposta.json();

  if (!Array.isArray(dados)) {
    throw new Error("Resposta inesperada.");
  }

  return dados;
}

async function carregarVendedores() {
  lista.innerHTML =
    "<p>Carregando vendedores e produtos...</p>";

  try {
    const dadosVendedores = await consultarTabela(
      "vendedores",
      "select=id,nome,bairro,endereco,whatsapp,whatsapp2" +
      "&ativo=eq.true&order=nome.asc"
    );

    const dadosProdutos = await consultarTabela(
      "produtos",
      "select=id,vendedor_id,nome,descricao,categoria," +
      "preco,disponivel,foto_url&order=id.asc"
    );

    let dadosAvaliacoes = [];

    try {
      dadosAvaliacoes = await consultarTabela(
        "avaliacoes",
        "select=produto_id,nota&order=id.asc"
      );
    } catch (erroAvaliacoes) {
      console.warn(
        "Avaliações indisponíveis:",
        erroAvaliacoes
      );
    }

    vendedores = dadosVendedores;

    const vendedoresAtivos = new Set(
      dadosVendedores.map(vendedor => String(vendedor.id))
    );

    produtos = dadosProdutos.filter(
      produto =>
        vendedoresAtivos.has(String(produto.vendedor_id))
    );

    avaliacoes = dadosAvaliacoes;

    renderizar();

  } catch (erro) {
    console.error("Falha ao carregar catálogo:", erro);

    lista.innerHTML = `
      <p>
        Não foi possível consultar o catálogo agora.
        Confira a conexão e tente novamente.
      </p>
      <button type="button" id="tentarNovamente">
        Tentar novamente
      </button>
    `;

    document.getElementById("tentarNovamente")
      .addEventListener("click", carregarVendedores);
  }
}

document.querySelectorAll("[data-bairro]").forEach(botao => {
  botao.addEventListener("click", () => {
    bairroSelecionado = botao.dataset.bairro;
    renderizar();
  });
});

lista.addEventListener("click", async evento => {
  const botao = evento.target.closest(
    "[data-avaliar-produto]"
  );

  if (!botao || botao.disabled) return;

  const produtoId = Number(
    botao.dataset.avaliarProduto
  );

  const nota = Number(botao.dataset.nota);

  const botoes = lista.querySelectorAll(
    `[data-avaliar-produto="${produtoId}"]`
  );

  botoes.forEach(item => item.disabled = true);

  try {
    if (typeof avaliarProduto !== "function") {
      throw new Error(
        "Sistema de avaliações indisponível."
      );
    }

    await avaliarProduto(produtoId, nota);

    alert("Obrigado! Sua avaliação foi registrada.");

    await carregarVendedores();

  } catch (erro) {
    alert(erro.message);
  } finally {
    botoes.forEach(item => item.disabled = false);
  }
});

carregarVendedores();
