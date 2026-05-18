import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // 1. Collect Form Data
    const po = formData.get('poNumber') || 'N/A';
    const company = formData.get('company') || 'N/A';
    const deliveringCompany = formData.get('deliveringCompany') || 'N/A';
    const description = formData.get('description') || 'None provided';
    const receivedBy = formData.get('receivedBy') || 'N/A';
    const submissionDate = formData.get('submissionDate') || 'N/A';

    const orderFile = formData.get('orderPhoto') as File | null;
    const itemsFile = formData.get('itemsPhoto') as File | null;

    // 2. Microsoft Authentication
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    if (!token) throw new Error("Auth Failed: Check Vercel Env Variables");

    // 3. Process Attachments
    const attachments = [];
    if (orderFile && orderFile.size > 0) {
      const buffer = Buffer.from(await orderFile.arrayBuffer());
      attachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": `Order_${orderFile.name}.jpg`,
        "contentBytes": buffer.toString('base64')
      });
    }
    if (itemsFile && itemsFile.size > 0) {
      const buffer = Buffer.from(await itemsFile.arrayBuffer());
      attachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": `Items_${itemsFile.name}.jpg`,
        "contentBytes": buffer.toString('base64')
      });
    }

    // --- CONFIGURATION ---
    const senderEmail = "no-reply@trisome.com.sg"; 
    
    // ADD MORE EMAILS TO THIS LIST BELOW
    const receiverEmails = [
      "bernard.lim@outlook.sg",
      "daiseylim@trisome.com.sg",
      "zurieltan@trisome.com.sg",
      "cktay@trisome.com.sg",
      "benho@trisome.com.sg",
      "christan@trisome.com.sg",
      "judylow@trisome.com.sg",
      "rodolf@trisome.com.sg",// Add more emails here, separated by commas
    ];

    const logoUrl = "https://delivery.trisome.com.sg/logo.png";
    // ---------------------

    // 4. Build Email
    const emailPayload = {
      message: {
        subject: `🚚 Warehouse Intake: ${po} from ${company}`,
        body: {
          contentType: "HTML",
          content: `
            <div style="background-color: #f4f7f9; padding: 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e8ed;">
                <div style="padding: 20px; text-align: center; border-bottom: 4px solid #005A9E;">
                  <img src="${logoUrl}" style="height: 50px;" />
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #333; margin-top: 0;">Delivery Notification</h2>
                  <table style="width: 100%; font-size: 14px;">
                    <tr><td style="padding: 8px 0; color: #888; width: 40%;"><b>PO / JOB:</b></td><td>${po}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;"><b>COMPANY:</b></td><td>${company}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;"><b>LOGISTICS:</b></td><td>${deliveringCompany}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;"><b>DESCRIPTION:</b></td><td>${description}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;"><b>RECEIVED BY:</b></td><td>${receivedBy}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;"><b>DATE:</b></td><td>${submissionDate}</td></tr>
                  </table>
                </div>
                <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                  Photos are attached to this email.
                </div>
              </div>
            </div>
          `
        },
        // This line converts your list of emails into the format Microsoft Graph needs
        toRecipients: receiverEmails.map(email => ({
          emailAddress: { address: email.trim() }
        })),
        attachments: attachments
      },
      saveToSentItems: "false"
    };

    // 5. Send Email
    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload)
    });

    if (!sendMailResponse.ok) {
      const errorData = await sendMailResponse.json();
      console.error("Microsoft Graph Error:", JSON.stringify(errorData));
      throw new Error(`Graph API Error: ${errorData.error.message}`);
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
