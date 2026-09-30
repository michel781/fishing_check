import type { Metadata } from "next";
import { AppHead } from "@/components/AppHead";
import { SetupChecklist } from "@/components/SetupChecklist";

export const metadata: Metadata = { title: "운영자 설정 점검", robots: { index: false } };

export default function SetupPage() {
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead title="운영자 설정 점검" fallback="/settings" />
      <SetupChecklist />
    </div>
  );
}
