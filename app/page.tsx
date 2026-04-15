import { redirect } from "next/navigation";

// Redireciona a raiz para /dashboard
export default function Home() {
  redirect("/dashboard");
}
