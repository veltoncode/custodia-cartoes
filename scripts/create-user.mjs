// Uso: npm run create-user -- <username> <senha> "<Nome Completo>" <admin|consulta>
// Exemplo: npm run create-user -- joao.silva minhasenha123 "João Silva" admin
//
// Precisa do arquivo .env.local preenchido (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [, , username, password, nome, role] = process.argv;

if (!username || !password || !nome || !role) {
  console.error(
    'Uso: npm run create-user -- <username> <senha> "<Nome Completo>" <admin|consulta>'
  );
  process.exit(1);
}
if (!["admin", "consulta"].includes(role)) {
  console.error('O perfil deve ser "admin" ou "consulta".');
  process.exit(1);
}
if (password.length < 6) {
  console.error("A senha precisa ter ao menos 6 caracteres.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local antes de rodar.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const password_hash = await bcrypt.hash(password, 10);

const { data, error } = await supabase
  .from("usuarios")
  .insert({
    username: username.trim().toLowerCase(),
    password_hash,
    nome: nome.trim(),
    role,
  })
  .select("id, username, nome, role")
  .single();

if (error) {
  console.error("Erro ao criar usuário:", error.message);
  process.exit(1);
}

console.log("Usuário criado com sucesso:", data);
