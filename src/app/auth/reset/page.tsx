import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "비밀번호 찾기", robots: { index: false } };

export default function ResetPage() {
  return <ResetForm />;
}
