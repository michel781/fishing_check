import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 플레이스토어 앱(TWA, 웹을 그대로 감싼 안드로이드 앱)이 주소창 없이 열리게 하는 인증 파일.
 * 앱을 만든 뒤 Vercel 환경변수에 넣으면 된다 (docs/10-home-install.md 참고).
 *   TWA_PACKAGE_NAME     예) app.vercel.fishing_check.twa
 *   TWA_SHA256_CERTS     서명 인증서 SHA-256 지문 (여러 개면 쉼표로)
 */
export function GET() {
  const pkg = process.env.TWA_PACKAGE_NAME?.trim();
  const certs = (process.env.TWA_SHA256_CERTS ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body = pkg && certs.length ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: certs } }] : [];
  return NextResponse.json(body, { headers: { "cache-control": "public, max-age=3600" } });
}
