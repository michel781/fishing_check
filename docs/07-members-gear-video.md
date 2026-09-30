# 07. 회원가입 · 채비 치수/가격(쿠팡) · 캐스팅 영상

v1.4 에서 추가된 세 가지 기능의 구조와 **운영자가 해야 할 설정**을 정리합니다.
키를 넣지 않아도 앱은 그대로 동작합니다(로그인 없이 이 기기에 저장, 가격은 예시 가격대).

---

## 1. 회원가입 · 로그인 (Supabase)

### 무엇이 되나요
| 화면 | 주소 | 내용 |
|---|---|---|
| 회원가입 | `/signup` | 닉네임·이메일·비밀번호, 필수 동의(만 14세 이상·이용약관·개인정보), 선택 동의(소식 받기), 카카오로 시작하기(선택) |
| 로그인 | `/login?next=/log` | 이메일 로그인, 로그인 후 원래 화면으로 복귀 |
| 비밀번호 찾기 | `/auth/reset` → 메일 → `/auth/update-password` | |
| 메일 인증·카카오 복귀 | `/auth/callback` | |
| 내 계정 | `/account` | 닉네임 변경, 로그인 방법, 가입일, 동기화 상태, 비밀번호 변경, 로그아웃, **회원 탈퇴** |
| 약관 | `/terms`, `/privacy` | 운영자 이름·메일은 환경변수로 채움 |

- **동기화**: 로그인하면 이 기기의 즐겨찾기·조과 기록(사진 포함)을 계정에 올리고, 다른 기기에서 로그인하면 내려받습니다.
  - 다른 계정이 쓰던 기기에서 로그인하면 섞지 않고 새 계정 데이터로 바꿉니다.
  - 로그아웃하면 계정에 올린 뒤 이 기기에서 지웁니다(올리지 못하면 기기에 남겨 둠).
- **보안**: 비밀번호는 Supabase 가 암호화해 보관합니다. 테이블은 RLS(행 보안)로 **본인 데이터만** 읽고 쓸 수 있습니다. 탈퇴는 서버에서 본인 토큰을 확인한 뒤 서버 전용 키로 처리합니다.
- 코드: `src/lib/auth/*`, `src/components/auth/*`, `src/lib/localStore.ts`, `src/app/api/account/route.ts`, 테이블 `supabase/schema.sql`

### 설정 순서 (약 15분)
1. https://supabase.com 가입 → **New project** (Region: `Northeast Asia (Seoul)` 권장, DB 비밀번호는 따로 보관).
2. 왼쪽 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run** (테이블·권한·가입 시 프로필 자동 생성).
3. **Authentication → URL Configuration**
   - Site URL: `https://fishing-check.vercel.app`
   - Redirect URLs 에 추가: `https://fishing-check.vercel.app/auth/callback`, `https://fishing-check.vercel.app/auth/update-password`
   - (미리보기 배포에서도 쓰려면 Vercel 미리보기 주소 패턴도 추가)
4. (선택) **Authentication → Emails** 에서 인증 메일 문구를 한국어로 바꾸기. 기본 메일 발송은 시간당 개수 제한이 있으니, 사용자가 늘면 SMTP(예: Resend)를 연결하세요.
5. **Project Settings → API** 에서 값 복사 → Vercel → Settings → Environment Variables:

