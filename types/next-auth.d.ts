import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "consulta";
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: "admin" | "consulta";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "consulta";
  }
}
