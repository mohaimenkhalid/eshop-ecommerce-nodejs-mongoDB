const puppeteer = require("puppeteer");
const { renderInvoiceHtml } = require("../templates/invoice.template");
const createError = require("../utils/createError");

exports.generateInvoicePdf = async (order, payment) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(renderInvoiceHtml(order, payment), { waitUntil: "load" });
        return await page.pdf({ format: "A4", printBackground: true });
    } catch (e) {
        throw createError(`Failed to generate invoice PDF: ${e.message}`, 500);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
