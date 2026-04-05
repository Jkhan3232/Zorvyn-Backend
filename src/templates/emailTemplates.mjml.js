const emailTemplates = {
  baseLayout: ({
    title,
    previewText,
    content,
    brandName = "Zorvyn Finance Dashboard",
  }) => `
    <mjml>
      <mj-head>
        <mj-preview>${previewText || title}</mj-preview>
        <mj-attributes>
          <mj-all font-family="Helvetica, Arial, sans-serif" />
          <mj-text color="#22303f" line-height="1.5" />
        </mj-attributes>
        <mj-style>
          .credentials-box {
            background: #f4f8ff;
            border: 1px solid #dde8ff;
            border-radius: 8px;
            padding: 16px;
          }
        </mj-style>
      </mj-head>
      <mj-body background-color="#f2f5f9">
        <mj-section padding="24px 0 0 0">
          <mj-column></mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="10px 10px 0 0" padding="24px 24px 12px 24px">
          <mj-column>
            <mj-text font-size="22px" font-weight="700" color="#102a43" align="center" padding="0">
              ${brandName}
            </mj-text>
            <mj-text font-size="12px" color="#627d98" align="center" padding="8px 0 0 0">
              Secure Access Notification
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" padding="0 24px">
          <mj-column>
            <mj-divider border-width="1px" border-color="#e6ecf3" padding="0" />
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" border-radius="0 0 10px 10px" padding="24px 24px 28px 24px">
          <mj-column>
            <mj-text font-size="24px" color="#102a43" font-weight="700" padding="0 0 16px 0">
              ${title}
            </mj-text>
            ${content}
          </mj-column>
        </mj-section>

        <mj-section padding="20px 0 28px 0">
          <mj-column>
            <mj-text font-size="12px" color="#7b8794" align="center" line-height="1.5">
              ${brandName}<br />
              © ${new Date().getFullYear()} ${brandName}. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,

  managedUserCredentials: ({
    name,
    email,
    role,
    password,
    loginUrl,
    brandName = "Finance Dashboard",
  }) => {
    const safeLoginUrl = loginUrl || "https://example.com/login";

    const content = `
      <mj-text font-size="15px" color="#334e68" padding="0 0 12px 0">
        Hello ${name},
      </mj-text>
      <mj-text font-size="15px" color="#334e68" padding="0 0 16px 0">
        Your account has been created by an administrator. Please use the credentials below to sign in.
      </mj-text>

      <mj-text css-class="credentials-box" font-size="14px" color="#243b53" padding="0 0 16px 0">
        <strong>Role:</strong> ${role}<br />
        <strong>Email:</strong> ${email}<br />
        <strong>Temporary Password:</strong> ${password}
      </mj-text>

      <mj-button href="${safeLoginUrl}" background-color="#0f62fe" color="#ffffff" border-radius="6px" font-size="14px" padding="0 0 16px 0">
        Login Now
      </mj-button>

      <mj-text font-size="13px" color="#9f1239" padding="0 0 16px 0">
        For security, please change your password immediately after first login.
      </mj-text>

      <mj-divider border-color="#e6ecf3" border-width="1px" padding="8px 0 16px 0" />

      <mj-text font-size="14px" color="#486581" padding="0">
        Thanks,<br /><strong>Team ${brandName}</strong>
      </mj-text>
    `;

    const subject = "Your account credentials";
    const previewText = `Your ${brandName} account is ready`;
    const text = [
      `Hello ${name},`,
      "",
      "Your account has been created by an administrator.",
      `Role: ${role}`,
      `Email: ${email}`,
      `Temporary Password: ${password}`,
      `Login URL: ${safeLoginUrl}`,
      "",
      "Please change your password after first login.",
    ].join("\n");

    return {
      subject,
      text,
      mjml: emailTemplates.baseLayout({
        title: "Welcome to Finance Dashboard",
        previewText,
        content,
        brandName,
      }),
    };
  },
};

module.exports = emailTemplates;
