// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer@6.9.1"

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
const SMTP_USER = Deno.env.get('SMTP_USER') || "noreplay.gkk26@gmail.com";
const SMTP_PASS = (Deno.env.get('SMTP_PASS') || "yutfmttgqvligqsm").trim().replace(/\s+/g, "");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, hold_id } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error("Missing payment details")
        }

        // Verify signature using Web Crypto API
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(RAZORPAY_KEY_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
        );
        
        // Convert ArrayBuffer to Hex string
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const generatedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (generatedSignature !== razorpay_signature) {
            throw new Error("Invalid signature")
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Update the order in the database
        const { data: orderData, error: updateError } = await supabaseAdmin
            .from('merchandise_orders')
            .update({
                status: 'completed',
                razorpay_payment_id,
                razorpay_signature,
                completed_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', razorpay_order_id)
            .select()
            .single()

        if (updateError || !orderData) {
            console.error('Database Update Error:', updateError);
            throw new Error('Failed to update order status')
        }

        let productName = 'GKK Merchandise';

        // Use RPC to finalize purchase (decrement stock and drop hold)
        if (orderData.product_id) {
            const { data: product } = await supabaseAdmin
                .from('merchandise_products')
                .select('name')
                .eq('id', orderData.product_id)
                .single();
                
            if (product) {
                productName = product.name;
                
                // Finalize the hold and deduct stock safely
                await supabaseAdmin.rpc('finalize_merchandise_purchase', {
                    p_hold_id: hold_id || null,
                    p_product_id: orderData.product_id
                });
                
                // Clear the main store cache so the public page shows updated stock immediately
                try {
                    await supabaseAdmin.functions.invoke('get-merchandise-products', {
                        method: 'POST',
                        body: { clear_cache: true }
                    });
                } catch (cacheErr) {
                    console.error('Failed to clear merchandise cache:', cacheErr);
                }
            }
        }

        // Send Order Confirmation Email
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // Use STARTTLS
                auth: {
                    user: Deno.env.get('SMTP_USER') || 'noreplay.gkk26@gmail.com',
                    pass: Deno.env.get('SMTP_PASS') || 'yutfmttgqvligqsm', 
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                }
            });

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9;">Thank you for your purchase.</p>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #374151;">Hi ${orderData.user_name || 'Customer'},</p>
                        <p style="font-size: 16px; color: #374151;">We've received your order and are currently processing it. Below is your invoice and order summary.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #111827; border-bottom: 1px solid #d1d5db; padding-bottom: 10px;">Invoice / Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #4b5563;"><strong>Order ID:</strong></td>
                                    <td style="padding: 8px 0; text-align: right; color: #111827;">${orderData.razorpay_order_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4b5563;"><strong>Product:</strong></td>
                                    <td style="padding: 8px 0; text-align: right; color: #111827;">${productName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4b5563;"><strong>Amount Paid:</strong></td>
                                    <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: bold;">₹${orderData.amount}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top: 20px;">
                            <h4 style="margin-bottom: 10px; color: #111827;">Delivery Address:</h4>
                            <p style="margin: 0; color: #4b5563; line-height: 1.5;">
                                ${orderData.delivery_address}<br>
                                ${orderData.city}, ${orderData.state} ${orderData.zip_code}
                            </p>
                        </div>

                        <div style="margin-top: 30px; text-align: center;">
                            <p style="color: #4b5563; font-size: 14px; margin-bottom: 15px;">You can track your order status on our website using your Order ID and Email.</p>
                            <a href="https://gkkintern.in/merchandise" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-weight: bold;">Track Order</a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} GKK Intern Team. All rights reserved.</p>
                    </div>
                </div>
            `;

            await transporter.sendMail({
                from: '"GKK INTERN TEAM" <noreplay.gkk26@gmail.com>',
                to: orderData.user_email,
                subject: `Order Confirmation - ${orderData.razorpay_order_id}`,
                html: emailHtml,
            });
            console.log("Confirmation email sent to:", orderData.user_email);
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // We don't throw here because payment was successful, we just log the email failure.
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Verify Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
