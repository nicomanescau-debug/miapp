// Prueba el envío de correo sin tener que pasar por la app entera.
//   npm run mail:test -- destino@ejemplo.com
import "dotenv/config";
import { sendPasswordResetEmail } from "../src/lib/mailer";

const to = process.argv[2] || process.env.SMTP_USER;

if (!to) {
  console.error("Falta el destinatario: npm run mail:test -- destino@ejemplo.com");
  process.exit(1);
}

sendPasswordResetEmail(to, "usuario-de-prueba", "123456")
  .then(() => console.log(`Correo de prueba enviado a ${to} desde ${process.env.SMTP_USER}`))
  .catch((err) => {
    console.error("Falló el envío:", err.message);
    process.exit(1);
  });
