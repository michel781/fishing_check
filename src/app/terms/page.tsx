import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";

export const metadata: Metadata = { title: "이용약관" };
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const op = process.env.OPERATOR_NAME || "피싱체크 운영자";
  return (
    <div className="stack doc" style={{ gap: 12 }}>
      <AppHead title="이용약관" />
      <p className="sub" style={{ margin: 0 }}>시행일: 2026년 10월 1일 · 운영: {op}</p>
      <section className="card">
        <h2>1. 서비스 내용</h2>
        <p>피싱체크는 물때·날씨·바다 예보를 모아 낚시하기 좋은 시간과 장소를 &lsquo;예측&rsquo;해 보여주는 서비스예요. 점수와 황금타임은 참고용이며 조과를 보장하지 않아요.</p>
      </section>
      <section className="card">
        <h2>2. 안전 책임</h2>
        <p>출조 여부는 이용자가 스스로 판단해요. 기상특보, 해양경찰·선장·현장 안내가 피싱체크 정보보다 우선이에요. 위험 표시가 없더라도 현장이 위험하면 바로 철수해 주세요.</p>
      </section>
      <section className="card">
        <h2>3. 회원 계정</h2>
        <p>계정은 본인만 써야 하고, 비밀번호는 스스로 관리해요. 남의 정보로 가입하거나 서비스를 방해하면 이용을 제한할 수 있어요.</p>
      </section>
      <section className="card">
        <h2>4. 조과 기록·사진</h2>
        <p>올린 기록과 사진의 권리는 이용자에게 있어요. 피싱체크는 기록을 저장하고 보여주는 데에만 써요. 다른 사람의 얼굴 등 초상권이 있는 사진은 올리지 말아 주세요.</p>
      </section>
      <section className="card">
        <h2>5. 쇼핑 링크</h2>
        <p>채비 가격 정보는 쿠팡 등 판매처의 정보를 보여주는 것이며 실제 가격·재고는 판매처 화면이 기준이에요. 쿠팡 링크로 구매하면 피싱체크가 일정 수수료를 받을 수 있어요(쿠팡 파트너스).</p>
      </section>
      <section className="card">
        <h2>6. 탈퇴와 변경</h2>
        <p>언제든 &lsquo;내 계정&rsquo;에서 탈퇴할 수 있어요. 약관이 바뀌면 시행 7일 전에 앱에서 알려요.</p>
      </section>
      <p className="small muted">개인정보 처리 내용은 <Link className="link" href="/privacy">개인정보 처리방침</Link>을 확인해 주세요.</p>
    </div>
  );
}
