# 08. 주소(도메인) 바꾸기 — 무료 방법

## 추천 순서
1. **Vercel 무료 주소 이름 바꾸기 (가장 쉬움, 0원, 1분)** — `○○○.vercel.app`
2. 무료 도메인 서비스 (eu.org 등) — 승인에 몇 주, 운영 안정성은 낮음
3. 유료 도메인 (`.com`, `.kr`) — 1년 1~2만 원대. 나중에 서비스가 커지면 추천

## 추천 주소 (짧고 기억하기 쉬운 순)
| 주소 | 뜻 |
|---|---|
| `fishingcheck.vercel.app` | 지금 이름에서 하이픈만 뺀 짧은 주소 |
| `mulddae.vercel.app` | 물때 |
| `badanaksi.vercel.app` | 바다낚시 |
| `goldentide.vercel.app` | 황금타임 + 물때 |
| `fishtime.vercel.app` | 낚시 타이밍 |
| `nakksi.vercel.app` | 낚시 |

이미 누가 쓰고 있으면 Vercel 이 "사용 중"이라고 알려주니 다음 후보를 넣으면 됩니다.

## Vercel 에서 바꾸는 방법
1. Vercel → 프로젝트 **fishing-check** → **Settings → Domains**
2. **Add** → 원하는 주소(예: `mulddae.vercel.app`) 입력 → 추가
3. 새 주소 오른쪽 메뉴에서 **Set as Primary** (옛 주소는 자동으로 새 주소로 넘어가게 둡니다)
4. 공유 미리보기·회원가입 주소는 코드가 Vercel 운영 주소를 자동으로 읽어 따라갑니다(`VERCEL_PROJECT_PRODUCTION_URL`). 다시 배포 한 번만 하면 됩니다.

## 주소를 바꾼 뒤 같이 고칠 곳
- Supabase → Authentication → URL Configuration: Site URL, Redirect URLs (`/auth/callback`, `/auth/update-password`)
- 카카오 로그인을 쓰면 카카오 개발자센터의 사이트 도메인
- 쿠팡 파트너스 활동 채널 주소
- 카카오톡 공유 썸네일 캐시 초기화: https://developers.kakao.com/tool/debugger/sharing
