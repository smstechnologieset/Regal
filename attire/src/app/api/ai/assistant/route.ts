import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const SYSTEM_PROMPT = `
You are REGAL Assistant, a helpful AI guide for the REGAL website. 
REGAL provides Modest Attire, Event Planning, Wholesome Catering, Bridal Services, and Curated Gifts.

RULES:
- Short responses (1-2 sentences).
- Only REGAL topics.
- IMPORTANT: Always format links as clickable markdown: [Label](URL)
- Never show raw URLs like /catering - always wrap them in markdown links
- Make link labels clear and actionable (e.g., "View Catering Menu" instead of just "Menu")

LINKS (use these in markdown format):
- Home: /
- Shopping Attire: /attire
- Event Planning: /events
- Custom Events: /events/custom
- Catering Menu: /catering/menu
- Catering Quote: /catering/quote
- Bridal Collection: /bridal/gallery
- Bridal Appointments: /bridal/appointments
- Bridal Accessories: /bridal/accessories
- Gift Packages: /gifts
- Our Story: /about
- Contact Us: /contact
- Account: /account
- Login: /login
- Size Guide: /size-guide
`;

// Smart bilingual fallback responder when external AI model is unavailable or unauthorized
function generateSmartFallback(input: string): { reply: string; links: { label: string; url: string }[] } {
    const q = input.toLowerCase().trim();

    // Amharic detection
    const isAmharic = /[\u1200-\u137F]/.test(input);

    if (isAmharic) {
        if (q.includes('ሰርግ') || q.includes('ቀሚስ') || q.includes('ሙሽራ')) {
            return {
                reply: 'የሬጋል የሰርግ ማዕከል የተመረጡ የሰርግ ቀሚሶችን፣ የልኬት ስራዎችን እና የውበት አገልግሎቶችን ያቀርባል። [የሰርግ ቀሚሶችን ይመልከቱ](/bridal/gallery) ወይም [የልኬት ቀጠሮ ይያዙ](/bridal/appointments)።',
                links: [
                    { label: 'የሰርግ ቀሚሶች', url: '/bridal/gallery' },
                    { label: 'ቀጠሮ ይያዙ', url: '/bridal/appointments' },
                ]
            };
        }
        if (q.includes('ምግብ') || q.includes('ኬተሪንግ') || q.includes('ድግስ')) {
            return {
                reply: 'ከተጨማሪ ኬሚካሎች ነፃ የሆነ ንጹህ እና ጤናማ የምግብ ዝግጅት አገልግሎት እናቀርባለን። [የምግብ ሜኑ ይመልከቱ](/catering/menu) ወይም [ዋጋ ይጠይቁ](/catering/quote)።',
                links: [
                    { label: 'የምግብ ሜኑ', url: '/catering/menu' },
                    { label: 'ዋጋ ይጠይቁ', url: '/catering/quote' },
                ]
            };
        }
        if (q.includes('ዝግጅት') || q.includes('ኢቨንት') || q.includes('በዓል')) {
            return {
                reply: 'ከቤተሰብ ስብሰባዎች እስከ ታላላቅ ክብረ በዓላት ድረስ የተሟላ የዝግጅት እቅድ እናዘጋጃለን። [የዝግጅት ጥቅሎችን ይመልከቱ](/events) ወይም [ብጁ ዝግጅት ያቅዱ](/events/custom)።',
                links: [
                    { label: 'የዝግጅት ጥቅሎች', url: '/events' },
                    { label: 'ብጁ ዝግጅት ማቀድ', url: '/events/custom' },
                ]
            };
        }
        if (q.includes('ልብስ') || q.includes('አልባሳት') || q.includes('ፋሽን')) {
            return {
                reply: 'ሬጋል ከተፈጥሯዊ ጨርቆች የተሰሩ ክላሲክ እና ጨዋነት ያላቸው አለባበሶችን ያቀርባል። [የአልባሳት ስብስቦችን ያስሱ](/attire)።',
                links: [
                    { label: 'አልባሳትን ያስሱ', url: '/attire' },
                ]
            };
        }
        if (q.includes('ስጦታ') || q.includes('ጥቅል') || q.includes('ጊፍት')) {
            return {
                reply: 'ለሚወዷቸው ሰዎች የተዘጋጁ የተመረጡ የስጦታ ጥቅሎችን እና ማስታወሻዎችን ያግኙ። [የስጦታ ጥቅሎችን ይመልከቱ](/gifts)።',
                links: [
                    { label: 'የስጦታ ጥቅሎች', url: '/gifts' },
                ]
            };
        }
        if (q.includes('ስልክ') || q.includes('አድራሻ') || q.includes('መገናኛ') || q.includes('ማን ናችሁ')) {
            return {
                reply: 'በቀጥታ በስልክ ቁጥር +251 912 345 678 ሊያገኙን ይችላሉ፣ ወይም [የመገናኛ ገጻችንን ይጎብኙ](/contact)።',
                links: [
                    { label: 'አግኙን', url: '/contact' },
                    { label: 'ስለ እኛ', url: '/about' },
                ]
            };
        }
        return {
            reply: 'እንኳን ወደ ሬጋል ረዳት በደህና መጡ! በአልባሳት፣ በሰርግ አገልግሎቶች፣ በዝግጅት እቅድ፣ በምግብ ዝግጅት እና በስጦታዎች ዙሪያ ላግዝዎት እችላለሁ። [ስለ ሬጋል የበለጠ ያንብቡ](/about)።',
            links: [
                { label: 'አልባሳት', url: '/attire' },
                { label: 'የሰርግ አገልግሎቶች', url: '/bridal' },
                { label: 'አግኙን', url: '/contact' },
            ]
        };
    }

    // English Intent Matching
    if (q.includes('bridal') || q.includes('wedding') || q.includes('gown') || q.includes('dress') || q.includes('bride')) {
        return {
            reply: 'Regal offers complete bridal solutions including luxury modest gowns for rent or purchase, fittings, beauty, and styling. [Browse Bridal Gowns](/bridal/gallery) or [Book an Appointment](/bridal/appointments).',
            links: [
                { label: 'Bridal Gowns', url: '/bridal/gallery' },
                { label: 'Book Appointment', url: '/bridal/appointments' },
                { label: 'Bridal Accessories', url: '/bridal/accessories' },
            ]
        };
    }

    if (q.includes('cater') || q.includes('food') || q.includes('menu') || q.includes('chef') || q.includes('meal')) {
        return {
            reply: 'Our catering offers wholesome, 100% additive-free dining experiences for all celebrations. [View Catering Menu](/catering/menu) or [Request a Quote](/catering/quote).',
            links: [
                { label: 'View Menu', url: '/catering/menu' },
                { label: 'Get a Quote', url: '/catering/quote' },
            ]
        };
    }

    if (q.includes('event') || q.includes('party') || q.includes('ceremony') || q.includes('celebrat') || q.includes('birthday')) {
        return {
            reply: 'From intimate family dinners to grand galas, we coordinate every detail of your special event. [Browse Event Packages](/events) or [Plan a Custom Event](/events/custom).',
            links: [
                { label: 'Event Packages', url: '/events' },
                { label: 'Custom Event Planning', url: '/events/custom' },
            ]
        };
    }

    if (q.includes('attire') || q.includes('cloth') || q.includes('wear') || q.includes('modest') || q.includes('skirt') || q.includes('shirt')) {
        return {
            reply: 'Regal Attire features dignified, full-coverage silhouettes crafted with breathable natural textiles. [Explore Attire Collection](/attire) or [Check Size Guide](/size-guide).',
            links: [
                { label: 'Shop Attire', url: '/attire' },
                { label: 'Size Guide', url: '/size-guide' },
            ]
        };
    }

    if (q.includes('gift') || q.includes('package') || q.includes('hamper') || q.includes('present') || q.includes('toy') || q.includes('journal')) {
        return {
            reply: 'Explore our thoughtfully curated gift packages, grounded realistic dolls, and reflective guided journals. [Browse Gift Packages](/gifts).',
            links: [
                { label: 'Gift Packages', url: '/gifts' },
            ]
        };
    }

    if (q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('email') || q.includes('number') || q.includes('help')) {
        return {
            reply: 'You can speak directly with our team at +251 912 345 678, or send an inquiry through our [Contact Page](/contact).',
            links: [
                { label: 'Contact Us', url: '/contact' },
            ]
        };
    }

    if (q.includes('order') || q.includes('account') || q.includes('login') || q.includes('sign in') || q.includes('track')) {
        return {
            reply: 'You can check your orders, profile details, and preferences in your account: [My Account](/account) or [Login](/login).',
            links: [
                { label: 'My Account', url: '/account' },
                { label: 'Sign In', url: '/login' },
            ]
        };
    }

    if (q.includes('about') || q.includes('story') || q.includes('purity') || q.includes('who are you') || q.includes('what is regal')) {
        return {
            reply: 'Regal is dedicated to restoring dignity, health, and natural living through uncompromised apparel, additive-free food, and pure essentials. [Read Our Story](/about).',
            links: [
                { label: 'Our Story', url: '/about' },
                { label: 'Contact Us', url: '/contact' },
            ]
        };
    }

    // Default polite introduction
    return {
        reply: 'Welcome to Regal! I can guide you through our Modest Attire, Event Planning, Wholesome Catering, Bridal Services, and Curated Gifts. How can I assist you today? [Explore All Services](/).',
        links: [
            { label: 'Attire Store', url: '/attire' },
            { label: 'Bridal Services', url: '/bridal' },
            { label: 'Event Planning', url: '/events' },
            { label: 'Catering', url: '/catering' },
            { label: 'Gift Packages', url: '/gifts' },
        ]
    };
}

