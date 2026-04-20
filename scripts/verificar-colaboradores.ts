// Script de diagnóstico para verificar colaboradores no Clockify
// Compara a lista esperada com os usuários retornados pela API

import { fetchFromClockify } from "../services/clockifyClient";
import { CLOCKIFY_API_TOKEN, CLOCKIFY_WORKSPACE_ID } from "../config/clockify";

interface ClockifyUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

// Lista de colaboradores esperados (conforme fornecido pelo usuário)
const COLABORADORES_ESPERADOS = [
  "CARINA RODRIGUES SILVA",
  "CLAUDIENE DE JESUS ALENCAR",
  "FLORENCIA CRISTINA SILVA NASCIMENTO",
  "FERNANDO CARLOS BARBOSA DE SOUSA",
  "GYRLIANE SANTOS DE SALES",
  "LAÍS BIZERRA MENDES",
  "LAIZE DOS SANTOS RODRIGUES",
  "GUSTAVO ALVES DA COSTA TOLEDO",
  "MARGARIDA NIÉGELA DA COSTA SOUZA",
  "MARIENE ALMEIDA TORRES",
  "HUGO FERNANDES FERREIRA",
  "FRANCISCO NERES DE LIMA",
  "JOÃO MARCELO HOLDERBAUM",
  "JULIANA VICENTE ALENCAR",
  "GABRIEL MONTENEGRO DE ALMEIDA",
  "HENRIQUE LIMA DA SILVA",
  "LAVINIA OLIVEIRA BRAGA",
  "ISMAEL ALVES GADELHA",
  "LIZABETH SILVA OLIVEIRA",
  "LUIZ TIAGO SOARES DE SOUZA",
  "MAIRA GLAUCIA DE CARVALHO SOUSA",
  "JOÃO GABRIEL DE OLIVEIRA NOBRE",
  "LEOMYR SÂNGELO ALVES DA SILVA",
  "MATEUS SOUSA GOMES",
  "MATHEUS FELDSTEIN HADDAD",
  "RAISSA CAROLINE DIAS FERREIRA",
  "RICARDO RODRIGUES DA SILVEIRA FILHO",
  "VITOR FERREIRA SOUZA",
  "VIVIAN RODRIGUES LOPES",
  "WILGNER DOS SANTOS SILVA",
];

/**
 * Normaliza nome para comparação (remove acentos, converte para maiúsculas, remove espaços extras)
 */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove sufixo " | SETEG" do nome
 */
function limparSufixo(nome: string): string {
  return nome.replace(/\s*\|\s*SETEG\s*$/i, "").trim();
}

async function verificarColaboradores() {
  console.log("🔍 Buscando usuários na API do Clockify...\n");

  // Busca todos os usuários do workspace
  const resultado = await fetchFromClockify<ClockifyUser[]>(
    `/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?limit=200`,
    CLOCKIFY_API_TOKEN,
  );

  if ("status" in resultado) {
    console.error("❌ Erro ao buscar usuários:", resultado.message);
    return;
  }

  const usuarios = resultado.data;
  console.log(`✅ Total de usuários encontrados: ${usuarios.length}\n`);

  // Cria mapa de usuários normalizados
  const mapaUsuarios = new Map<string, ClockifyUser>();
  for (const usuario of usuarios) {
    const nomeLimpo = limparSufixo(usuario.name);
    const nomeNormalizado = normalizarNome(nomeLimpo);
    mapaUsuarios.set(nomeNormalizado, usuario);
  }

  // Verifica cada colaborador esperado
  const encontrados: string[] = [];
  const naoEncontrados: string[] = [];

  console.log("📋 VERIFICAÇÃO DE COLABORADORES:\n");
  console.log("=".repeat(80));

  for (const nomeEsperado of COLABORADORES_ESPERADOS) {
    const nomeNormalizado = normalizarNome(nomeEsperado);
    const usuario = mapaUsuarios.get(nomeNormalizado);

    if (usuario) {
      encontrados.push(nomeEsperado);
      console.log(`✅ ${nomeEsperado}`);
      console.log(`   → Nome no Clockify: ${limparSufixo(usuario.name)}`);
      console.log(`   → Email: ${usuario.email}`);
      console.log(`   → Status: ${usuario.status}`);
      console.log();
    } else {
      naoEncontrados.push(nomeEsperado);
      console.log(`❌ ${nomeEsperado}`);
      console.log(`   → NÃO ENCONTRADO na API do Clockify`);
      console.log();
    }
  }

  console.log("=".repeat(80));
  console.log("\n📊 RESUMO:\n");
  console.log(`✅ Encontrados: ${encontrados.length}/${COLABORADORES_ESPERADOS.length}`);
  console.log(`❌ Não encontrados: ${naoEncontrados.length}/${COLABORADORES_ESPERADOS.length}`);

  if (naoEncontrados.length > 0) {
    console.log("\n⚠️  COLABORADORES NÃO ENCONTRADOS NA API:");
    for (const nome of naoEncontrados) {
      console.log(`   - ${nome}`);
    }
    console.log("\n💡 Esses colaboradores podem:");
    console.log("   1. Não estar cadastrados no workspace do Clockify");
    console.log("   2. Ter nomes diferentes no Clockify");
    console.log("   3. Estar inativos ou removidos do workspace");
  }

  // Lista todos os usuários do Clockify para referência
  console.log("\n" + "=".repeat(80));
  console.log("\n📝 TODOS OS USUÁRIOS NO CLOCKIFY (para referência):\n");
  const usuariosOrdenados = Array.from(usuarios).sort((a, b) => 
    limparSufixo(a.name).localeCompare(limparSufixo(b.name))
  );
  for (const usuario of usuariosOrdenados) {
    console.log(`   ${limparSufixo(usuario.name)} (${usuario.email}) - ${usuario.status}`);
  }
}

// Executa a verificação
verificarColaboradores().catch((erro) => {
  console.error("❌ Erro durante a verificação:", erro);
  process.exit(1);
});
