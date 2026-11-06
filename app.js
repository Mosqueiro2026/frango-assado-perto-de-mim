
/*
  Frango Assado Perto de Mim
  Catalogo, fotos, avaliacoes, pedidos e proximidade.
  Administracao e vendedores permanecem separados.
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
let localizacaoCliente = null;
let buscaPorProximidade = false;

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

function mensagemPedido(produto, quantidade) {
  const preco = Number(produto.preco);

  const precoValido =
    produto.preco !== null &&
    produto.preco !== undefined &&
    produto.preco !== "" &&
    Number.isFinite(preco) &&
    preco >= 0;

  const total = precoValido
    ? formatarPreco(preco * quantidade)
    : "A confirmar com o vendedor";

  const unidade = quantidade === 1
    ? "unidade"
    : "unidades";

  return (
    `Olá! Gostaria de encomendar ${quantidade} ${unidade} de ` +
    `${produto.nome || "produto"}.\n` +
    `Valor unitário: ${formatarPreco(produto.preco)}.\n` +
    `Total: ${total}.\n` +
    `Vi no Frango Assado Perto de Mim. ` +
    `Aguardo a confirmação do pedido.`
  );
}

function criarPedido(produto, vendedor) {
  const telefone =
    normalizarTelefone(vendedor.whatsapp) ||
    normalizarTelefone(vendedor.whatsapp2);

  if (!telefone) return "";

  const url =
    `https://wa.me/55${telefone}?text=` +
    encodeURIComponent(mensagemPedido(produto, 1));

  return `
    <div class="preparar-pedido"
         data-pedido-produto="${produto.id}"
         style="margin:12px 0;">

      <label for="quantidade-produto-${produto.id}">
        <strong>Quantidade:</strong>
      </label>

      <input
        id="quantidade-produto-${produto.id}"
        type="number"
        min="1"
        max="99"
        step="1"
        value="1"
        data-quantidade-pedido="${produto.id}"
        style="width:75px;padding:6px;margin:0 8px;"
      >

      <p data-total-pedido="${produto.id}">
        <strong>
          Total: ${formatarPreco(produto.preco)}
        </strong>
      </p>

      <a
        data-link-pedido="${produto.id}"
        href="${textoSeguro(url)}"
        target="_blank"
        rel="noopener noreferrer">
        💬 Enviar pedido pelo WhatsApp
      </a>

      <p class="observacao">
        Pedido sujeito à confirmação do vendedor.
      </p>
    </div>
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
    notas.reduce(
      (soma, avaliacao) => soma + Number(avaliacao.nota),
      0
    ) / notas.length;

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
        Avalie de 1 a 5 estrelas,
        sem precisar criar uma conta.
      </p>
    </div>
  `;
}

/*
  LOCALIZACAO E PROXIMIDADE
*/

function coordenadaValida(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === "" ||
    longitude === ""
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const radianos = graus => graus * Math.PI / 180;
  const raioTerraKm = 6371;

  const diferencaLatitude = radianos(lat2 - lat1);
  const diferencaLongitude = radianos(lon2 - lon1);

  const a =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(radianos(lat1)) *
    Math.cos(radianos(lat2)) *
    Math.sin(diferencaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(Math.max(0, 1 - a))
  );

  return raioTerraKm * c;
}

function distanciaVendedor(vendedor) {
  if (
    !localizacaoCliente ||
    !coordenadaValida(vendedor.latitude, vendedor.longitude)
  ) {
    return null;
  }

  return calcularDistanciaKm(
    localizacaoCliente.latitude,
    localizacaoCliente.longitude,
    Number(vendedor.latitude),
    Number(vendedor.longitude)
  );
}

function mostrarDistancia(vendedor) {
  const distancia = distanciaVendedor(vendedor);

  if (distancia === null) {
    return buscaPorProximidade
      ? '<p class="observacao">Distância não cadastrada.</p>'
      : "";
  }

  const distanciaFormatada = distancia.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }
  );

  return `
    <p>
      📍 <strong>Distância aproximada:</strong>
      ${distanciaFormatada} km em linha reta
    </p>
  `;
}

