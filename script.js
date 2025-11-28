import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔑 Vul hier jouw Supabase gegevens in
const supabaseUrl = 'https://uvoorwkmosvuptjsnarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2b29yd2ttb3N2dXB0anNuYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTk1MjgsImV4cCI6MjA3OTkzNTUyOH0._sNeaelFyyyZne79V9Io7TimshgXjzDmTVZpda7lHik


';
const supabase = createClient(supabaseUrl, supabaseKey);

// Login functie
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if(error) {
    alert(error.message);
    return;
  }
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadInvoices();
}

// Factuur aanmaken & versturen
window.createInvoice = async function() {
  const clientNaam = document.getElementById("clientNaam").value;
  const clientEmail = document.getElementById("clientEmail").value;
  const factuurNummer = document.getElementById("factuurNummer").value;
  const totaalBedrag = parseFloat(document.getElementById("totaalBedrag").value);

  // 1️⃣ Sla klant op
  let { data: clientData, error: clientError } = await supabase
    .from('clients')
    .insert([{ bedrijf_naam: clientNaam, email: clientEmail }])
    .select()
    .single();

  if(clientError) { alert(clientError.message); return; }

  // 2️⃣ Sla factuur op
  let { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert([{
      client_id: clientData.id,
      factuur_nummer: factuurNummer,
      factuur_datum: new Date(),
      totaal_bedrag: totaalBedrag,
      status: 'verzonden'
    }])
    .select()
    .single();

  if(invoiceError) { alert(invoiceError.message); return; }

  // 3️⃣ PDF genereren
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Factuur ${factuurNummer}`, 10, 10);
  doc.text(`Klant: ${clientNaam}`, 10, 20);
  doc.text(`Totaal: €${totaalBedrag}`, 10, 30);
  const pdfBlob = doc.output('blob');

  // 4️⃣ Upload PDF naar Supabase Storage (bucket 'facturen')
  const fileName = `facturen/Factuur-${factuurNummer}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('facturen')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

  if(uploadError) console.log('Upload error:', uploadError.message);

  // 5️⃣ Verstuur e-mail via Supabase Function
  await fetch('https://uvoorwkmosvuptjsnarv.supabase.co/functions/v1/send-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: clientEmail,
      factuurNummer: factuurNummer,
      pdfUrl: `https://JOUW_SUPABASE_URL/storage/v1/object/public/${fileName}`
    })
  });

  alert('Factuur aangemaakt & verzonden!');
  loadInvoices();
}

// Facturen laden
async function loadInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('factuur_nummer, totaal_bedrag, client_id')
    .order('created_at', { ascending: false });

  const list = document.getElementById('invoiceList');
  list.innerHTML = '';
  if(data) {
    for(const inv of data){
      const client = await supabase.from('clients').select('bedrijf_naam').eq('id', inv.client_id).single();
      const li = document.createElement('li');
      li.textContent = `${inv.factuur_nummer} - ${client.data.bedrijf_naam} - €${inv.totaal_bedrag}`;
      list.appendChild(li);
    }
  }
}
