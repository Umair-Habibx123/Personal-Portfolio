// The email you receive for each contact-form message, styled like the site:
// dark header, violet -> pink -> amber accent, light body.
//
// Email programs only understand old-fashioned HTML, so this uses tables and
// inline styles, with solid colours behind every gradient for apps (like some
// Outlook versions) that ignore gradients. Everything the visitor typed is
// escaped, so a message can't inject HTML into your inbox.

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ACCENT = 'linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b)';
const FONT = "'Poppins','Segoe UI',Helvetica,Arial,sans-serif";

/** When the message arrived, in Pakistan time ("10 Nov 2026, 20:41"). */
function when(iso) {
  try {
    return new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' }) + ' PKT';
  } catch {
    return iso;
  }
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ececef;width:96px;vertical-align:top;font:600 11px/18px ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:#9999a1;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ececef;vertical-align:top;font:500 14px/20px ${FONT};color:#1f1f1f;">${value}</td>
    </tr>`;
}

/**
 * @param {{ id: string, receivedAt: string, name: string, email: string, subject?: string, message: string }} record
 * @param {{ siteUrl?: string, ownerName?: string }} [opts]
 */
export function renderEmail(record, { siteUrl = 'https://umairhabib.vercel.app', ownerName = 'Umair' } = {}) {
  const name = esc(record.name);
  const email = esc(record.email);
  const subject = record.subject ? esc(record.subject) : '<span style="color:#9999a1;">No subject</span>';
  const message = esc(record.message).replace(/\n/g, '<br>');
  const preview = esc(record.message.replace(/\s+/g, ' ').slice(0, 110));
  const replySubject = encodeURIComponent(`Re: ${record.subject || 'Your message on my portfolio'}`);
  const replyHref = `mailto:${encodeURIComponent(record.email)}?subject=${replySubject}`;
  const site = esc(siteUrl.replace(/^https?:\/\//, ''));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>New message from ${name}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f6;">
  <!-- inbox preview line -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${name}: ${preview}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 20px 60px -20px rgba(31,31,31,0.35);">

          <!-- header -->
          <tr>
            <td bgcolor="#141414" style="background:#141414;background-image:linear-gradient(135deg,#141414 55%,#2b1055 100%);padding:28px 32px 24px;">
              <p style="margin:0;font:800 26px/1 ${FONT};letter-spacing:6px;color:#ffffff;">${esc(ownerName.toUpperCase())}</p>
              <p style="margin:10px 0 0;font:600 11px/1 ${FONT};letter-spacing:2.5px;text-transform:uppercase;color:#d4d4d8;">New message from your portfolio</p>
            </td>
          </tr>
          <!-- accent bar -->
          <tr><td bgcolor="#ec4899" style="background:#ec4899;background-image:${ACCENT};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

          <!-- body -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0;font:900 24px/1.25 ${FONT};color:#1f1f1f;">${name} <span style="color:#ec4899;">wants to get in touch.</span></h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid #ececef;">
                ${row('From', name)}
                ${row('Email', `<a href="mailto:${email}" style="color:#7c3aed;text-decoration:none;font-weight:600;">${email}</a>`)}
                ${row('Subject', subject)}
                ${row('Received', esc(when(record.receivedAt)))}
              </table>

              <p style="margin:26px 0 10px;font:600 11px/1 ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:#9999a1;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="#f4f4f6" style="background:#f4f4f6;border-left:4px solid #ec4899;border-radius:0 12px 12px 0;padding:18px 20px;font:400 15px/1.65 ${FONT};color:#292929;">${message}</td>
                </tr>
              </table>

              <!-- reply button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                <tr>
                  <td bgcolor="#7c3aed" style="border-radius:12px;background:#7c3aed;background-image:${ACCENT};">
                    <a href="${replyHref}" style="display:inline-block;padding:14px 28px;font:700 14px/1 ${FONT};letter-spacing:1px;color:#ffffff;text-decoration:none;">REPLY TO ${esc(record.name.trim().split(/\s+/)[0]).toUpperCase()}</a>
                  </td>
                  <td style="padding-left:16px;">
                    <a href="${esc(siteUrl)}" style="font:600 13px/1 ${FONT};color:#5b5b5b;text-decoration:none;">Open portfolio &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:6px 0 26px;font:400 12px/1.5 ${FONT};color:#9999a1;">Or just press Reply in your email app: it goes straight to ${email}.</p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td bgcolor="#1f1f1f" style="background:#1f1f1f;padding:18px 32px;">
              <p style="margin:0;font:400 12px/1.6 ${FONT};color:#9999a1;">
                Sent from the contact form on <a href="${esc(siteUrl)}" style="color:#d4d4d8;text-decoration:none;">${site}</a>.
                A copy is saved in your private backup repo &middot; ID <span style="color:#d4d4d8;">${esc(record.id)}</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
