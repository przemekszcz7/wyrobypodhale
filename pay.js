// Funkcja pomocnicza do generowania HASH SHA-256 w przeglądarce
async function generateAutopayHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Główna funkcja wywoływana przy płatności
async function processAutopayPayment(orderData) {
    const btn = document.getElementById('btn-submit-order');
    const originalText = btn ? btn.innerHTML : '';

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳ PRZETWARZANIE...</span>';
        }

        // KONFIGURACJA AUTOPAY
        const serviceID = '220936';
        const hashKey = '353a7d95b0c32400acfaf44c7a07aea2479dd25dec0f0159d41f94bf52d63a73';
        const autopayUrl = 'https://pay.autopay.eu/payment';

        // PRZYGOTOWANIE DANYCH
        const subtotal = orderData.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const totalAmount = (subtotal + 15.00).toFixed(2); // Format 0.00
        const orderID = 'SER-ORDER-' + Date.now();
        const currency = 'PLN';
        const title = `Zamówienie sery (${orderData.cart.length} prod.)`;
        const email = orderData.email;

        // GENEROWANIE HASH
        const rawHashString = `${serviceID}|${orderID}|${totalAmount}|${currency}|${title}|${email}|${hashKey}`;
        const hash = await generateAutopayHash(rawHashString);

        // PRZYGOTOWANIE FORMULARZA POST
        const params = {
            ServiceID: serviceID,
            OrderID: orderID,
            Amount: totalAmount,
            Currency: currency,
            Title: title,
            CustomerEmail: email,
            Hash: hash
        };

        // AUTO-SUBMIT FORMULARZA DO AUTOPAY
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = autopayUrl;

        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

    } catch (error) {
        console.error('Autopay Error:', error);
        alert('⚠️ Błąd płatności: ' + error.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}
