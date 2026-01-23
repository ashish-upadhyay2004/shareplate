import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'pickup_reminder' | 'donation_completed';
  to_email: string;
  to_name: string;
  listing_title?: string;
  donor_name?: string;
  ngo_name?: string;
  pickup_time?: string;
  message?: string;
}

const getEmailContent = (request: EmailRequest) => {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  switch (request.type) {
    case 'request_received':
      return {
        subject: `New donation request for "${request.listing_title}"`,
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #16a34a;">New Donation Request!</h1>
            <p>Hello ${request.to_name},</p>
            <p><strong>${request.ngo_name}</strong> has requested your donation: <strong>${request.listing_title}</strong></p>
            ${request.message ? `<p>Message: "${request.message}"</p>` : ''}
            <p>Log in to SharePlate to review and respond to this request.</p>
            <p>Thank you for sharing food!</p>
          </div>
        `,
      };

    case 'request_accepted':
      return {
        subject: `Your donation request has been accepted!`,
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #16a34a;">Request Accepted!</h1>
            <p>Hello ${request.to_name},</p>
            <p>Great news! <strong>${request.donor_name}</strong> has accepted your request for: <strong>${request.listing_title}</strong></p>
            ${request.pickup_time ? `<p>Pickup Time: <strong>${request.pickup_time}</strong></p>` : ''}
            <p>Please coordinate with the donor for pickup details.</p>
          </div>
        `,
      };

    case 'request_rejected':
      return {
        subject: `Update on your donation request`,
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #dc2626;">Request Update</h1>
            <p>Hello ${request.to_name},</p>
            <p>Unfortunately, your request for <strong>${request.listing_title}</strong> could not be fulfilled.</p>
            <p>Don't worry! There are many other donations available. Check SharePlate for more opportunities.</p>
          </div>
        `,
      };

    case 'pickup_reminder':
      return {
        subject: `Pickup reminder for "${request.listing_title}"`,
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #f59e0b;">Pickup Reminder</h1>
            <p>Hello ${request.to_name},</p>
            <p>This is a reminder about your upcoming pickup:</p>
            <p><strong>${request.listing_title}</strong></p>
            ${request.pickup_time ? `<p>Scheduled Time: <strong>${request.pickup_time}</strong></p>` : ''}
            <p>Please ensure you arrive on time!</p>
          </div>
        `,
      };

    case 'donation_completed':
      return {
        subject: `Donation completed - Thank you!`,
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #16a34a;">Donation Completed!</h1>
            <p>Hello ${request.to_name},</p>
            <p>The donation of <strong>${request.listing_title}</strong> has been successfully completed.</p>
            <p>Thank you for being part of the solution to reduce food waste!</p>
            <p>We'd love to hear your feedback about this experience.</p>
          </div>
        `,
      };

    default:
      return {
        subject: 'SharePlate Notification',
        html: `<p>${request.message || 'You have a new notification from SharePlate.'}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    const { subject, html } = getEmailContent(emailRequest);

    // Use Resend REST API directly instead of npm package
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SharePlate <notifications@resend.dev>",
        to: [emailRequest.to_email],
        subject,
        html,
      }),
    });

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: response.ok ? 200 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
