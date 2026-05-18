import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // 1. Extract the text data from your form
    const po = formData.get('poNumber') || 'N/A';
    const company = formData.get('company') || 'N/A';
    const deliveringCompany = formData.get('deliveringCompany') || 'N/A';
    const description = formData.get('description') || 'None provided';
    const receivedBy = formData.get('receivedBy') || 'N/A';
    const submissionDate = formData.get('submissionDate') || 'N/A';

    // 2. Extract the photo files
    const orderFile = formData.get('orderPhoto') as File | null;
    const itemsFile = formData.get('itemsPhoto') as File | null;

    // 3. Get the Authentication Token from Microsoft
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing Microsoft credentials in Vercel settings.");
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    if (!token) {
      throw new Error("Failed to authenticate with Microsoft.");
    }

    // 4. Convert the photos so they can be emailed
    const attachments = [];
    
    if (orderFile && orderFile.size > 0) {
      const buffer = Buffer.from(await orderFile.arrayBuffer());
      attachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": `DeliveryOrder_${orderFile.name}`,
        "contentBytes": buffer.toString('base64')
      });
    }

    if (itemsFile && itemsFile.size > 0) {
      const buffer = Buffer.from(await itemsFile.arrayBuffer());
      attachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": `ItemsPhoto_${itemsFile.name}`,
        "contentBytes": buffer.toString('base64')
      });
    }

    // --- STOP HERE AND EDIT THESE TWO EMAILS ---
    
    // A: Who is SENDING the email? (Must be an account in your M365 tenant)
    const senderEmail = "no-reply@trisome.com.sg"; 
    
    // B: Who is RECEIVING the email?
    const receiverEmail = "bernard.lim@outlook.sg";

    // --------------------------------------------

    // 5. Construct the Email Layout
    const emailPayload = {
      message: {
        subject: `🚚 New Delivery: ${po} from ${company}`,
        body: {
          contentType: "HTML",
          content: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #005A9E;">New Delivery Received</h2>
              <p><strong>Date:</strong> ${submissionDate}</p>
              <p><strong>PO / Job Number:</strong> ${po}</p>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Delivering Company:</strong> ${deliveringCompany}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Received By:</strong> ${receivedBy}</p>
              <hr/>
              <p><em>Photos of the delivery order and items are attached to this email.</em></p>
            </div>
          `
        },
        toRecipients: [
          { emailAddress: { address: receiverEmail } }
        ],
        attachments: attachments
      },
      saveToSentItems: "false" // Set to "true" if you want copies in the sender's Outbox
    };

    // 6. Send the Email via Graph API
    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sendMailResponse.ok) {
        const err = await sendMailResponse.json();
        console.error("Microsoft Graph Error:", err);
        throw new Error("Failed to send email");
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("System error:", error);
    return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
  }
}
