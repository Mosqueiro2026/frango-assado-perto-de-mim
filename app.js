/* Versão pública: somente leitura via Supabase; sem painel de administração. */
const SUPABASE_URL = "https://mublqamdknlkrhtzzwfj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zCQTgOMfeHlIkuaiZ5CW0g_pCku9j85";
const lista = document.getElementById("listaVendedores");
let vendedores = [];
let bairroSelecionado = "Todos";
function textoSeguro(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}
function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return "A confirmar";
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toLocaleString("pt-BR", {style:"currency", currency:"BRL"}) : "A confirmar";
}
function renderizar() {
  const filtrados = vendedores.filter(v => bairroSelecionado === "Todos" || v.bairro === bairroSelecionado);
  if (!filtrados.length) { lista.innerHTML = "<p>Nenhum vendedor cadastrado neste bairro ainda.</p>"; return; }
  lista.innerHTML = filtrados.map(v => `<article class="vendedor-card">
    <h3>${textoSeguro(v.nome || "Vendedor")}</h3>
    <p><strong>Bairro:</strong> ${textoSeguro(v.bairro || "A confirmar")}</p>
    <p><strong>Preço:</strong> ${formatarPreco(v.preco)}</p>
    <p><strong>Endereço:</strong> ${textoSeguro(v.endereco || "A confirmar")}</p>
    <p class="observacao">Confirme preço, horário e disponibilidade diretamente com o vendedor.</p>
  </article>`).join("");
}
async function carregarVendedores() {
  lista.innerHTML = "<p>Carregando vendedores...</p>";
  try {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/vendedores?select=nome,bairro,preco,endereco&order=nome.asc`, {
      headers: {"apikey": SUPABASE_PUBLISHABLE_KEY, "Accept": "application/json"},
      cache: "no-store"
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const dados = await resposta.json();
    if (!Array.isArray(dados)) throw new Error("Resposta inesperada");
    vendedores = dados;
    renderizar();
  } catch (erro) {
    console.error("Falha ao consultar vendedores:", erro);
    lista.innerHTML = `<p>Não foi possível consultar os vendedores agora. Confira a conexão e tente novamente.</p><button type="button" id="tentarNovamente">Tentar novamente</button>`;
    document.getElementById("tentarNovamente").addEventListener("click", carregarVendedores);
  }
}
document.querySelectorAll("[data-bairro]").forEach(botao => {
  botao.addEventListener("click", () => { bairroSelecionado = botao.dataset.bairro; renderizar(); });
});
carregarVendedores();
