const mailConfig = require("../config/mail.config");
const createError = require("../utils/createError");

const SmtpProvider = require("./email/smtp.provider");
// const SesProvider = require("./email/ses.provider");
// const SendgridProvider = require("./email/sendgrid.provider");

class EmailService {
    constructor() {
        switch (mailConfig.driver) {
            case "smtp":
                this.provider = new SmtpProvider();
                break;

            case "ses":
                //this.provider = new SesProvider();
                break;

            case "sendgrid":
                //this.provider = new SendgridProvider();
                break;

            default:
                throw new Error(`Unsupported mail driver: ${mailConfig.driver}`);
        }
    }

    async sendMail({ to, subject, html, text, attachments }) {
        try {
            return await this.provider.sendMail({ to, subject, html, text, attachments });
        } catch (e) {
            throw createError(`Failed to send email: ${e.message}`, 500);
        }
    }
}

module.exports = new EmailService();
