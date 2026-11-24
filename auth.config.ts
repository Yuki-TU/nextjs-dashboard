import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // ログインしているかどうかを判断
      const isLoggedIn = !!auth?.user;
      // ダッシュボードページかどうかを判断
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      // ダッシュボードページでログインしていない場合はログインページにリダイレクト
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // ログインしていない場合はログインページにリダイレクト
      } else if (isLoggedIn) {
        // ログインしている場合はダッシュボードページにリダイレクト
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
