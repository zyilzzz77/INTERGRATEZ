import nodemailer from "nodemailer";

// Konfigurasi transporter menggunakan pengaturan SMTP dari .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

const APP_NAME = process.env.APP_NAME || "Inversave";
const LOGO_URL = process.env.APP_LOGO_URL || "https://inversave.space/logo-inversave.webp";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://inversave.space";
const PRIMARY_COLOR = "#000000";

// Template HTML wrapper untuk email
const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #18181b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: ${PRIMARY_COLOR}; padding: 30px 20px; text-align: center; }
        .logo { width: 60px; height: 60px; border-radius: 12px; margin-bottom: 10px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .content h2 { margin-top: 0; color: #18181b; font-size: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; }
        .footer p { margin: 5px 0; }
        .highlight { font-weight: 600; color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" class="logo" />
            <h1>${APP_NAME}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
        </div>
    </div>
</body>
</html>
`;

export async function sendLoginSuccessEmail(email: string, name: string) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return; // Skip if not configured

    const date = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "full",
        timeStyle: "short"
    }) + " WIB";

    const content = `
        <h2>Halo, ${name}! 👋</h2>
        <p>Login baru terdeteksi pada akun <strong>${APP_NAME}</strong> Anda.</p>
        <p><strong>Waktu:</strong> ${date}</p>
        <p>Jika ini bukan Anda, mohon segera amankan akun Anda (ganti password akun Google Anda).</p>
        <p>Terima kasih telah menggunakan layanan <strong>${APP_NAME}</strong>!</p>
        <a href="${SITE_URL}" class="button">Buka ${APP_NAME}</a>
    `;

    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `Peringatan Keamanan: Login Baru di ${APP_NAME}`,
            html: getEmailTemplate(content),
        });
        console.log(`[Email] Login success sent to ${email}`);
    } catch (error) {
        console.error("[Email] Failed to send login email:", error);
    }
}

export async function sendTopupSuccessEmail(email: string, name: string, packageName: string, nominal: number, credits?: number) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;

    const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
    const formattedNominal = formatter.format(nominal);

    const date = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "full",
        timeStyle: "short"
    }) + " WIB";

    const content = `
        <h2>Pembayaran Berhasil! 🎉</h2>
        <p>Halo, ${name}. Terima kasih atas pembelian paket ${packageName}!</p>
        <p>Top-up koin Anda telah berhasil diproses dengan detail berikut:</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #71717a;">Paket</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${packageName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #71717a;">Total Pembayaran</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formattedNominal}</td>
                </tr>
                ${credits ? `<tr>
                    <td style="padding: 8px 0; color: #71717a;">Kredit Masuk</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">+${credits} Koin</td>
                </tr>` : ""}
                <tr>
                    <td style="padding: 8px 0; color: #71717a;">Waktu Transaksi</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${date}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #71717a;">Status</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #16a34a;">✅ Berhasil</td>
                </tr>
            </table>
        </div>
        <p>Kredit telah ditambahkan ke akun Anda dan bisa langsung digunakan.</p>
        <a href="${SITE_URL}/profile" class="button">Cek Profil Anda</a>
    `;

    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `✅ Top Up ${packageName} Berhasil — ${formattedNominal}`,
            html: getEmailTemplate(content),
        });
        console.log(`[Email] Topup success sent to ${email}`);
    } catch (error) {
        console.error("[Email] Failed to send topup email:", error);
    }
}

export async function sendCreditExpiryWarningEmail(email: string, name: string, remainingDays: number) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;

    const content = `
        <h2>Peringatan: Paket Anda Segera Berakhir ⚠️</h2>
        <p>Halo, ${name}.</p>
        <p>Kami ingin mengingatkan bahwa paket berlangganan / kredit Anda akan berakhir dalam <span class="highlight">${remainingDays} hari</span>.</p>
        <p>Jangan sampai fitur premium Anda terhenti! Yuk lakukan perpanjangan sekarang untuk terus menikmati layanan terbaik dari ${APP_NAME}.</p>
        <a href="${SITE_URL}/profile" class="button">Perpanjang Sekarang</a>
    `;

    try {
        await transporter.sendMail({
            from: `"${APP_NAME} Peringatan" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `Paket Inversave Anda Berakhir Dalam ${remainingDays} Hari`,
            html: getEmailTemplate(content),
        });
        console.log(`[Email] Expiry warning sent to ${email}`);
    } catch (error) {
        console.error("[Email] Failed to send expiry warning email:", error);
    }
}
