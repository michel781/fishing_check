import { after } from "next/server";

/**
 * 응답을 보낸 뒤에도 늦게 오는 외부 요청을 끝까지 받게 한다 (그래야 다음 방문자는 캐시된 값을 바로 받는다).
 * Next 요청 밖(테스트·스크립트)에서는 그냥 둔다.
 */
export function keepAlive(p: Promise<unknown>) {
  try {
    after(() => p.then(() => undefined));
  } catch {
    void p.catch(() => {});
  }
}
