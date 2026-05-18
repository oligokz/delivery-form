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
  <div style="background-color: #f4f7f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e1e8ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 4px solid #005A9E;">
        <img src="https://your-vercel-app-url.vercel.app/logo.png" style="height: 60px; margin-bottom: 10px;" />
        <h2 style="color: #333; margin: 0; font-size: 20px; letter-spacing: 1px;">DELIVERY NOTIFICATION</h2>
      </div>

      <div style="padding: 30px;">
        <p style="color: #666; font-size: 14px; margin-bottom: 25px;">A new shipment has been checked into the warehouse. Details below:</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; width: 40%;">PO / Job #</td>
            <td style="padding: 10px 0; color: #333; font-weight: 600;">${po}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase;">Company</td>
            <td style="padding: 10px 0; color: #333; font-weight: 600;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase;">Logistics</td>
            <td style="padding: 10px 0; color: #333;">${deliveringCompany}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase;">Items</td>
            <td style="padding: 10px 0; color: #333; line-height: 1.5;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase;">Received By</td>
            <td style="padding: 10px 0; color: #333;">${receivedBy}</td>
          </tr>
        </table>

        <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px dashed #ddd; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #777;">Photos are attached to this email as <strong>JPG</strong> files.</p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; background-color: #f4f7f9;">
        <p style="margin: 0; font-size: 11px; color: #aaa;">Internal Warehouse System • Trisome Valves & Actuators</p>
      </div>

    </div>
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
