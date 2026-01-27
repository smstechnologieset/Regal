import { NextRequest, NextResponse } from 'next/server';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const SYSTEM_PROMPT = `
You are REGAL Assistant, a helpful AI guide for the REGAL website. 
REGAL provides fashion (Attire), Event Planning, Catering, and Bridal services.

RULES:
- Short responses (1-2 sentences).
- Only REGAL topics.
- Direct links: Label.

LINKS:
- Home: /
- Shopping: /attire
- Events: /events
- Catering: /catering/menu
- Bridal: /bridal/gowns
- Account: /account
- Contact: /contact
- About: /about
- Forgot Password: /forgot-password
- Login: /login
- Register: /register
- Privacy Policy: /privacy-policy
- Terms of Service: /terms-of-service
- FAQ: /faq
- Gowns: /bridal/gowns

`;

export async function POST(req: NextRequest) {
    if (!HF_TOKEN) {
        console.error('[AI Assistant] HF_TOKEN is missing');
        return NextResponse.json({ error: 'AI Service configuration missing' }, { status: 500 });
    }

    try {
        const { message, history } = await req.json();

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).slice(-4),
            { role: 'user', content: message }
        ];

        console.log('[AI Assistant] Calling HF Router endpoint...');

        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'meta-llama/Llama-3.1-8B-Instruct',
                messages: messages,
                max_tokens: 200,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Assistant] HF API Error:', response.status, errorText);
            throw new Error(`HF API failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        const reply = data.choices?.[0]?.message?.content || '';

        // Extract links from markdown [Label](/path)
        const links: { label: string; url: string }[] = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkRegex.exec(reply)) !== null) {
            links.push({ label: match[1], url: match[2] });
        }

        return NextResponse.json({ reply, links });
    } catch (error: any) {
        console.error('AI Route Error:', error);
        return NextResponse.json({
            reply: `I'm having a little trouble connecting to my brain right now. Please try again or visit our [Contact Page](/contact).`,
            links: [{ label: 'Contact Us', url: '/contact' }]
        }, { status: 500 });
    }
}



