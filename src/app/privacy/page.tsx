import type { Metadata } from "next";
import { AppHead } from "@/components/AppHead";

export const metadata: Metadata = { title: "개인정보 처리방침" };
export const dynamic = "force-dynamic";

/** 운영자 정보는 환경변수로 채운다 (OPERATOR_NAME, CONTACT_EMAIL) */
export default function PrivacyPage() {
  const op = process.env.OPERATOR_NAME || "피싱체크 운영자";
  const mail = process.env.CONTACT_EMAIL;
  return (
    <div className="stack doc" style={{ gap: 12 }}>
      <AppHead title="개인정보 처리방침" />
      <p className="sub" style={{ margin: 0 }}>{op}(이하 &lsquo;피싱체크&rsquo;)는 회원의 개인정보를 아래와 같이 처리해요. 시행일: 2026년 10월 1일</p>

      <section className="card">
        <h2>1. 모으는 정보와 이유</h2>
        <table className="doc-table">
          <thead><tr><th>구분</th><th>항목</th><th>이유</th></tr></thead>
          <tbody>
            <tr><td>필수</td><td>이메일, 비밀번호(암호화 저장), 닉네임</td><td>회원 확인, 로그인, 비밀번호 찾기</td></tr>
            <tr><td>필수</td><td>약관 동의 시각, 만 14세 이상 확인</td><td>동의 기록 보관</td></tr>
            <tr><td>선택</td><td>즐겨찾기 포인트, 조과 기록(시각·장소·어종·마릿수·크기·메모·사진)</td><td>여러 기기에서 내 기록 보기</td></tr>
            <tr><td>선택</td><td>소식 받기 동의 여부</td><td>새 기능·이벤트 안내</td></tr>
            <tr><td>카카오 로그인 시</td><td>카카오 회원번호, 닉네임, (동의한 경우) 이메일</td><td>회원 확인</td></tr>
          </tbody>
        </table>
        <p className="small muted">위치 정보는 &lsquo;내 주변 포인트&rsquo;를 누를 때 휴대폰 안에서 거리 계산에만 쓰고, 서버에 저장하지 않아요.</p>
      </section>

      <section className="card">
        <h2>2. 보관 기간</h2>
        <p>회원 탈퇴 시 바로 지워요. 1년 동안 로그인하지 않으면 미리 알린 뒤 지우거나 따로 보관해요. 법령이 정한 경우에는 그 기간 동안 보관해요.</p>
      </section>

      <section className="card">
        <h2>3. 처리를 맡기는 곳 (위탁·국외 이전)</h2>
        <p>회원 정보 저장과 로그인은 <strong>Supabase Inc.</strong>(미국)의 클라우드 서비스를 이용해요. 데이터는 운영자가 선택한 지역의 서버에 암호화된 통신으로 저장돼요. 화면 전송은 <strong>Vercel Inc.</strong>(미국)를 이용해요.</p>
      </section>

      <section className="card">
        <h2>4. 회원의 권리</h2>
        <p>언제든 &lsquo;내 계정&rsquo;에서 정보를 보고 고치거나 탈퇴할 수 있어요. 탈퇴하면 계정과 저장된 즐겨찾기·조과 기록이 모두 지워져요.</p>
      </section>

      <section className="card">
        <h2>5. 만 14세 미만</h2>
        <p>만 14세 미만은 회원가입을 받지 않아요. 로그인 없이 모든 기능을 쓸 수 있어요.</p>
      </section>

      <section className="card">
        <h2>6. 문의</h2>
        <p>개인정보 보호 책임자: {op}{mail ? <> · <a className="link" href={`mailto:${mail}`}>{mail}</a></> : <> · <a className="link" href="https://github.com/michel781/fishing_check/issues" target="_blank" rel="noreferrer">문의 게시판</a></>}</p>
      </section>
    </div>
  );
}
