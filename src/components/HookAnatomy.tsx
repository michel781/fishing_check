/** 바늘 각 부분 이름 (설명용 그림, 실제 크기 아님) + 축 길이에 따른 모양 비교 */
export function HookAnatomy() {
  return (
    <figure className="hk-fig" style={{ margin: 0 }}>
      <svg viewBox="0 0 320 230" role="img" aria-labelledby="hk-t hk-d">
        <title id="hk-t">바늘 각 부분 이름</title>
        <desc id="hk-d">위쪽 고리가 바늘귀, 곧게 내려오는 부분이 축, 아래 둥글게 휘는 부분이 휨, 위로 솟은 뾰족한 끝이 바늘끝, 그 안쪽에 거꾸로 난 작은 갈고리가 미늘, 축과 바늘끝 사이 간격이 품이에요.</desc>
        {/* 바늘 */}
        <circle cx="110" cy="30" r="10" className="hk-wire" />
        <path d="M110,40 L110,150 Q110,200 148,200 Q186,200 186,150 L186,112" className="hk-wire" />
        <path d="M186,114 L177,128 L186,126" className="hk-wire thin" />
        {/* 품(갭) */}
        <line x1="114" y1="150" x2="182" y2="150" className="hk-dim" markerStart="url(#hk-arrow)" markerEnd="url(#hk-arrow)" />
        <defs>
          <marker id="hk-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="hk-arrowhead" />
          </marker>
        </defs>
        {/* 이름 (설명은 그림 아래 목록) */}
        <g className="hk-lbl">
          <line x1="122" y1="26" x2="170" y2="22" /><text x="176" y="27">① 바늘귀</text>
          <line x1="104" y1="96" x2="74" y2="96" /><text x="68" y="101" textAnchor="end">② 축</text>
          <line x1="130" y1="196" x2="96" y2="214" /><text x="90" y="219" textAnchor="end">③ 휨</text>
          <text x="148" y="170" textAnchor="middle">④ 품</text>
          <line x1="190" y1="112" x2="222" y2="98" /><text x="228" y="103">⑤ 바늘끝</text>
          <line x1="181" y1="128" x2="222" y2="134" /><text x="228" y="139">⑥ 미늘</text>
        </g>
      </svg>
      <ol className="hk-parts small">
        <li><b>바늘귀</b> — 목줄을 묶는 고리(납작한 귀도 있어요)</li>
        <li><b>축</b> — 곧은 몸통. 길수록 미끼를 길게 꿰고 삼킨 바늘을 빼기 쉬워요</li>
        <li><b>휨(벤드)</b> — 둥글게 휘는 부분. 고기 무게를 받아요</li>
        <li><b>품(갭)</b> — 축과 바늘끝 사이 간격. 넓을수록 큰 입·큰 미끼에 맞아요</li>
        <li><b>바늘끝</b> — 무뎌지면 잘 안 박혀요. 손톱에 대 보아 미끄러지면 바꿔요</li>
        <li><b>미늘</b> — 거꾸로 난 작은 가시. 한번 걸린 바늘이 빠지지 않게 해요</li>
      </ol>
    </figure>
  );
}

/** 모양 비교: 짧은 축 / 긴 축 / 세발바늘 / 미늘 없는 갈고리 */
export function HookShapes() {
  const items: { id: string; name: string; use: string; d: string; extra?: string }[] = [
    { id: "short", name: "짧은 축", use: "감성돔·벵에돔 — 가볍고 미끼(크릴)에 숨기기 쉬움", d: "M30,20 L30,62 Q30,84 46,84 Q62,84 62,64 L62,52" },
    { id: "long", name: "긴 축", use: "가자미·갈치 — 갯지렁이를 길게, 삼킨 바늘 빼기 쉬움", d: "M30,6 L30,70 Q30,88 44,88 Q58,88 58,72 L58,60" },
    { id: "treble", name: "세발바늘", use: "미노우 등 루어 — 어느 쪽으로 물어도 걸림", d: "M45,10 L45,50 M45,50 Q45,72 30,72 Q18,72 18,58 M45,50 Q45,72 60,72 Q72,72 72,58 M45,50 L45,80" },
    { id: "egi", name: "갈고리(미늘 없음)", use: "에기·오징어 뿔 — 다리로 감싸는 두족류용, 감기를 멈추면 빠짐", d: "M20,40 L70,40 M70,40 L80,28 M70,40 L82,36 M70,40 L82,44 M70,40 L80,52" },
  ];
  return (
    <ul className="hk-shapes">
      {items.map((it) => (
        <li key={it.id}>
          <svg viewBox="0 0 92 96" aria-hidden>
            {it.id === "short" || it.id === "long" ? <circle cx="30" cy={it.id === "short" ? 14 : 2} r="5" className="hk-wire" /> : null}
            <path d={it.d} className="hk-wire" />
          </svg>
          <span>
            <b>{it.name}</b>
            <span className="small muted" style={{ display: "block" }}>{it.use}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
