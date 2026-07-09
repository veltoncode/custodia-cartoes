import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseAdmin";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const { data: usuario, error } = await supabaseAdmin
          .from("usuarios")
          .select("id, username, password_hash, nome, role")
          .eq("username", credentials.username.trim().toLowerCase())
          .single();

        if (error || !usuario) return null;

        const senhaOk = await bcrypt.compare(
          credentials.password,
          usuario.password_hash
        );
        if (!senhaOk) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          role: usuario.role as "admin" | "consulta",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
