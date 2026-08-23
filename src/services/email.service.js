const mailConfig = require("../config/mail.config");
const createError = require("../utils/createError");
const createMailProvider = require("./email/provider.factory");

class EmailService {
    constructor(provider = createMailProvider(mailConfig.driver)) {
        this.provider = provider;
    }

    async sendMail({ to, subject, html, text, attachments }) {
        try {
            return await this.provider.sendMail({ to, subject, html, text, attachments });
        } catch (e) {
            throw createError(`Failed to send email: ${e.message}`, 500);
        }
    }
}

const emailService = new EmailService();

module.exports = emailService;
module.exports.EmailService = EmailService;
