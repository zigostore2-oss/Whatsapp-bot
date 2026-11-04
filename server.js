const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

let latestQrCode = "";
let isBotReady = false;

// 1. Kodular ඇප් එකෙන් සල්ලි කපන්න OTP රික්වෙස්ට් එක එන්නේ මෙතනටයි
app.post('/api/request-otp', async (req, res) => {
    const { phone } = req.body;
    
    try {
        // Ideamart API එකට සල්ලි කපන්න Request එක යැවීම
        const response = await axios.post('https://ideamart.io', {
            "applicationId": "APP_XXXXXX", // පසුව ඔයාගේ Ideamart App ID එක මෙතනට දාන්න
            "password": "your_password",
            "subscriberId": phone,
            "action": "1"
        });
        
        return res.json({ status: "OTP_SENT" });
    } catch (error) {
        // දැනට Ideamart සෙට් කරලා නැති නිසා Test එකක් විදිහට සාර්ථකයි කියා යවමු
        return res.json({ status: "OTP_SENT", note: "Testing Mode Active" });
    }
});

// 2. WhatsApp ලොජික් එක පණගැන්වීම
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    latestQrCode = qr; // QR එක සේව් කරගැනීම
    isBotReady = false;
});

client.on('ready', () => {
    isBotReady = true;
    latestQrCode = "";
    console.log('WhatsApp Bot එක සාර්ථකව Ready වුණා! ✅');
});

// බොට් එකෙන් මැසේජ් වලට රිප්ලයි කරන කොටස
client.on('message', message => {
    if (message.body.toLowerCase() === 'hi') {
        message.reply('හෙලෝ! මම ඔයාගේ ඇප් එක හරහා වැඩ කරන WhatsApp බොට් කෙනෙක්.');
    }
});

// 3. Kodular ඇප් එකට QR code එක පෙන්වන්න හදන ලින්ක් එක
app.get('/api/get-qr', async (req, res) => {
    if (isBotReady) {
        return res.json({ status: "READY" });
    }
    if (latestQrCode) {
        // QR එක ඇප් එකට කියවන්න පුළුවන් Image එකක් (Data URL) බවට පත් කිරීම
        const qrImage = await qrcode.toDataURL(latestQrCode);
        return res.json({ status: "QR", image: qrImage });
    }
    return res.json({ status: "LOADING" });
});

client.initialize();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
