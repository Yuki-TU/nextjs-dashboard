import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcrypt";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: /localhost|127\.0\.0\.1/.test(process.env.POSTGRES_URL ?? "")
    ? false
    : "require",
});

/**
 * ユーザーを取得する
 * @param email - ユーザーのメールアドレス
 * @returns - ユーザーのデータ
 */
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // バリデーションを行う
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        // バリデーションが成功した場合はユーザーを取得
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          // ユーザーが存在しない場合はnullを返す
          if (!user) return null;
          // パスワードが一致しない場合はnullを返す
          const passwordsMatch = await bcrypt.compare(password, user.password);
          // パスワードが一致した場合はユーザーを返す
          if (passwordsMatch) return user;
        }
        console.log("Invalid credentials");
        // バリデーションが失敗した場合はnullを返す
        return null;
      },
    }),
  ],
});
