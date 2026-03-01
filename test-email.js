const nodemailer = require('nodemailer');

async function main() {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreplay.gkk26@gmail.com',
            pass: 'yutfmttgqvligqsm',
        },
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection verified! Credentials are working.");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: '"Test" <noreplay.gkk26@gmail.com>',
            to: 'noreplay.gkk26@gmail.com', // Send to self
            subject: "Test Email from Local Script",
            text: "If you receive this, credentials work.",
        });
        console.log("✅ Message sent: %s", info.messageId);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main();
