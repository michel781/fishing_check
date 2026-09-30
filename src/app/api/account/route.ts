import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 회원 탈퇴. 로그인한 사용자의 토큰으로 본인 확인 후, 서버 전용 키(SUPABASE_SERVICE_ROLE_KEY)로 계정을 지운다.
 * 즐겨찾기·조과 기록은 테이블의 on delete cascade 로 함께 지워진다.
 */
export async function DELETE(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon) return NextResponse.json({ message: "회원 기능이 설정되지 않았어요." }, { status: 501 });
  if (!service) return NextResponse.json({ message: "지금은 앱에서 탈퇴를 처리할 수 없어요. 설정 > 문의하기로 요청해 주세요." }, { status: 501 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return NextResponse.json({ message: "로그인이 필요해요." }, { status: 401 });

  const me = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, authorization: `Bearer ${token}` }, cache: "no-store" }).catch(() => null);
  if (!me?.ok) return NextResponse.json({ message: "로그인이 풀렸어요. 다시 로그인해 주세요." }, { status: 401 });
  const { id } = (await me.json()) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "사용자를 확인하지 못했어요." }, { status: 400 });

  const del = await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    // 예전 service_role 키(JWT)는 Authorization 에도 넣고, 새 sb_secret_ 키는 apikey 헤더만 쓴다
    headers: service.startsWith("eyJ") ? { apikey: service, authorization: `Bearer ${service}` } : { apikey: service },
    cache: "no-store",
  }).catch(() => null);
  if (!del?.ok) return NextResponse.json({ message: "탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
