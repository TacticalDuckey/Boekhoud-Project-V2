import nodemailer from "nodemailer";

export async function handler(req, res) {
  const { to, factuurNummer, pdfUrl } = await req.json();

  const transporter = nodemailer.createTransport({
    host: "smtp.titan.email",
    port: 465,
    secure: true,
    auth: {
      user: "calvin@barhorstpodiumtechniek.com",
      pass: "10November1962#",
    },
  });

  await transporter.sendMail({
    from: '"Barhorst Podium Techniek" <calvin@barhorstpodiumtechniek.com>',
    to: to,
    subject: `Factuur ${factuurNummer}`,
    text: `Beste klant,\n\nBijgevoegd vindt u uw factuur: ${factuurNummer}\n\nGroeten,\nBarhorst Podium Techniek`,
    attachments: [
      { filename: `Factuur-${factuurNummer}.pdf`, path: pdfUrl }
    ]
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
