const formatCurrency = (amount) => `${Number(amount || 0).toFixed(2)}`;

const renderAddress = (address = {}) => {
    return [
        address.receiverName,
        address.receiverPhone,
        address.addressLine,
        [address.area, address.city, address.division].filter(Boolean).join(", "),
        [address.postalCode, address.country].filter(Boolean).join(", "),
    ]
        .filter(Boolean)
        .join("<br/>");
};

const renderItemRow = (item) => `
    <tr>
        <td>${item.productName}${item.variantName ? ` (${item.variantName})` : ""}</td>
        <td>${item.sku}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${formatCurrency(item.unitPrice)}</td>
        <td class="right">${formatCurrency(item.totalPrice)}</td>
    </tr>
`;

exports.renderInvoiceHtml = (order, payment) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: Helvetica, Arial, sans-serif;
                color: #1a1a1a;
                margin: 0;
                padding: 32px;
                font-size: 12px;
            }
            h1 { font-size: 20px; margin: 0 0 4px; }
            .muted { color: #666; }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 24px;
            }
            .section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 24px;
            }
            .section > div { width: 48%; }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
            }
            th, td {
                padding: 8px;
                border-bottom: 1px solid #e0e0e0;
                text-align: left;
            }
            th { background: #f5f5f5; }
            .right { text-align: right; }
            .totals {
                width: 280px;
                margin-left: auto;
            }
            .totals div {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
            }
            .totals .grand-total {
                font-weight: bold;
                font-size: 14px;
                border-top: 2px solid #1a1a1a;
                margin-top: 4px;
                padding-top: 8px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>Invoice</h1>
                <div class="muted">Order #${order.orderNumber}</div>
                <div class="muted">Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
        </div>

        <div class="section">
            <div>
                <strong>Shipping Address</strong>
                <div>${renderAddress(order.shippingAddress)}</div>
            </div>
            <div>
                <strong>Payment</strong>
                <div>
                    Method: ${order.paymentMethod}<br/>
                    Status: ${order.paymentStatus}<br/>
                    ${payment?.paymentNumber ? `Payment #: ${payment.paymentNumber}<br/>` : ""}
                    ${payment?.transactionId ? `Transaction ID: ${payment.transactionId}<br/>` : ""}
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th class="right">Qty</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(renderItemRow).join("")}
            </tbody>
        </table>

        <div class="totals">
            <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
            <div><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>
            <div><span>Delivery Charge</span><span>${formatCurrency(order.deliveryCharge)}</span></div>
            <div class="grand-total"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
        </div>
    </body>
    </html>
    `;
};
