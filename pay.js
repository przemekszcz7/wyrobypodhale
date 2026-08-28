const crypto = require('crypto');

module.exports = async (req, res) => {
    // Nagłówki CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Błąd metody' });

    try {
        const { amount, title, email } = req.body;

        const serviceID = process.env.AUTOPAY_SERVICE_ID;
        const hashKey = process.env.AUTOPAY_HASH_KEY;
        const autopayUrl = process.env.AUTOPAY_URL || 'https://pay.autopay.eu/payment';

        if (!serviceID || !hashKey) {
            return res.status(500).json({ error: 'Brak konfiguracji zmiennych środowiskowych' });
        }

        const orderID = 'SER-ORDER-' + Date.now();
        const formattedAmount = parseFloat(amount).toFixed(2);
        const currency = 'PLN';

        const params = {
            ServiceID: serviceID,
            OrderID: orderID,
            Amount: formattedAmount,
            Currency: currency,
            Title: title,
            CustomerEmail: email
        };

        // Generowanie ciągu do wyliczenia HASH (kolejność parametrów zgodna ze specyfikacją Autopay)
        const rawHashString = `${params.ServiceID}|${params.OrderID}|${params.Amount}|${params.Currency}|${params.Title}|${params.CustomerEmail}|${hashKey}`;
        const hash = crypto.createHash('sha256').update(rawHashString, 'utf8').digest('hex');

        return res.status(200).json({
            actionUrl: autopayUrl,
            params: {
                ...params,
                Hash: hash
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
