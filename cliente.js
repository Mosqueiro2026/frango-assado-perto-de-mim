
/* Frango Assado Perto de Mim
   Cadastro, login e avaliações dos consumidores.
*/

const clienteSupabase = window.supabase.createClient(
  "https://mublqamdknlkrhtzzwfj.supabase.co",
  "sb_publishable_zCQTgOMfeHlIkuaiZ5CW0g_pCku9j85"
);

const formCliente = document.getElementById("formCliente");
const emailCliente = document.getElementById("emailCliente");
const senhaCliente = document.getElementById("senhaCliente");
const botaoCadastrar = document.getElementById("botaoCadastrar");
const botaoSair = document.getElementById("botaoSair");
const clienteConectado = document.getElementById("clienteConectado");
const identificacaoCliente = document.getElementById("identificacaoCliente");
const mensagemCliente = document.getElementById("mensagemCliente");

function informarCliente(mensagem) {
  if (mensagemCliente) {
    mensagemCliente.textContent = mensagem;
  }
}

async function cadastrarCliente(email, senha) {
  const { data, error } = await clienteSupabase.auth.signUp({
    email: email.trim(),
    password: senha
  });

  if (error) throw new Error(error.message);

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

async function atualizarAreaCliente() {
  const usuario = await obterClienteAtual();

  if (formCliente) formCliente.hidden = !!usuario;
  if (clienteConectado) clienteConectado.hidden = !usuario;

  if (identificacaoCliente) {
    identificacaoCliente.textContent = usuario
      ? "Conectado: " + usuario.email
      : "";
  }

  return usuario;
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

if (formCliente) {
  formCliente.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    informarCliente("Entrando...");

    try {
      await entrarCliente(emailCliente.value, senhaCliente.value);
      senhaCliente.value = "";
      await atualizarAreaCliente();
      informarCliente("Você entrou na sua conta.");
    } catch (erro) {
      informarCliente(erro.message);
    }
  });
}

if (botaoCadastrar) {
  botaoCadastrar.addEventListener("click", async () => {
    informarCliente("Criando conta...");

    try {
      const resultado = await cadastrarCliente(
        emailCliente.value,
        senhaCliente.value
      );

      senhaCliente.value = "";
      await atualizarAreaCliente();

      informarCliente(resultado.session
        ? "Conta criada. Você já pode avaliar."
        : "Cadastro recebido. Confira seu e-mail para confirmar a conta.");
    } catch (erro) {
      informarCliente(erro.message);
    }
  });
}

if (botaoSair) {
  botaoSair.addEventListener("click", async () => {
    try {
      await sairCliente();
      await atualizarAreaCliente();
      informarCliente("Você saiu da conta.");
    } catch (erro) {
      informarCliente(erro.message);
    }
  });
}

clienteSupabase.auth.onAuthStateChange(() => {
  atualizarAreaCliente();
});

atualizarAreaCliente();
