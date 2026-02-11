import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: false, // port 587 = STARTTLS
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export async function sendOtpMail({ email, code }) {
  // Optionnel: vérifier la connexion SMTP au premier envoi
  // (si tu veux, tu peux appeler transporter.verify() au démarrage)
  await transporter.sendMail({
    from: `"Cotisations" <${env.EMAIL_USER}>`,
    to: email,
    subject: "Votre code de vérification (OTP)",
    text: `Votre code OTP est : ${code}\nValable ${env.OTP_TTL_MINUTES} minutes.`,
  });
}
