export const prerender = false;

import nodemailer from 'nodemailer';

export async function POST({ request }) {
    console.log('Richiesta ricevuta!');
    try {   
        console.log('Invio email...');
        
        const { email, subject, text, plainHtml } = await request.json();

        const smtpPort = parseInt(import.meta.env.SMTP_PORT);
        
        //465 for SSL, 587 for TLS

        /* console.log('SMTP_HOST:', import.meta.env.SMTP_HOST);
        console.log('SMTP_PORT:', smtpPort);        
        console.log('SMTP_USER:', import.meta.env.SMTP_USER);
        console.log('SMTP_PASS:', import.meta.env.SMTP_PASS); */
        
        let transporter = nodemailer.createTransport({
            host: import.meta.env.SMTP_HOST,
            port: smtpPort,
            secure: false,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: import.meta.env.SMTP_USER,
                pass: import.meta.env.SMTP_PASS,
            }
        });

        transporter.verify(function(error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log('Server is ready to take our messages - ', success);
            }
        });

        //console.log('Trasportatore:', transporter);

        if (!transporter) {
            throw new Error('Errore durante la creazione del trasportatore!');
        }

        const mailOptions = {
            from: '"Visit Cesenatico" <'+ import.meta.env.DEFAULT_FROM_EMAIL+'>',
            to: email,
            subject: subject,
            text: text,
            html: plainHtml,
            bcc: ['assistenzaweb@happyminds.it'],
        };

        const info = await transporter.sendMail(mailOptions);

        return new Response(
            JSON.stringify({ message: 'Email inviata con successo!', info }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            console.log('Email inviata con successo!')
        );
    } catch (error) {
        
        console.error("Errore durante l'invio dell'email:", error); // Log the full error object
        
        let errorMessage = "Errore durante l'invio dell'email";
        if (error.response) {
            errorMessage += `: ${error.response.body}`; // Include server response if available
        } else if (error.message) {
            errorMessage += `: ${error.message}`; // Include error message if available
        }
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
}

export async function GET() {
    return new Response(
        JSON.stringify({ message: 'Ciao dalle API di Astro!' }),
        { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        }
    );
}