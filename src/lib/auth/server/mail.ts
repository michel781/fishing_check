/**
 * 인증 메일 보내기 (서버 전용). 무료로 쓸 수 있는 방법만 지원한다. 먼저 설정된 것을 쓴다.
 *  1) Gmail (도메인 없이 무료, 하루 약 500통): GMAIL_USER + GMAIL_APP_PASSWORD(구글 계정 → 보안 → 앱 비밀번호)
 *  2) Brevo (무료 하루 300통): BREVO_API_KEY + MAIL_FROM(Brevo 에서 인증한 보내는 주소)
 *  3) Resend (무료 월 3,000통, 내 도메인 필요): RESEND_API_KEY + MAIL_FROM
 * 키 값은 절대 화면이나 응답에 내보내지 않는다.
 */

export type MailProvider = "gmail" | "brevo" | "resend" | "test";

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const env = (k: string) => process.env[k]?.trim() ?? "";

export function mailProvider(): MailProvider | null {
  // 자동 점검 전용: 메일을 보내지 않고 서버 메모리에 담는다 (운영에서는 절대 켜지 않음)
  if (env("FC_MAIL_TEST") === "1") return "test";
  if (env("GMAIL_USER") && env("GMAIL_APP_PASSWORD")) return "gmail";
  if (env("BREVO_API_KEY") && env("MAIL_FROM")) return "brevo";
  if (env("RESEND_API_KEY") && env("MAIL_FROM")) return "resend";
  return null;
}

/** 인증 토큰 서명용 비밀값: AUTH_SECRET, 없으면 메일 키에서 만든다 (메일 키는 서버에만 있으므로 안전) */
export function mailSecretSeed(): string {
  if (!mailProvider()) return "";
  return env("AUTH_SECRET") || env("GMAIL_APP_PASSWORD") || env("BREVO_API_KEY") || env("RESEND_API_KEY") || (env("FC_MAIL_TEST") === "1" ? "test-only" : "");
}

const FROM_NAME = "피싱체크";

export async function sendMail(m: Mail): Promise<void> {
  const p = mailProvider();
  if (!p) throw new Error("mail not configured");
  if (p === "test") {
    const box = ((globalThis as { __fcOutbox?: Mail[] }).__fcOutbox ??= []);
    box.push(m);
    if (box.length > 50) box.shift();
    return;
  }
  if (p === "gmail") {
    const { createTransport } = await import("nodemailer");
    const user = env("GMAIL_USER");
    const t = createTransport({ service: "gmail", auth: { user, pass: env("GMAIL_APP_PASSWORD").replace(/\s+/g, "") } });
    await t.sendMail({ from: { name: FROM_NAME, address: user }, to: m.to, subject: m.subject, text: m.text, html: m.html });
    return;
  }
  const from = env("MAIL_FROM");
  const r =
    p === "brevo"
      ? await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": env("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ sender: { name: FROM_NAME, email: from }, to: [{ email: m.to }], subject: m.subject, htmlContent: m.html, textContent: m.text }),
          signal: AbortSignal.timeout(10000),
        })
      : await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
          body: JSON.stringify({ from: `${FROM_NAME} <${from}>`, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
          signal: AbortSignal.timeout(10000),
        });
  if (!r.ok) throw new Error(`${p} ${r.status}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** 인증번호 메일 내용 */
export function codeMail(to: string, code: string, purpose: "signup" | "reset", minutes: number): Mail {
  const what = purpose === "signup" ? "회원가입" : "비밀번호 재설정";
  const subject = `[피싱체크] ${what} 인증번호 ${code}`;
  const text = `피싱체크 ${what} 인증번호는 ${code} 입니다.\n${minutes}분 안에 화면에 입력해 주세요.\n\n직접 요청하지 않았다면 이 메일은 무시하셔도 돼요.`;
  const html = `<!doctype html><html lang="ko"><body style="margin:0;padding:24px;background:#f3f7fc;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#0b1b3a">
<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<p style="margin:0 0 4px;font-weight:800;color:#0b3d91">🎣 피싱체크</p>
<h1 style="margin:0 0 16px;font-size:20px">${esc(what)} 인증번호</h1>
<p style="margin:0 0 8px">아래 6자리 숫자를 화면에 입력해 주세요.</p>
<p style="margin:16px 0;font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;background:#eef3f9;border-radius:12px;padding:14px 0">${esc(code)}</p>
<p style="margin:0;color:#4a5a78;font-size:14px">${minutes}분 동안만 쓸 수 있어요. 직접 요청하지 않았다면 이 메일은 무시하셔도 돼요.</p>
</div></body></html>`;
  return { to, subject, text, html };
}
