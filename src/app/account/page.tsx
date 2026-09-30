import type { Metadata } from "next";
import { AppHead } from "@/components/AppHead";
import { AccountPanel } from "@/components/auth/AccountPanel";

export const metadata: Metadata = { title: "내 계정", robots: { index: false } };

type Search = Promise<{ pw?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: Search }) {
  const { pw } = await searchParams;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead title="내 계정" fallback="/settings" />
      <AccountPanel pwChanged={pw === "changed"} />
    </div>
  );
}
