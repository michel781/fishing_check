import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "로그인", robots: { index: false } };

type Search = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
