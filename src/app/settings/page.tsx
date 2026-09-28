import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Settings } from "@/components/Settings";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const c = await cookies();
  return (
    <div className="stack">
      <h1>설정</h1>
      <Settings mul={c.get("mul")?.value ?? "auto"} theme={c.get("theme")?.value ?? "dark"} />
      <div className="card stack" style={{ gap: 6 }}>
        <h2>정보</h2>
        <p className="small sub" style={{ margin: 0 }}>
          데이터: 국립해양조사원(조석예보), 기상청(단기예보), Open-Meteo(해양·기상 모델). 키가 없거나 연결이 안 되면 추정·데모 값으로 대체되며 화면 하단에 표시됩니다.
        </p>
        <p className="small sub" style={{ margin: 0 }}>
          피싱체크의 점수는 참고용 예측입니다. 출항·출입 여부는 해양경찰·선장·현장 안내를 따르세요.
        </p>
      </div>
    </div>
  );
}
