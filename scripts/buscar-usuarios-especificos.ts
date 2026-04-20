// Script para buscar usuários específicos na API do Clockify
// Mostra TODOS os usuários para identificar os que estão faltando

import { fetchFromClockify } from "../services/clockifyClient";
import { CLOCKIFY_API_TOKEN, CLOCKIFY_WORKSPACE_ID } from "../config/clockify";

interface ClockifyUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

async function buscarUsuariosEspecificos() {
  console.log("🔍 Buscando TODOS os usuários na API do Clockify...\n");

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

  // Usuários que o cliente confirmou que estão cadastrados
  const usuariosEsperados = [
    { nome: "Francisco Neres", email: "neres@setegce.com" },
    { nome: "Tiago Soares", email: "tiago@setegce.com" },
    { nome: "Raíssa Dias", email: "raissa@setegce.com" },
    { nome: "Ricardo Silveira", email: "ricardo@setegce.com" },
    { nome: "Vítor Ferreira", email: "vitor@setegce.com" },
    { nome: "Vivian Rodrigues", email: "vivian@setegce.com" },
    { nome: "Wilgner Silva", email: "wilgner@setegce.com" },
  ];

  console.log("📋 VERIFICANDO USUÁRIOS ESPECÍFICOS:\n");
  console.log("=".repeat(80));

  for (const esperado of usuariosEsperados) {
    const usuario = usuarios.find(u => u.email === esperado.email);
    
    if (usuario) {
      console.log(`✅ ${esperado.nome} (${esperado.email})`);
      console.log(`   → Nome na API: "${usuario.name}"`);
      console.log(`   → Status: ${usuario.status}`);
      console.log(`   → ID: ${usuario.id}`);
    } else {
      console.log(`❌ ${esperado.nome} (${esperado.email})`);
      console.log(`   → NÃO ENCONTRADO na API`);
    }
    console.log();
  }

  console.log("=".repeat(80));
  console.log("\n📝 LISTA COMPLETA DE USUÁRIOS NA API (ordenada por nome):\n");

  const usuariosOrdenados = usuarios
    .map(u => ({
      ...u,
      nomeLimpo: u.name.replace(/\s*\|\s*SETEG\s*$/i, "").trim()
    }))
    .sort((a, b) => a.nomeLimpo.localeCompare(b.nomeLimpo));

  for (const usuario of usuariosOrdenados) {
    console.log(`   "${usuario.name}" | ${usuario.email} | ${usuario.status}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n🔍 BUSCA POR PALAVRAS-CHAVE:\n");

  const palavrasChave = ["neres", "tiago", "raissa", "ricardo", "vitor", "vivian", "wilgner"];
  
  for (const palavra of palavrasChave) {
    const encontrados = usuarios.filter(u => 
      u.name.toLowerCase().includes(palavra) || 
      u.email.toLowerCase().includes(palavra)
    );
    
    if (encontrados.length > 0) {
      console.log(`🔎 "${palavra}":`);
      for (const u of encontrados) {
        console.log(`   → "${u.name}" (${u.email}) - ${u.status}`);
      }
    } else {
      console.log(`❌ "${palavra}": Nenhum resultado`);
    }
    console.log();
  }
}

buscarUsuariosEspecificos().catch((erro) => {
  console.error("❌ Erro:", erro);
  process.exit(1);
});
