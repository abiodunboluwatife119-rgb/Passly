import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (user) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info('Welcome email skipped: configure SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || SMTP_USER,
    to: user.email,
    subject: 'Welcome to Passly',
    text: `Hi ${user.name},\n\nWelcome to Passly. Your account is ready to use.\n\nThe Passly team`,
  });
};