export async function POST(req: NextRequest) {
    const limited = enforceRateLimit(req, 'ai-assistant', 25, 60_000);
    if (limited) return limited;

    try {
        const { message, history } = await req.json();

        if (typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'A message is required' }, { status: 400 });
        }

        let reply = '';
        let links: { label: string; url: string }[] = [];

        // If HF_TOKEN exists, attempt remote inference
        if (HF_TOKEN) {
            try {
                const safeHistory = (Array.isArray(history) ? history : [])
                    .filter(
                        (m: any) =>
                            m &&
                            (m.role === 'user' || m.role === 'assistant') &&
                            typeof m.content === 'string'
                    )
                    .slice(-4)
                    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }));

                const messages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...safeHistory,
                    { role: 'user', content: message.slice(0, 2000) }
                ];

                const candidateModels = [
                    'meta-llama/Llama-3.1-8B-Instruct',
                    'Qwen/Qwen2.5-7B-Instruct',
                    'mistralai/Mistral-7B-Instruct-v0.3'
                ];

                for (const model of candidateModels) {
                    try {
                        const response = await fetch(HF_API_URL, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${HF_TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model,
                                messages,
                                max_tokens: 200,
                                temperature: 0.7,
                            }),
                            signal: AbortSignal.timeout(4000), // 4s timeout to avoid hanging
                        });

                        if (response.ok) {
                            const data = await response.json();
                            reply = data.choices?.[0]?.message?.content || '';
                            if (reply) break;
                        }
                    } catch {
                        // Continue to next candidate or fallback
                    }
                }
            } catch {
                // Remote inference failed; fall back to local knowledge engine
            }
        }

        // If remote inference did not produce a reply, use the smart local knowledge engine
        if (!reply) {
            const fallback = generateSmartFallback(message);
            reply = fallback.reply;
            links = fallback.links;
        } else {
            // Extract links from markdown [Label](/path)
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let match;
            while ((match = linkRegex.exec(reply)) !== null) {
                links.push({ label: match[1], url: match[2] });
            }
        }

        return NextResponse.json({ reply, links });
    } catch (error: any) {
        console.error('AI Route Fallback Active:', error?.message);
        // Resilient fallback - NEVER return 500 error!
        const fallback = generateSmartFallback('help');
        return NextResponse.json(fallback);
    }
}
