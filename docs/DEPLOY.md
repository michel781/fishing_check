# 배포 가이드

권장 경로는 **GitHub → Vercel(서울 리전 icn1)**입니다. 무료(Hobby) 플랜으로 시작할 수 있고, `main`에 푸시할 때마다 자동으로 배포됩니다.

## 0. 준비물

| 항목 | 필수 | 발급처 |
|---|---|---|
| GitHub 저장소 `michel781/fishing_check` | 예 | — |
| Vercel 계정(GitHub 로그인) | 예 | https://vercel.com |
| 공공데이터포털 인증키 `DATA_GO_KR_SERVICE_KEY` | 권장 | data.go.kr → "기상청_단기예보 조회서비스" 활용신청 |
| 바다누리 인증키 `KHOA_SERVICE_KEY` | 권장 | 국립해양조사원 바다누리 해양정보 서비스 → OpenAPI 신청 (조석예보 고·저조) |

키가 없어도 앱은 동작합니다. 이때는 Open-Meteo(무료, 키 불필요) 데이터로 계산합니다. 다만 조석은 공식 예보가 아닌 모델값이라, **바다누리 키는 꼭 받는 것을 권장**합니다.
공공데이터포털에서는 **일반 인증키(Decoding)** 값을 넣으세요. 코드에서 URL 인코딩을 처리합니다.

## 1. 코드를 GitHub에 올리기

```bash
# 저장소 루트에서
git push -u origin claude/fishing-timing-service-research-clfx0p
```

GitHub에서 이 브랜치로 PR을 만들어 `main`에 머지합니다. CI(`.github/workflows/ci.yml`)가 타입체크, 테스트, 빌드를 자동으로 돌립니다.

> Claude 세션에서 푸시가 403으로 막혔다면 두 가지 방법이 있습니다.
> - claude.ai에서 GitHub를 다시 연결하고, 저장소에 Claude GitHub App을 설치합니다.
> - 전달받은 `fishing_check.bundle`로 직접 올립니다.
>   ```bash
>   git clone fishing_check.bundle fishing_check && cd fishing_check
>   git remote set-url origin https://github.com/michel781/fishing_check.git
>   git push -u origin claude/fishing-timing-service-research-clfx0p
>   ```

## 2. Vercel 배포 (권장)

1. https://vercel.com/new 에서 **Import Git Repository**를 누르고 `michel781/fishing_check`를 선택합니다.
2. Framework는 Next.js로 자동 인식됩니다. 빌드 명령은 기본값(`next build`)을 그대로 둡니다.
3. **Environment Variables**에 다음을 입력합니다(Production·Preview 모두).
   - `DATA_GO_KR_SERVICE_KEY` = 공공데이터포털 일반 인증키(Decoding)
   - `KHOA_SERVICE_KEY` = 바다누리 인증키
   - `FISHING_OFFLINE`은 **넣지 않습니다**.
4. **Deploy**를 누릅니다. 함수 리전은 `vercel.json`에 서울(`icn1`)로 지정해 두었습니다.
5. Settings → Git → Production Branch가 `main`인지 확인합니다.

CLI로 배포하려면 다음 명령을 씁니다.
```bash
npm i -g vercel
vercel login
vercel link
vercel env add DATA_GO_KR_SERVICE_KEY production
vercel env add KHOA_SERVICE_KEY production
vercel --prod
```

## 3. 배포 후 점검 (꼭 하세요)

`https://<도메인>/api/health` 를 열어서 확인합니다.

| 필드 | 정상값 | 문제일 때 |
|---|---|---|
| `ok` | `true` (HTTP 200) | `false`(503)면 날씨·해양 데이터가 데모로 떨어진 상태 |
| `config.*_KEY` | `true` | `false`면 환경변수 이름 오타이거나 재배포를 안 한 것 |
| `west.sources.tide` | `KHOA` | `OPEN_METEO`/`ESTIMATE`면 바다누리 키나 관측소 코드 문제 → `notes` 확인 |
| `west.sources.weather` | `KMA` | `OPEN_METEO`면 기상청 키 문제 → `notes`의 오류 메시지 확인 |
| `notes` | 빈 배열 또는 안내문 | `기상청 단기예보 실패: JSON 아님: <OpenAPI_ServiceResponse…` 는 키 미승인·인코딩 오류 |

이어서 다음을 확인합니다.
- `/spot/sinjin-outer` 의 만조·간조 시각을 바다타임이나 바다누리의 **안흥** 물때표와 비교합니다(몇 분 이내여야 정상).
- 휴대폰 브라우저 메뉴에서 **홈 화면에 추가**를 누르고, 앱처럼 열리는지 확인합니다.

자주 나는 문제:
- **공공데이터포털 키 승인 지연**: 신청 직후에는 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`가 날 수 있습니다. 보통 1~2시간 뒤 풀립니다.
- **바다누리 API 주소 변경**: 기관이 주소를 바꾸면 조석 호출이 실패합니다. 코드 수정 없이 `KHOA_TIDE_URL` 환경변수로 주소를 바꿀 수 있습니다.
- **호출 한도**: 서버에서 30분 캐시를 둡니다. 트래픽이 늘면 운영계정을 신청하세요.

## 4. 커스텀 도메인 (선택)

Vercel → Settings → Domains 에서 도메인을 추가하고, DNS에 표시되는 CNAME/A 레코드를 등록합니다. HTTPS는 자동으로 적용됩니다. PWA 설치와 위치 권한은 HTTPS에서만 동작합니다.

## 5. 대안: Google Cloud Run (서울 리전)

Vercel을 쓰지 않을 때 선택합니다. 저장소에 `Dockerfile`(Next standalone)을 포함해 두었습니다.

```bash
gcloud run deploy fishing-check \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars DATA_GO_KR_SERVICE_KEY=...,KHOA_SERVICE_KEY=...
```

로컬에서 이미지를 확인하려면 다음 명령을 씁니다.
```bash
docker build -t fishing-check .
docker run -p 8080:8080 -e DATA_GO_KR_SERVICE_KEY=... fishing-check
```

## 6. 운영 체크리스트
- [ ] `/api/health`가 200이고 조석=KHOA, 날씨=KMA
- [ ] 서해·동해 포인트 각 2곳의 만조·간조가 공식 물때표와 일치
- [ ] 모바일에서 홈 화면에 추가됨, 오프라인일 때 마지막 화면이 표시됨
- [ ] Vercel Analytics 또는 Speed Insights 켜기(선택)
- [ ] 금어기·금지체장 데이터 연 1회 검수 일정 등록
