
/* Frango Assado Perto de Mim
   Acesso e avaliações dos consumidores.
   Requer supabase-js v2 carregado antes deste arquivo.
*/

const clienteSupabase = window.supabase.createClient(
  "https://mublqamdknlkrhtzzwfj.supabase.co",
  "sb_publishable_zCQTgOMfeHlIkuaiZ5CW0g_pCku9j85"
);

async function cadastrarCliente(email, senha) {
  const { data, error } = await clienteSupabase.auth.signUp({
    email: email.trim(),
    password: senha
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function entrarCliente(email, senha) {
  const { data, error } =
    await clienteSupabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha
    });

  if (error) {
    throw new Error("Confira seu e-mail e senha.");
  }

  return data.user;
}

async function sairCliente() {
  const { error } = await clienteSupabase.auth.signOut();

  if (error) {
    throw new Error("Não foi possível sair da conta.");
  }

  return true;
}

async function obterClienteAtual() {
  const { data, error } = await clienteSupabase.auth.getUser();

  if (error) return null;

  return data.user;
}

async function avaliarProduto(produtoId, nota) {
  const usuario = await obterClienteAtual();

  if (!usuario) {
    throw new Error("Entre na sua conta para avaliar.");
  }

  const id = Number(produtoId);
  const estrelas = Number(nota);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Produto inválido.");
  }

  if (!Number.isInteger(estrelas) ||
      estrelas < 1 || estrelas > 5) {
    throw new Error("Escolha de 1 a 5 estrelas.");
  }

  const { error } = await clienteSupabase
    .from("avaliacoes")
    .insert({
      produto_id: id,
      usuario_id: usuario.id,
      nota: estrelas
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Você já avaliou este produto.");
    }

    throw new Error("Não foi possível registrar a avaliação.");
  }

  return true;
}
