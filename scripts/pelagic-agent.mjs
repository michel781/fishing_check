#!/usr/bin/env node
/**
 * 회유어 찾기 에이전트 결과를 받아 짧게 출력한다 (Claude Code 스킬 pelagic-agent가 쓴다).
 *   node scripts/pelagic-agent.mjs [기본주소] [days] [limit] [species]   (species: spanishmackerel | mackerel | yellowtail)
 * 기본주소를 비우면 배포 주소 → 로컬(3000, 3100) 순서로 시도한다.
 * 출력: 사람이 읽는 표 + 마지막 줄에 JSON(--json 이면 JSON만).
 */
const args = process.argv.slice(2).filter((a) => a !== "--json");
const jsonOnly = process.argv.includes("--json");
const [base, days = "3", limit = "5", species = ""] = args;
const bases = base ? [base] : ["https://fishing-check.vercel.app", "http://localhost:3000", "http://localhost:3100"];

let data = null;
let used = "";
for (const b of bases) {
  try {
    const r = await fetch(`${b.replace(/\/$/, "")}/api/agent/pelagic?days=${days}&limit=${limit}${species ? `&species=${species}` : ""}`, { signal: AbortSignal.timeout(40000) });
    if (!r.ok) continue;
    data = await r.json();
    used = b;
    break;
  } catch {}
}
if (!data) {
  console.error("결과를 받지 못했어요. 인터넷 연결을 확인하거나, 저장소에서 `npm run build && npm start` 후 `node scripts/pelagic-agent.mjs http://localhost:3000` 으로 다시 실행하세요.");
  process.exit(1);
}
if (jsonOnly) {
  console.log(JSON.stringify(data));
  process.exit(0);
}
const hm = (iso) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(5, 16).replace("T", " ");
console.log(`# ${data.region} 회유어 후보 (${used}, 계산 ${hm(data.generatedAt)} KST)`);
console.log(`규칙: ${data.rule}`);
console.log(`점수: ${data.formula}`);
console.log(`후보 ${data.considered}개 중 상위 ${data.picks.length}개${data.partial ? " (일부 예보 추정값)" : ""}\n`);
data.picks.forEach((p, i) => {
  const checks = p.checks.map((c) => `${c.ok ? "✓" : "✗"}${c.label}(${c.detail})`).join(" / ");
  console.log(`${i + 1}. [${p.agentScore}] ${p.spotName} · ${p.speciesName} · ${hm(p.start)}~${hm(p.end).slice(6)} ${p.phaseLabel} · 앱점수 ${p.appScore}`);
  console.log(`   ${checks}`);
  if (p.warnings.length) console.log(`   ⚠ ${p.warnings.join(" / ")}`);
});