| 이름 | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon(또는 publishable) 키 | 공개돼도 되는 키 (RLS 로 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role(또는 `sb_secret_…`) 키 | **서버 전용. 절대 `NEXT_PUBLIC_` 붙이지 않기.** 회원 탈퇴에 필요 |
| `OPERATOR_NAME` / `CONTACT_EMAIL` | 운영자 이름 / 문의 메일 | 약관·개인정보 처리방침에 표시 |

6. **다시 배포(Redeploy)** — `NEXT_PUBLIC_` 값은 빌드할 때 코드에 들어가므로 꼭 다시 배포해야 합니다.
7. 확인: `https://fishing-check.vercel.app/api/health` 의 `config.회원가입_Supabase`, `회원탈퇴_서버키` 가 `true`.

### 카카오 로그인 켜기 (선택)
1. https://developers.kakao.com → 내 애플리케이션 → 앱 추가.
2. **카카오 로그인** 활성화 → Redirect URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. **동의항목**: 닉네임(필수). 이메일 동의항목은 비즈 앱 전환이 필요할 수 있어요.
4. 앱 키의 **REST API 키**, 보안 메뉴의 **Client Secret**(생성 후 활성화)을 Supabase → Authentication → Providers → **Kakao** 에 입력하고 켭니다.
5. Vercel 에 `NEXT_PUBLIC_AUTH_KAKAO=1` 추가 → 다시 배포 → 가입·로그인 화면에 노란 버튼이 나타납니다.

### 법적으로 챙길 것
- `/privacy` 는 **초안**입니다. 실제 운영자 정보, 보관 기간, 위탁(Supabase·Vercel) 내용을 확인해 고쳐 주세요.
- 만 14세 미만은 가입을 받지 않도록 필수 확인을 넣었습니다.

---

## 2. 채비 실제 치수 (길이·높이·호수)

- 데이터: `src/data/rigSpecs.ts` — 12어종 각각
  - `parts`: 원줄·기둥줄·가지줄·목줄·바늘·봉돌·찌 등 **호수와 길이**
  - `dims`: 그림에 치수선으로 그리는 값 (예: 우럭 `가지 간격 50cm`, `봉돌까지 40cm`, `바닥에서 30~50cm 띄움`; 감성돔 `찌밑 수심 = 수심 + 20~50cm`, `목줄 3~4m`)
  - `depth`: 채비가 물속에서 놓이는 높이를 쉬운 말로
  - `reach`: 던지는 거리 / 내리는 수심
- 그림: `src/components/RigDiagram.tsx` — 채비 종류(바닥·다운샷·찌·에기·지그헤드·카드·타이라바)별로 치수선을 그립니다. 그림은 이해를 돕기 위해 비율을 줄였고, 실제 값은 글자로 적혀 있어요.
- 수치는 국내에서 흔히 쓰는 **일반 기준**이며 화면에도 "물살·수심·배 안내에 따라 바꿔 쓰세요"라고 적었습니다.

## 3. 채비 준비물 실시간 가격 (쿠팡 파트너스)

- 각 어종의 `gear` 목록(필수/있으면 좋아요, 규격, 수량, 검색어)으로 가격을 찾습니다.
- API: `GET /api/gear?species=rockfish`
  - 1순위 **쿠팡 파트너스 Open API** (상품 검색) — HMAC-SHA256 서명, 링크는 파트너스 추적 링크
  - 2순위 **네이버 쇼핑 검색 API** — 쿠팡 API 승인 전 대체용
  - 둘 다 없으면 **예시 가격대**(직접 넣은 대략값)와 쿠팡 검색 링크
- 캐시: 같은 검색어는 **서버 3시간** + CDN 1시간. 쿠팡 검색 API 는 호출 한도가 작아서(시간당 수 회 수준으로 알려짐) 이렇게 모아 부릅니다. 한도 초과 응답을 받으면 10분 쉬었다가 다시 부릅니다. 그래서 화면 가격은 "n분/시간 전 가격"으로 표시합니다.
- 화면에서 보일 때만 불러와서 호출 수를 아낍니다.
- 쿠팡 링크가 나올 때는 법에 따른 문구 "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."를 표시합니다.

### 설정
1. https://partners.coupang.com 가입 → 활동 채널에 `https://fishing-check.vercel.app` 등록.
2. **추가기능 → Open API** 에서 키 발급 (Open API 는 파트너스 **최종 승인** 후 쓸 수 있어요. 조건은 쿠팡 파트너스 안내를 확인하세요).
3. Vercel 환경변수: `COUPANG_ACCESS_KEY`, `COUPANG_SECRET_KEY` (선택: `COUPANG_SUB_ID`) → 다시 배포.
4. 승인 전이라면 네이버 개발자센터(https://developers.naver.com) → 애플리케이션 등록 → **검색** API → `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 을 넣으면 네이버 쇼핑 최저가로 대신 보여줍니다.
5. 확인: `/api/health` 의 `가격_쿠팡파트너스` 또는 `가격_네이버쇼핑` 이 `true`, `/api/gear?species=rockfish` 의 `provider` 가 `coupang`/`naver`.

## 4. 캐스팅·채비 움직임 영상

- `src/components/cast/scripts.ts`(대본, 순수 함수) + `CastingVideo.tsx`(그리기·플레이어)
- 촬영 영상이 아니라 **코드로 그린 애니메이션**입니다. 가볍고(추가 파일 없음), 다크 모드·휴대폰 화면에서도 선명하며, 단계마다 쉬운 자막이 나옵니다.
- 채비 방식 10가지:
  - 물가 던지기: 찌낚시(감성돔·학꽁치), 짧은 원투(노래미), 원투(가자미), 지그헤드(볼락), 에깅(무늬오징어), 카드채비(고등어)
  - 배낚시 내리기: 바닥채비(우럭), 다운샷(광어), 봉돌+에기(주꾸미·갑오징어), 타이라바(참돔)
- 공통 흐름: 준비 → 뒤로 젖히기 → 던지기(대가 휘었다 펴짐) → 줄이 풀리며 포물선 비행 → 착수 → 가라앉기 → (채비별 동작) → 입질 → 챔질 → 끌어오기. 배낚시는 준비 → 내리기(수심 표시) → 바닥 닿음 → 채비별 동작.
- 장면 위에 **실제 높이 치수**(예: "바닥에서 30~50cm", "찌밑 수심", "바닥에서 10~15m 감아올림")를 노란 선으로 보여줍니다.
- 재생/일시정지, 위치 이동, 0.5배속, 단계 바로가기. 화면에 보이면 한 번 자동 재생(기기의 "동작 줄이기" 설정이면 자동 재생 안 함).

## 5. 점검 방법
- 단위 테스트: `npm test` (가입 입력 검사·이동 주소 보안·동기화 합치기·쿠팡 서명·응답 해석·치수 데이터·애니메이션 좌표)
- 회원 E2E: `scripts/auth-e2e.mjs` 파일 맨 위 안내대로 가짜 Supabase 서버로 가입→로그인→동기화→닉네임→로그아웃→복원→탈퇴 21개 항목 확인
