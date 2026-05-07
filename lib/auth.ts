import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "./db";
import { RowDataPacket } from "mysql2";

// Extend NextAuth types to include our custom fields
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    slapyvardis: string;
    role: "vartotojas" | "admininstratorius" | "atstovas";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      slapyvardis: string;
      role: "vartotojas" | "admininstratorius" | "atstovas";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    slapyvardis: string;
    role: "vartotojas" | "admininstratorius" | "atstovas";
  }
}

interface VartotojasRow extends RowDataPacket {
  id_Vartotojas: number;
  vardas: string;
  pavarde: string;
  e_pastas: string;
  slapyvardis: string;
  slaptazodis: string;
  role: "vartotojas" | "admininstratorius" | "atstovas";
  busena: "aktyvus" | "sustabdytas";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        e_pastas: { label: "El. paštas", type: "email" },
        slaptazodis: { label: "Slaptažodis", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.e_pastas || !credentials?.slaptazodis) {
          return null;
        }

        const [rows] = await pool.execute<VartotojasRow[]>(
          "SELECT * FROM vartotojai WHERE e_pastas = ?",
          [credentials.e_pastas]
        );

        if (rows.length === 0) {
          return null;
        }

        const user = rows[0];

        if (user.busena !== "aktyvus") {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.slaptazodis,
          user.slaptazodis
        );

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id_Vartotojas),
          name: `${user.vardas} ${user.pavarde}`,
          email: user.e_pastas,
          slapyvardis: user.slapyvardis,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.slapyvardis = user.slapyvardis;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.slapyvardis = token.slapyvardis;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};