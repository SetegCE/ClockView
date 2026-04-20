// Script para mapear colaboradores esperados com usuários do Clockify
// Usa correspondência parcial de nomes para identificar usuários

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
 * Normaliza nome para comparação (remove acentos, converte para maiúsculas)
 */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Remove sufixo " | SETEG" do nome
 */
function limparSufixo(nome: string): string {
  return nome.replace(/\s*\|\s*SETEG\s*$/i, "").trim();
}

/**
 * Extrai primeiro nome e último sobrenome de um nome completo
 */
function extrairPrimeiroUltimo(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1]}`;
}

/**
 * Verifica se o nome do Clockify corresponde ao nome esperado
 */
function corresponde(nomeClockify: string, nomeEsperado: string): boolean {
  const clockifyNorm = normalizarNome(nomeClockify);
  const esperadoNorm = normalizarNome(nomeEsperado);
  
  // Tenta correspondência exata
  if (clockifyNorm === esperadoNorm) return true;
  
  // Tenta correspondência com primeiro + último nome
  const primeiroUltimo = normalizarNome(extrairPrimeiroUltimo(nomeEsperado));
  if (clockifyNorm === primeiroUltimo) return true;
  
  // Tenta correspondência parcial (todas as palavras do Clockify estão no esperado)
  const palavrasClockify = clockifyNorm.split(/\s+/);
  const palavrasEsperado = esperadoNorm.split(/\s+/);
  
  return palavrasClockify.every(p => palavrasEsperado.includes(p));
}

async function mapearColaboradores() {
  console.log("🔍 Buscando usuários na API do Clockify...\n");

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

  // Mapeia colaboradores esperados para usuários do Clockify
  const encontrados: Array<{ esperado: string; clockify: ClockifyUser }> = [];
  const naoEncontrados: string[] = [];
  const usuariosUsados = new Set<string>();

  console.log("📋 MAPEAMENTO DE COLABORADORES:\n");
  console.log("=".repeat(80));

  for (const nomeEsperado of COLABORADORES_ESPERADOS) {
    let encontrou = false;

    for (const usuario of usuarios) {
      if (usuariosUsados.has(usuario.id)) continue;
      
      const nomeLimpo = limparSufixo(usuario.name);
      if (corresponde(nomeLimpo, nomeEsperado)) {
        encontrados.push({ esperado: nomeEsperado, clockify: usuario });
        usuariosUsados.add(usuario.id);
        encontrou = true;
        
        console.log(`✅ ${nomeEsperado}`);
        console.log(`   → Encontrado como: ${nomeLimpo}`);
        console.log(`   → Email: ${usuario.email}`);
        console.log(`   → Status: ${usuario.status}`);
        console.log();
        break;
      }
    }

    if (!encontrou) {
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
    
    console.log("\n💡 Possíveis correspondências manuais:");
    console.log("   Verifique se algum desses usuários corresponde aos não encontrados:\n");
    
    const usuariosNaoUsados = usuarios.filter(u => !usuariosUsados.has(u.id));
    for (const usuario of usuariosNaoUsados) {
      console.log(`   ${limparSufixo(usuario.name)} (${usuario.email}) - ${usuario.status}`);
    }
  }
}

// Executa o mapeamento
mapearColaboradores().catch((erro) => {
  console.error("❌ Erro durante o mapeamento:", erro);
  process.exit(1);
});
