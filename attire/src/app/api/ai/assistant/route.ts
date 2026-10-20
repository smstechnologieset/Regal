import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const SYSTEM_PROMPT = `
You are REGAL Assistant, a helpful AI guide for the REGAL website. 
REGAL restores dignity, health, and natural living through our curated pillars:
1. Pure Skincare & Body Care (/skincare) - raw botanicals, unrefined shea butter, chemical-free radiant skin oils
2. Grounded Childhood Toys (/toys) - modest linen heirloom dolls, wholesome montessori play
3. Mindful Journals & Reflection Tools (/journals) - linen-bound gratitude, prayer, and intentional life planners
4. Modest Attire (/attire) - elegant, modest, breathable natural textiles
5. Wholesome Catering (/catering/menu) - 100% additive-free gourmet food & dining
6. Curated Gifts (/gifts) - thoughtful gift packages

NOTE ABOUT BRIDAL & EVENT PLANNING:
Bridal Services and Event Planning are currently pausing new bookings as we curate new offerings. If a visitor asks about them, politely let them know that these services are currently curating new collections, and encourage them to explore our active collections above.

RULES:
- Short responses (1-2 sentences).
- Only REGAL topics.
- IMPORTANT: Always format links as clickable markdown: [Label](URL)
- Never show raw URLs like /catering - always wrap them in markdown links
- Make link labels clear and actionable (e.g., "Explore Pure Skincare" instead of just "Skincare")

LINKS (use these in markdown format):
- Home: /
- Pure Skincare: /skincare
- Grounded Toys: /toys
- Mindful Journals: /journals
- Modest Attire: /attire
- Catering Menu: /catering/menu
- Catering Quote: /catering/quote
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
        if (q.includes('ቆዳ') || q.includes('ስኪንኬር') || q.includes('ቅባት') || q.includes('ክሬም') || q.includes('ሺያ')) {
            return {
                reply: 'የሬጋል ንጹህ የቆዳ እና የሰውነት እንክብካቤ ከተፈጥሯዊ ንጥረነገሮች የተዘጋጀ ከኬሚካል ነፃ እንክብካቤ ነው። [የቆዳ እንክብካቤ ስብስቦችን ይመልከቱ](/skincare)።',
                links: [
                    { label: 'የቆዳ እንክብካቤ ምርቶች', url: '/skincare' },
                ]
            };
        }
        if (q.includes('አሻንጉሊት') || q.includes('መጫወቻ') || q.includes('የልጆች') || q.includes('ቶይ')) {
            return {
                reply: 'የሬጋል የልጆች መጫወቻዎች እና ጨዋ አሻንጉሊቶች እውነተኛ የልጅነት ውበትን የሚያንጸባርቁ ናቸው። [የልጆች መጫወቻዎችን ይመልከቱ](/toys)።',
                links: [
                    { label: 'የልጆች መጫወቻዎች', url: '/toys' },
                ]
            };
        }
        if (q.includes('ማስታወሻ') || q.includes('ደብተር') || q.includes('ጆርናል') || q.includes('እቅድ')) {
            return {
                reply: 'የማስታወሻ ደብተሮቻችን እና የህይወት እቅድ ማስታወሻዎች ለዕለታዊ አስተውሎት የተዘጋጁ ናቸው። [ማስታወሻ ደብተሮችን ይመልከቱ](/journals)።',
                links: [
                    { label: 'ማስታወሻ ደብተሮች', url: '/journals' },
                ]
            };
        }
        if (q.includes('ልብስ') || q.includes('አልባሳት') || q.includes('ፋሽን') || q.includes('ቀሚስ')) {
            return {
                reply: 'ሬጋል ከተፈጥሯዊ ጨርቆች የተሰሩ ክላሲክ እና ጨዋነት ያላቸው አለባበሶችን ያቀርባል። [የአልባሳት ስብስቦችን ያስሱ](/attire)።',
                links: [
                    { label: 'አልባሳትን ያስሱ', url: '/attire' },
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
        if (q.includes('ስጦታ') || q.includes('ጥቅል') || q.includes('ጊፍት')) {
            return {
                reply: 'ለሚወዷቸው ሰዎች የተዘጋጁ የተመረጡ የስጦታ ጥቅሎችን እና ማስታወሻዎችን ያግኙ። [የስጦታ ጥቅሎችን ይመልከቱ](/gifts)።',
                links: [
                    { label: 'የስጦታ ጥቅሎች', url: '/gifts' },
                ]
            };
        }
        if (q.includes('ሰርግ') || q.includes('ሙሽራ') || q.includes('ዝግጅት') || q.includes('ኢቨንት')) {
            return {
                reply: 'የሰርግ እና የዝግጅት እቅድ አገልግሎቶቻችን አዳዲስ ስብስቦችን እያዘጋጁ በመሆናቸው ለጊዜው አዲስ ትዕዛዝ አቁመዋል። ሌሎች ንቁ ስብስቦቻችንን መመልከት ይችላሉ፡ [የቆዳ እንክብካቤ](/skincare)፣ [አልባሳት](/attire)፣ [መጫወቻዎች](/toys) እና [ምግብ ዝግጅት](/catering/menu)።',
                links: [
                    { label: 'የቆዳ እንክብካቤ', url: '/skincare' },
                    { label: 'አልባሳት', url: '/attire' },
                    { label: 'የምግብ ሜኑ', url: '/catering/menu' },
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
            reply: 'እንኳን ወደ ሬጋል ረዳት በደህና መጡ! በቆዳ እንክብካቤ፣ በልጆች መጫወቻዎች፣ በማስታወሻ ደብተሮች፣ በአልባሳት፣ በምግብ ዝግጅት እና በስጦታዎች ዙሪያ ላግዝዎት እችላለሁ። [ስለ ሬጋል የበለጠ ያንብቡ](/about)።',
            links: [
                { label: 'የቆዳ እንክብካቤ', url: '/skincare' },
                { label: 'አልባሳት', url: '/attire' },
                { label: 'የልጆች መጫወቻዎች', url: '/toys' },
                { label: 'ማስታወሻ ደብተሮች', url: '/journals' },
            ]
        };
    }

    // English Intent Matching
    if (q.includes('skin') || q.includes('skincare') || q.includes('shea') || q.includes('oil') || q.includes('butter') || q.includes('cream') || q.includes('balm') || q.includes('body care')) {
        return {
            reply: 'Regal Pure Skincare is formulated with raw unrefined botanicals and clean ingredients safe for sensitive skin and families. [Explore Pure Skincare](/skincare).',
            links: [
                { label: 'Pure Skincare', url: '/skincare' },
            ]
        };
    }

    if (q.includes('toy') || q.includes('doll') || q.includes('toys') || q.includes('dolls') || q.includes('childhood') || q.includes('montessori')) {
        return {
            reply: 'Our Grounded Childhood Toys feature modest heirloom dolls and natural wooden Montessori play sets preserving the innocence of childhood. [Browse Grounded Toys](/toys).',
            links: [
                { label: 'Grounded Toys', url: '/toys' },
            ]
        };
    }

    if (q.includes('journal') || q.includes('journals') || q.includes('reflection') || q.includes('notebook') || q.includes('planner') || q.includes('mindful')) {
        return {
            reply: 'Discover our linen-bound Mindful Journals, gratitude logs, and guided reflection tools for intentional daily living. [Explore Mindful Journals](/journals).',
            links: [
                { label: 'Mindful Journals', url: '/journals' },
            ]
        };
    }

    if (q.includes('attire') || q.includes('cloth') || q.includes('wear') || q.includes('modest') || q.includes('skirt') || q.includes('shirt') || q.includes('dress')) {
        return {
            reply: 'Regal Attire features dignified, full-coverage silhouettes crafted with breathable natural textiles. [Explore Attire Collection](/attire) or [Check Size Guide](/size-guide).',
            links: [
                { label: 'Shop Attire', url: '/attire' },
                { label: 'Size Guide', url: '/size-guide' },
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

    if (q.includes('bridal') || q.includes('wedding') || q.includes('event') || q.includes('party')) {
        return {
            reply: 'Our Bridal and Event Planning services are currently pausing new bookings as we curate new offerings. We warmly invite you to explore our active collections: [Pure Skincare](/skincare), [Grounded Toys](/toys), [Mindful Journals](/journals), [Modest Attire](/attire), and [Wholesome Catering](/catering/menu).',
            links: [
                { label: 'Pure Skincare', url: '/skincare' },
                { label: 'Grounded Toys', url: '/toys' },
                { label: 'Mindful Journals', url: '/journals' },
                { label: 'Modest Attire', url: '/attire' },
            ]
        };
    }

    if (q.includes('gift') || q.includes('package') || q.includes('hamper') || q.includes('present')) {
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
            reply: 'Regal is dedicated to restoring dignity, health, and natural living through uncompromised apparel, additive-free food, pure skincare, grounded toys, and guided journals. [Read Our Story](/about).',
            links: [
                { label: 'Our Story', url: '/about' },
                { label: 'Contact Us', url: '/contact' },
            ]
        };
    }

    // Default polite introduction with active services
    return {
        reply: 'Welcome to Regal! I can guide you through our Pure Skincare, Grounded Childhood Toys, Mindful Journals, Modest Attire, Wholesome Catering, and Curated Gifts. How can I assist you today? [Explore All Collections](/).',
        links: [
            { label: 'Pure Skincare', url: '/skincare' },
            { label: 'Grounded Toys', url: '/toys' },
            { label: 'Mindful Journals', url: '/journals' },
            { label: 'Modest Attire', url: '/attire' },
            { label: 'Catering', url: '/catering/menu' },
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
