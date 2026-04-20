// Script de diagnóstico completo da API do Clockify
// Testa diferentes endpoints e parâmetros para encontrar usuários

import { CLOCKIFY_API_TOKEN, CLOCKIFY_WORKSPACE_ID } from "../config/clockify";

interface ClockifyUser {
  id: string;
  name: string;
  email: string;
  status: string;
  activeWorkspace?: string;
  memberships?: any[];
}

async function fetchAPI(path: string): Promise<any> {
  const response = await fetch(`https://api.clockify.me/api/v1${path}`, {
    headers: { "X-Api-Key": CLOCKIFY_API_TOKEN! },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function diagnosticoCompleto() {
  console.log("🔍 DIAGNÓSTICO COMPLETO DA API DO CLOCKIFY\n");
  console.log("=".repeat(80));
  
  // 1. Busca usuários com diferentes parâmetros
  console.log("\n📋 Teste 1: Buscar usuários com limit=200");
  const usuarios1 = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?limit=200`);
  console.log(`   → Encontrados: ${usuarios1.length} usuários`);
  
  console.log("\n📋 Teste 2: Buscar usuários com limit=500");
  const usuarios2 = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?limit=500`);
  console.log(`   → Encontrados: ${usuarios2.length} usuários`);
  
  console.log("\n📋 Teste 3: Buscar usuários com status=ACTIVE");
  const usuarios3 = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=ACTIVE&limit=200`);
  console.log(`   → Encontrados: ${usuarios3.length} usuários`);
  
  console.log("\n📋 Teste 4: Buscar usuários com status=PENDING");
  const usuarios4 = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=PENDING&limit=200`);
  console.log(`   → Encontrados: ${usuarios4.length} usuários`);
  
  console.log("\n📋 Teste 5: Buscar usuários com status=INACTIVE");
  const usuarios5 = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=INACTIVE&limit=200`);
  console.log(`   → Encontrados: ${usuarios5.length} usuários`);
  
  // 2. Agrupa todos os usuários únicos
  const todosUsuarios = new Map<string, ClockifyUser>();
  
  for (const usuario of [...usuarios1, ...usuarios2, ...usuarios3, ...usuarios4, ...usuarios5]) {
    if (!todosUsuarios.has(usuario.id)) {
      todosUsuarios.set(usuario.id, usuario);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log(`\n✅ Total de usuários únicos encontrados: ${todosUsuarios.size}\n`);
  
  // 3. Verifica os usuários específicos
  const emailsEsperados = [
    "neres@setegce.com",
    "tiago@setegce.com",
    "raissa@setegce.com",
    "ricardo@setegce.com",
    "vitor@setegce.com",
    "vivian@setegce.com",
    "wilgner@setegce.com",
  ];
  
  console.log("🔍 VERIFICAÇÃO DOS USUÁRIOS ESPECÍFICOS:\n");
  
  for (const email of emailsEsperados) {
    const usuario = Array.from(todosUsuarios.values()).find(u => u.email === email);
    
    if (usuario) {
      console.log(`✅ ${email}`);
      console.log(`   → Nome: ${usuario.name}`);
      console.log(`   → Status: ${usuario.status}`);
      console.log(`   → ID: ${usuario.id}`);
    } else {
      console.log(`❌ ${email} - NÃO ENCONTRADO em nenhum teste`);
    }
    console.log();
  }
  
  // 4. Lista todos os usuários por status
  console.log("=".repeat(80));
  console.log("\n📊 USUÁRIOS POR STATUS:\n");
  
  const porStatus = new Map<string, ClockifyUser[]>();
  for (const usuario of todosUsuarios.values()) {
    const status = usuario.status || "UNKNOWN";
    if (!porStatus.has(status)) {
      porStatus.set(status, []);
    }
    porStatus.get(status)!.push(usuario);
  }
  
  for (const [status, usuarios] of porStatus.entries()) {
    console.log(`\n${status}: ${usuarios.length} usuários`);
    for (const u of usuarios.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`   - ${u.name} (${u.email})`);
    }
  }
  
  // 5. Informações do workspace
  console.log("\n" + "=".repeat(80));
  console.log("\n📁 INFORMAÇÕES DO WORKSPACE:\n");
  
  try {
    const workspace = await fetchAPI(`/workspaces/${CLOCKIFY_WORKSPACE_ID}`);
    console.log(`   Nome: ${workspace.name}`);
    console.log(`   ID: ${workspace.id}`);
  } catch (erro) {
    console.log(`   ❌ Erro ao buscar workspace: ${erro}`);
  }
}

diagnosticoCompleto().catch((erro) => {
  console.error("❌ Erro durante diagnóstico:", erro);
  process.exit(1);
});
