import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Configuração do Vitest para o projeto ClockView
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Espelha o alias "@/*" definido no tsconfig.json para que os imports
    // com "@/" funcionem corretamente nos testes unitários
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Ambiente de teste: jsdom para componentes React, node para utilitários de servidor
    environment: "jsdom",
    globals: true,
    // Diretório raiz dos testes
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
});
