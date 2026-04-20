// Script para limpar o cache e forçar nova busca na API
import { invalidarCache } from "../services/dashboardService";

console.log("🗑️  Limpando cache do dashboard...");
invalidarCache();
console.log("✅ Cache limpo com sucesso!");
console.log("\n💡 Na próxima requisição ao dashboard, os dados serão buscados novamente da API.");
