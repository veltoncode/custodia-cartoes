import { createClient } from "@supabase/supabase-js";

// ATENÇÃO: este cliente usa a service_role key e só deve ser
// importado em código que roda no servidor (API routes, server
// components, scripts). Nunca importe este arquivo em um
// componente client ("use client").
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Variáveis SUPABASE ausentes. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
