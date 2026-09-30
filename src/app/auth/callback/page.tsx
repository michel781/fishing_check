import type { Metadata } from "next";
import { AuthCallback } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "로그인 중", robots: { index: false } };

type Search = Promise<{ error?: string; error_code?: string }>;

export default async function CallbackPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return <AuthCallback error={sp.error_code ?? sp.error} />;
}
