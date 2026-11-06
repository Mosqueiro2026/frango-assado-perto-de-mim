
/*
  Frango Assado Perto de Mim
  Avaliações sem cadastro de consumidor.

  Uma avaliação por produto por dia,
  utilizando um identificador salvo no navegador.
*/

const AVALIACAO_SUPABASE_URL =
  "https://mublqamdknlkrhtzzwfj.supabase.co";

const AVALIACAO_SUPABASE_KEY =
  "sb_publishable_zCQTgOMfeHlIkuaiZ5CW0g_pCku9j85";

const CHAVE_VISITANTE =
  "frango_assado_visitante_id";

function criarIdentificadorVisitante() {
  if (!globalThis.crypto ||
      typeof globalThis.crypto.randomUUID !== "function") {
    throw new Error(
      "Este navegador não oferece identificação segura."
    );
  }

  return globalThis.crypto.randomUUID();
}

function obterIdentificadorVisitante() {
  try {
    let identificador =
      localStorage.getItem(CHAVE_VISITANTE);

    const formatoUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!identificador ||
        !formatoUUID.test(identificador)) {
      identificador = criarIdentificadorVisitante();

      localStorage.setItem(
        CHAVE_VISITANTE,
        identificador
      );
    }

    return identificador;
  } catch {
    throw new Error(
      "Não foi possível guardar sua identificação neste navegador."
    );
  }
}

function dataAtualBrasilia() {
  const partes = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map(parte => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function chaveAvaliacaoDiaria(produtoId) {
  return (
    "frango_avaliacao_" +
    String(produtoId) +
    "_" +
    dataAtualBrasilia()
  );
}

async function avaliarProduto(produtoId, nota) {
  const id = Number(produtoId);
  const estrelas = Number(nota);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Produto inválido.");
  }

  if (!Number.isInteger(estrelas) ||
      estrelas < 1 || estrelas > 5) {
    throw new Error("Escolha de 1 a 5 estrelas.");
  }

  const chave = chaveAvaliacaoDiaria(id);

  if (localStorage.getItem(chave) === "sim") {
    throw new Error(
      "Você já avaliou este produto hoje. " +
      "Poderá avaliar novamente em outro dia, " +
      "após uma nova compra."
    );
  }

  const visitanteId =
    obterIdentificadorVisitante();

  const resposta = await fetch(
    AVALIACAO_SUPABASE_URL +
    "/rest/v1/rpc/registrar_avaliacao_visitante",
    {
      method: "POST",
      headers: {
        apikey: AVALIACAO_SUPABASE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        p_produto_id: id,
        p_nota: estrelas,
        p_visitante_id: visitanteId
      })
    }
  );

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));

    if (erro.code === "23505") {
      localStorage.setItem(chave, "sim");

      throw new Error(
        "Você já avaliou este produto hoje. " +
        "Poderá avaliar novamente em outro dia."
      );
    }

    throw new Error(
      "Não foi possível registrar sua avaliação. " +
      "Tente novamente mais tarde."
    );
  }

  localStorage.setItem(chave, "sim");

  return true;
}
