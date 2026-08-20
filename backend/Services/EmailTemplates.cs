namespace ThePainterBoys.Api.Services;

/// <summary>
/// Table-based layout with inline styles throughout — required for consistent
/// rendering across email clients (Gmail, Outlook, etc. strip or ignore much
/// of &lt;style&gt; blocks and modern CSS), unlike the site's own React CSS.
/// </summary>
public static class EmailTemplates
{
    public static string Welcome(string firstName)
    {
        var safeName = string.IsNullOrWhiteSpace(firstName) ? "there" : firstName;
        return $$"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#f4ede1;font-family:'Segoe UI',Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4ede1;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fffdf8;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(13,33,55,.12);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#0d2137,#1c4068);padding:36px 32px 28px;text-align:center;">
                      <div style="font-size:34px;line-height:1;margin-bottom:8px;">🎨</div>
                      <div style="font-size:22px;font-weight:800;color:#f2871f;letter-spacing:.02em;">The Painter Boys</div>
                      <div style="font-size:11px;color:rgba(255,255,255,.6);letter-spacing:.14em;text-transform:uppercase;margin-top:6px;">Professional Painting Services</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 32px 8px;">
                      <h1 style="margin:0 0 16px;font-size:20px;color:#1a2c3d;">Welcome, {{safeName}}! 👋</h1>
                      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4a58;">
                        Thanks for signing in — your account with The Painter Boys is now set up. We've been trusted by homeowners across
                        Ghaziabad, Noida and Delhi NCR for over a decade, and we're glad to have you with us.
                      </p>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3c4a58;">
                        Once your painting project is underway, you'll be able to track progress and see work-in-progress photos right
                        from your account here.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px;text-align:center;">
                      <a href="https://www.thepainterboys.com" style="display:inline-block;background:linear-gradient(135deg,#f2871f,#c9660a);color:#0d2137;font-weight:800;font-size:14px;padding:13px 28px;border-radius:8px;text-decoration:none;">
                        Visit The Painter Boys
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f4ede1;padding:20px 32px;text-align:center;border-top:1px solid #e8ddc9;">
                      <div style="font-size:13px;color:#6b5f4f;margin-bottom:4px;">🌐 www.thepainterboys.com</div>
                      <div style="font-size:13px;color:#6b5f4f;">📞 Corporate: 7838888509</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }
}
