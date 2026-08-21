const nodemailer = require("nodemailer");

class SmtpProvider {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    sendMail({ to, subject, html, text, attachments }) {
        return this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
            text,
            attachments,
        });
    }
}

module.exports = SmtpProvider;
