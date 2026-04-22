import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

export async function sendResetEmail(email, token) {
  const link = `${env.FRONT_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"Segurança" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperação de senha',
    html: `
      <div style="font-family: Arial; padding: 20px">
        <h2>Recuperação de senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>

        <a href="${link}" 
           style="display:inline-block;padding:10px 20px;background:#22c55e;color:#fff;text-decoration:none;border-radius:5px">
          Redefinir senha
        </a>

        <p style="margin-top:20px;font-size:12px;color:#777">
          Este link expira em 15 minutos.
        </p>

        <p style="font-size:12px;color:#999">
          Se você não solicitou, ignore este e-mail.
        </p>
      </div>
    `,
  })
}