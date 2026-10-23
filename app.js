/* Versão pública: somente consulta, sem gestão, sem dados privados. */
"use strict";
const vendedores = [{
  nome: "Abedel Frango Assado",
  bairro: "SetVille",
  preco: 50,
  endereco: "Av. Mário de Siqueira Machado, nº 54 – Em frente ao Ponto Certo",
  horario: "A confirmar",
  disponibilidade: "A confirmar",
  contato: "A confirmar"
}];
function textoSeguro(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function mostrarVendedores(bairro = "Todos") {
  const lista = document.getElementById("listaVendedores");
  const encontrados = vendedores.filter(v => bairro === "Todos" || v.bairro === bairro);
  if (!encontrados.length) {
    lista.innerHTML = "<p>Nenhum vendedor confirmado para este bairro até o momento.</p>";
    return;
  }
  lista.innerHTML = encontrados.map(v => `
    <article class="vendedor">
      <h3>${textoSeguro(v.nome)}</h3>
      <p><strong>Bairro:</strong> ${textoSeguro(v.bairro)}</p>
      <p><strong>Preço informado:</strong> ${Number(v.preco).toLocaleString("pt-BR", {style:"currency", currency:"BRL"})}</p>
      <p><strong>Endereço:</strong> ${textoSeguro(v.endereco)}</p>
      <p><strong>Horário:</strong> ${textoSeguro(v.horario)}</p>
      <p><strong>Disponibilidade:</strong> ${textoSeguro(v.disponibilidade)}</p>
      <p><strong>Contato:</strong> ${textoSeguro(v.contato)}</p>
      <p>Confirme as informações diretamente com o vendedor antes de sair.</p>
    </article>
  `).join("");
}
document.querySelectorAll("[data-bairro]").forEach(botao => {
  botao.addEventListener("click", () => mostrarVendedores(botao.dataset.bairro));
});
mostrarVendedores();
