import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP no configurado en el servidor (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    // Google muestra la contraseña de aplicación en grupos de 4 ("abcd efgh ijkl mnop");
    // si se pega tal cual, la autenticación falla. Quitamos los espacios.
    auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s/g, "") },
  });
  return transporter;
}

export async function sendPasswordResetEmail(to: string, username: string, code: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({
    from: `MiFinanzas <${from}>`,
    to,
    subject: "Recuperá tu cuenta de MiFinanzas",
    text:
      `Tu usuario es: ${username}\n\n` +
      `Tu código para restablecer la contraseña es: ${code}\n` +
      `Vence en 30 minutos.\n\n` +
      `Si vos no pediste esto, podés ignorar este correo.`,
    html:
      `<p>Tu usuario es: <strong>${username}</strong></p>` +
      `<p>Tu código para restablecer la contraseña es:</p>` +
      `<p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>` +
      `<p>Vence en 30 minutos.</p>` +
      `<p style="color:#666;font-size:13px;">Si vos no pediste esto, podés ignorar este correo.</p>`,
  });
}
