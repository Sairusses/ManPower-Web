// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://fandr.site";

// Get Supabase URL and keys from environment
// These are automatically available in Supabase Edge Functions
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateProposalAcceptanceEmail(data: any) {
  const {
    applicantName,
    jobTitle,
    jobDescription,
    proposedRate,
    estimatedDuration,
    coverLetter,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal Accepted - F and R</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%; padding: 20px; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Main Email Content Wrapper -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin: 0 0 12px 0;">
                                🎉 Congratulations!
                            </h1>
                            <p style="color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; text-align: center; margin: 0 0 30px 0;">
                                Your proposal has been accepted
                            </p>
                            
                            <!-- Main Content -->
                            <p style="color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hello ${applicantName || "Applicant"},
                            </p>
                            
                            <p style="color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Great news! Your proposal for the position <strong>"${jobTitle}"</strong> has been accepted by the admin.
                            </p>
                            
                            <!-- Job Details Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h2 style="color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 15px 0;">
                                            Job Details
                                        </h2>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Job Title:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${jobTitle}</td>
                                            </tr>
                                            ${
                                              jobDescription
                                                ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Description:</td>
                                                <td style="padding: 8px 0; color: #374151; font-size: 14px; line-height: 1.6;">${jobDescription}</td>
                                            </tr>
                                            `
                                                : ""
                                            }
                                            ${
                                              proposedRate
                                                ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Proposed Rate:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">₱${proposedRate.toFixed(2)}/hour</td>
                                            </tr>
                                            `
                                                : ""
                                            }
                                            ${
                                              estimatedDuration
                                                ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estimated Duration:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${estimatedDuration}</td>
                                            </tr>
                                            `
                                                : ""
                                            }
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            ${
                              coverLetter
                                ? `
                            <!-- Cover Letter Section -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 15px; margin: 20px 0;">
                                <p style="color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
                                    Your Cover Letter:
                                </p>
                                <p style="color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                                    ${coverLetter}
                                </p>
                            </div>
                            `
                                : ""
                            }
                            
                            <p style="color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                A contract has been created for this position. You can now start working on the project. Please log in to your account to view the contract details and communicate with the admin.
                            </p>
                            
                            <!-- Call to Action Button -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto; background-color: #3b82f6; border-radius: 6px;">
                                <tr>
                                    <td align="center" height="45" style="padding: 0 30px;">
                                        <a href="${SITE_URL}/applicant/contracts" target="_blank" style="text-decoration: none; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; display: block; line-height: 45px;">
                                            View Contract Details
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                If you have any questions, please don't hesitate to reach out through the messaging system in your dashboard.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                            <p style="color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; text-align: center; margin: 0 0 10px 0;">
                                Best regards,<br>
                                <strong>F and R: Job Specialists Inc.</strong>
                            </p>
                            <p style="color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                                © 2024 F and R: Job Specialists Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                <!-- End Main Email Content Wrapper -->
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Verify environment variables are set
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Supabase environment variables are not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Create Supabase client with user's token to verify authentication
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create admin client with service role to check user role (if available)
    let supabaseAdmin: ReturnType<typeof createClient> | null = null;

    if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Verify user is an admin
    // First check user_metadata (from signup)
    const userRoleFromMetadata = user.user_metadata?.role;

    let isAdmin = false;

    if (userRoleFromMetadata === "admin") {
      isAdmin = true;
    } else if (supabaseAdmin) {
      // Check users table if service role key is available
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userError && userData?.role === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Only admins can send proposal acceptance emails",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Parse request body after authentication
    const proposalData = await req.json();

    // Validate required fields
    if (!proposalData.applicantEmail || !proposalData.jobTitle) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: applicantEmail and jobTitle are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY is not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Generate email HTML
    const html = generateProposalAcceptanceEmail({
      applicantName: proposalData.applicantName || "Applicant",
      jobTitle: proposalData.jobTitle,
      jobDescription: proposalData.jobDescription,
      proposedRate: proposalData.proposedRate,
      estimatedDuration: proposalData.estimatedDuration,
      coverLetter: proposalData.coverLetter,
    });

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "F and R <noreply@yourdomain.com>",
        to: proposalData.applicantEmail,
        subject: `🎉 Your Proposal for "${proposalData.jobTitle}" Has Been Accepted!`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: data,
        }),
        {
          status: res.status,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
