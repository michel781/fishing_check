import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "새 비밀번호", robots: { index: false } };

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
