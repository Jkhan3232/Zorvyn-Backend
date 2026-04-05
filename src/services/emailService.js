const nodemailer = require("nodemailer");
const mjml2html = require("mjml");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const emailTemplates = require("../templates/emailTemplates.mjml");

let transporter;

const isSmtpConfigured = () => {
  return Boolean(
    env.smtpHost &&
    env.smtpPort &&
    env.smtpUser &&
    env.smtpPass &&
    env.smtpFromEmail,
  );
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (env.nodeEnv === "test") {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.info("[EmailService] Using json transport for test environment");
    return transporter;
  }

  if (!isSmtpConfigured()) {
    throw new ApiError(
      500,
      "SMTP is not configured. Set SMTP env variables to send credential emails.",
    );
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  console.info(
    `[EmailService] SMTP transporter initialized (host=${env.smtpHost}, port=${env.smtpPort}, secure=${env.smtpSecure})`,
  );

  return transporter;
};

const sendCredentialsEmail = async ({ to, name, password, role }) => {
  const mailTransport = getTransporter();
  const logContext = `[EmailService] sendCredentialsEmail to=${to} role=${role}`;

  console.info(`${logContext} - sending started`);

  const { subject, text, mjml } = emailTemplates.managedUserCredentials({
    name,
    email: to,
    role,
    password,
    loginUrl: env.appLoginUrl,
    brandName: env.smtpFromName || "Finance Dashboard",
  });

  const { html } = mjml2html(mjml, {
    validationLevel: "soft",
  });

  if (!html) {
    throw new ApiError(500, "Unable to render credentials email template.");
  }

  const from = env.smtpFromName
    ? `"${env.smtpFromName}" <${env.smtpFromEmail}>`
    : env.smtpFromEmail;

  try {
    const info = await mailTransport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.info(
      `${logContext} - sent successfully (messageId=${info.messageId || "n/a"})`,
    );
  } catch (error) {
    console.error(`${logContext} - sending failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendCredentialsEmail,
};