function prepararBuscaProximidade() {
  const secaoBairros = document.querySelector(".bairros");

  if (!secaoBairros) return;

  const area = document.createElement("div");
  area.id = "areaProximidade";
  area.style.margin = "16px 0";
  area.style.padding = "12px";
  area.style.border = "1px solid #ddd";
  area.style.borderRadius = "10px";

  area.innerHTML = `
    <h3>📍 Vendedores perto de mim</h3>

    <p>
      Encontre os vendedores mais próximos,
      usando a localização do seu aparelho.
    </p>

    <button type="button" id="botaoProximidade">
      📍 Encontrar vendedores perto de mim
    </button>

    <button type="button"
            id="botaoLimparProximidade"
            hidden>
      Voltar à busca por bairro
    </button>

    <p id="mensagemProximidade"
       role="status"
       aria-live="polite"></p>
  `;

  secaoBairros.appendChild(area);

  const botao = document.getElementById("botaoProximidade");
  const limpar = document.getElementById(
    "botaoLimparProximidade"
  );
  const mensagem = document.getElementById(
    "mensagemProximidade"
  );

  botao.addEventListener("click", () => {
    if (!navigator.geolocation) {
      mensagem.textContent =
        "Este navegador não permite consultar a localização.";
      return;
    }

    botao.disabled = true;
    mensagem.textContent =
      "Aguardando autorização para consultar sua localização...";

    navigator.geolocation.getCurrentPosition(
      posicao => {
        localizacaoCliente = {
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude
        };

        buscaPorProximidade = true;
        bairroSelecionado = "Todos";

        mensagem.textContent =
          "Vendedores organizados pela distância aproximada. " +
          "As distâncias são calculadas em linha reta.";

        limpar.hidden = false;
        botao.disabled = false;

        renderizar();
      },
      erro => {
        botao.disabled = false;

        if (erro.code === 1) {
          mensagem.textContent =
            "Localização não autorizada. " +
            "Você pode continuar pesquisando por bairro.";
        } else if (erro.code === 2) {
          mensagem.textContent =
            "Não foi possível identificar sua localização. " +
            "Continue pesquisando por bairro.";
        } else {
          mensagem.textContent =
            "A consulta de localização demorou demais. " +
            "Tente novamente se desejar.";
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  });

  limpar.addEventListener("click", () => {
    localizacaoCliente = null;
    buscaPorProximidade = false;
    bairroSelecionado = "Todos";

    limpar.hidden = true;
    mensagem.textContent =
      "Busca por proximidade desativada.";

    renderizar();
  });
}

/*
  PRODUTOS E VENDEDORES
*/

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

/* =========================================
   BUSCA DINÂMICA POR BAIRRO
   ========================================= */

const campoBuscaBairro =
  document.getElementById("campoBuscaBairro");

const botaoBuscarBairro =
  document.getElementById("botaoBuscarBairro");

const bairrosDisponiveis =
  document.getElementById("bairrosDisponiveis");

const mensagemBuscaBairro =
  document.getElementById("mensagemBuscaBairro");

function normalizarNomeBairro(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function atualizarBairrosDisponiveis() {
  if (!bairrosDisponiveis) return;

  const bairros = [...new Set(
    vendedores
      .map(vendedor => String(vendedor.bairro || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));

  bairrosDisponiveis.replaceChildren();

  bairros.forEach(bairro => {
    const opcao = document.createElement("option");
    opcao.value = bairro;
    bairrosDisponiveis.appendChild(opcao);
  });
}

function pesquisarBairro() {
  if (!campoBuscaBairro) return;

  const pesquisa = normalizarNomeBairro(
    campoBuscaBairro.value
  );

  if (!pesquisa) {
    mensagemBuscaBairro.textContent =
      "Digite o nome de um bairro para pesquisar.";
    campoBuscaBairro.focus();
    return;
  }

  const encontrados = vendedores.filter(vendedor =>
    normalizarNomeBairro(vendedor.bairro).includes(pesquisa)
  );

  if (!encontrados.length) {
    mensagemBuscaBairro.textContent =
      "Ainda não encontramos vendedores nesse bairro.";
    lista.innerHTML =
      "<p>Nenhum vendedor encontrado para essa pesquisa.</p>";
    return;
  }

  buscaPorProximidade = false;
  localizacaoCliente = null;
  bairroSelecionado = "Todos";

  const botaoLimpar =
    document.getElementById("botaoLimparProximidade");

  if (botaoLimpar) botaoLimpar.hidden = true;

  const mensagemProximidade =
    document.getElementById("mensagemProximidade");

  if (mensagemProximidade) {
    mensagemProximidade.textContent = "";
  }

  mensagemBuscaBairro.textContent =
    `${encontrados.length} vendedor(es) encontrado(s).`;

  // Mantém a apresentação original dos produtos,
  // preços, fotos, contatos e avaliações.
  const vendedoresOriginais = vendedores;

  try {
    vendedores = encontrados;
    renderizar();
  } finally {
    vendedores = vendedoresOriginais;
  }
}

if (botaoBuscarBairro && campoBuscaBairro) {
  botaoBuscarBairro.addEventListener(
    "click",
    pesquisarBairro
  );

  campoBuscaBairro.addEventListener(
    "keydown",
    evento => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        pesquisarBairro();
      }
    }
  );
}

// Atualiza as sugestões quando o catálogo
// terminar de carregar.
const carregarVendedoresOriginal = carregarVendedores;

carregarVendedores = async function () {
  await carregarVendedoresOriginal();
  atualizarBairrosDisponiveis();
};


function renderizar() {
  let filtrados = vendedores.filter(
    vendedor =>
      bairroSelecionado === "Todos" ||
      vendedor.bairro === bairroSelecionado
  );

  if (buscaPorProximidade && localizacaoCliente) {
    filtrados = [...filtrados].sort((primeiro, segundo) => {
      const distanciaPrimeiro = distanciaVendedor(primeiro);
      const distanciaSegundo = distanciaVendedor(segundo);

      if (distanciaPrimeiro === null) return 1;
      if (distanciaSegundo === null) return -1;

      return distanciaPrimeiro - distanciaSegundo;
    });
  }

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

      ${mostrarDistancia(vendedor)}

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
      "select=id,nome,bairro,endereco,whatsapp,whatsapp2," +
      "latitude,longitude&ativo=eq.true&order=nome.asc"
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

/*
  EVENTOS DA PAGINA
*/

document.querySelectorAll("[data-bairro]").forEach(botao => {
  botao.addEventListener("click", () => {
    bairroSelecionado = botao.dataset.bairro;

    if (buscaPorProximidade) {
      buscaPorProximidade = false;
      localizacaoCliente = null;

      const limpar = document.getElementById(
        "botaoLimparProximidade"
      );

      const mensagem = document.getElementById(
        "mensagemProximidade"
      );

      if (limpar) limpar.hidden = true;

      if (mensagem) {
        mensagem.textContent =
          "Busca por bairro selecionada.";
      }
    }

    renderizar();
  });
});

// Atualiza o valor total e o pedido pelo WhatsApp.
lista.addEventListener("input", evento => {
  const campo = evento.target.closest(
    "[data-quantidade-pedido]"
  );

  if (!campo) return;

  const produtoId = String(campo.dataset.quantidadePedido);

  const produto = produtos.find(
    item => String(item.id) === produtoId
  );

  if (!produto) return;

  const vendedor = vendedores.find(
    item => String(item.id) === String(produto.vendedor_id)
  );

  if (!vendedor) return;

  const quantidade = Number(campo.value);

  const valido =
    campo.value.trim() !== "" &&
    Number.isInteger(quantidade) &&
    quantidade >= 1 &&
    quantidade <= 99;

  const area = campo.closest("[data-pedido-produto]");
  const total = area?.querySelector("[data-total-pedido]");
  const link = area?.querySelector("[data-link-pedido]");

  if (!total || !link) return;

  if (!valido) {
    total.textContent =
      "Informe uma quantidade de 1 a 99.";

    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    return;
  }

  const preco = Number(produto.preco);

  const precoValido =
    produto.preco !== null &&
    produto.preco !== undefined &&
    produto.preco !== "" &&
    Number.isFinite(preco) &&
    preco >= 0;

  total.textContent = "Total: " + (
    precoValido
      ? formatarPreco(preco * quantidade)
      : "A confirmar com o vendedor"
  );

  const telefone =
    normalizarTelefone(vendedor.whatsapp) ||
    normalizarTelefone(vendedor.whatsapp2);

  if (!telefone) return;

  link.href =
    `https://wa.me/55${telefone}?text=` +
    encodeURIComponent(
      mensagemPedido(produto, quantidade)
    );

  link.removeAttribute("aria-disabled");
});

// Impede pedidos com quantidade invalida.
lista.addEventListener("click", evento => {
  const link = evento.target.closest("[data-link-pedido]");

  if (link && !link.hasAttribute("href")) {
    evento.preventDefault();
    alert("Informe uma quantidade de 1 a 99.");
  }
});

// Avaliacoes sem cadastro.
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

// Inicializacao.
prepararBuscaProximidade();
carregarVendedores();
