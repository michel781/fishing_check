import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "회원가입", robots: { index: false } };

type Search = Promise<{ next?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  return <SignupForm next={next} />;
}
