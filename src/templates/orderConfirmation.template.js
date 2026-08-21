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
        <td class="right">${item.quantity}</td>
        <td class="right">${formatCurrency(item.unitPrice)}</td>
        <td class="right">${formatCurrency(item.totalPrice)}</td>
    </tr>
`;

exports.renderOrderConfirmationHtml = (order) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body {
                font-family: Helvetica, Arial, sans-serif;
                color: #1a1a1a;
                margin: 0;
                padding: 24px;
                font-size: 14px;
            }
            h1 { font-size: 20px; margin: 0 0 8px; }
            .muted { color: #666; }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
            }
            th, td {
                padding: 8px;
                border-bottom: 1px solid #e0e0e0;
                text-align: left;
            }
            th { background: #f5f5f5; }
            .right { text-align: right; }
            .total { font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Your order is placed</h1>
        <p>Hi ${order?.user?.name || "there"},</p>
        <p>
            Thank you for shopping with us. We have received your order
            <strong>#${order.orderNumber}</strong> and it is now being processed.
        </p>
        <p class="muted">
            Order date: ${new Date(order.createdAt).toLocaleString()}<br/>
            Payment method: ${order.paymentMethod}<br/>
            Order status: ${order.status}
        </p>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="right">Qty</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(renderItemRow).join("")}
            </tbody>
        </table>

        <p>
            Subtotal: ${formatCurrency(order.subtotal)}<br/>
            Discount: -${formatCurrency(order.discount)}<br/>
            Delivery Charge: ${formatCurrency(order.deliveryCharge)}<br/>
            <span class="total">Total: ${formatCurrency(order.total)}</span>
        </p>

        <p><strong>Shipping Address</strong><br/>${renderAddress(order.shippingAddress)}</p>

        <p class="muted">
            Your invoice will be emailed to you once the order is approved.
        </p>
    </body>
    </html>
    `;
};
