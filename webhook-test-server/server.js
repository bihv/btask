const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 4000;

// Middleware to capture raw body for HMAC verification
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-mello-signature'];
    const deliveryId = req.headers['x-mello-delivery'];
    const event = req.headers['x-mello-event'];

    console.log('\n--- Webhook Received ---');
    console.log(`Event: ${event}`);
    console.log(`Delivery ID: ${deliveryId}`);

    // Verify Signature (Assuming secret is 'my-super-secret')
    // In a real app, you'd fetch the secret associated with the plugin installation
    // For this demo, let's just log if we can verify it against a known secret
    const secret = 'my-super-secret-123';
    if (signature && req.rawBody) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(req.rawBody);
        const expectedSignature = hmac.digest('hex');

        if (signature === expectedSignature) {
            console.log('✅ Signature Verified');
        } else {
            console.log('❌ Signature Mismatch');
            console.log(`Expected: ${expectedSignature}`);
            console.log(`Received: ${signature}`);
        }
    } else {
        console.log('⚠️  No signature or raw body found');
    }

    console.log('Payload:', JSON.stringify(req.body, null, 2));

    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`🚀 Demo Webhook Server running at http://localhost:${PORT}`);
    console.log(`👉 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`👉 Signature Secret: my-super-secret-123`);
});
