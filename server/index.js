import express from 'express';
import cors from 'cors';
import { PlaywrightCrawler, SessionPool } from 'crawlee';
import axios from 'axios';
import RSSParser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const parser = new RSSParser();
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3001;
const OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'deepseek-r1:8b';
// const DEFAULT_MODEL = 'qwen3:8b';
const CACHE_FILE = path.join(__dirname, 'idea_cache.json');
const MEGA_PROMPTS_DIR = path.join(__dirname, 'mega_prompts');
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

// Web scraping targets for additional trend data
const SCRAPING_TARGETS = [
    { name: 'Hacker News', url: 'https://news.ycombinator.com', selector: '.titleline > a' },
    { name: 'Product Hunt', url: 'https://www.producthunt.com', selector: '[data-test="post-name"]' },
    { name: 'GitHub Trending', url: 'https://github.com/trending', selector: 'h2 a' }
];


const FEEDS = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' }
];

// Helper functions for prompt storage
function ensureMegaPromptsDir() {
    if (!fs.existsSync(MEGA_PROMPTS_DIR)) {
        fs.mkdirSync(MEGA_PROMPTS_DIR, { recursive: true });
    }
}

// Web scraping function with built-in caching and protection
async function scrapeTrendingTopics() {
    const headlines = [];
    
    // Create session pool for human-like behavior
    const sessionPool = new SessionPool({
        maxPoolSize: 5,
        sessionOptions: {
            maxUsageCount: 3, // Rotate sessions after 3 uses
            sessionPoolOptions: {
                persistStateKeyValueStoreId: 'scraping-sessions',
            },
        },
    });

    // Configure crawler with built-in protections
    const crawler = new PlaywrightCrawler({
        headless: true,
        maxRequestRetries: 2,
        requestHandlerTimeoutSecs: 30,
        navigationTimeoutSecs: 30,
        maxRequestsPerCrawl: SCRAPING_TARGETS.length,
        launchContext: {
            launchOptions: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        },
        preNavigationHooks: [
            async ({ request, session }) => {
                // Rotate user agents
                const userAgents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ];
                request.headers = {
                    ...request.headers,
                    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                };
            },
        ],
        requestHandler: async ({ request, page, sendRequest, log }) => {
            const target = SCRAPING_TARGETS.find(t => t.url === request.url);
            if (!target) return;

            try {
                log.info(`Scraping ${target.name}...`);
                
                // Wait for content to load
                await page.waitForLoadState('domcontentloaded');
                
                // Extract headlines
                const elements = await page.locator(target.selector).all();
                const texts = await Promise.all(
                    elements.slice(0, 5).map(el => el.textContent())
                );
                
                const headlinesFromSite = texts
                    .filter(text => text && text.trim().length > 0)
                    .map(text => `[${target.name}] ${text.trim()}`);
                
                headlines.push(...headlinesFromSite);
                log.info(`Found ${headlinesFromSite.length} headlines from ${target.name}`);
                
                // Add delay between requests to be respectful
                await page.waitForTimeout(Math.random() * 2000 + 1000); // 1-3 second random delay
                
            } catch (error) {
                log.error(`Error scraping ${target.name}: ${error.message}`);
            }
        },
    });

    // Add targets to crawler
    await crawler.addRequests(SCRAPING_TARGETS.map(t => t.url));
    
    // Run crawler
    await crawler.run();
    
    return headlines;
}

async function generateIdeasFromTrends(trends, featuresPerIdea = 4) {
    if (trends.length === 0) return [];

    const prompt = `
    ### GENERATE IDEAS WITH AI MODE ###
    You are a visionary Product Architect. 
    
    RAW SIGNALS:
    ${trends.join('\n')}

    ### MISSION ###
    1. Study the RAW SIGNALS.
    2. Synthesize them into specific, high-concept software project ideas that are actionable, innovative, and market-ready. They should solve a problem or fill a gap in the market by creating value for the potential users by creatively solving their problems.
    3. Ideas should software focused either as web or desktop applications or digital services. Should not be a physical product. Do not rely upon non existing technology such as force fields. Nothing sci-fi.
    4. CRITICAL: NEVER use these forbidden words: "Product Name", "AI App", "Niche Implementation", "Creative Product", "Strategic Feature", "unique-slug", "s1", "s2".
    5. Provide unique, bold, original industry-specific names (e.g., "Vector Power", "Quant Flow", "Bio Nexus") and try to make them self explanatory.
    
    ### OUTPUT FORMAT (JSON ONLY) ###
    {
      "ideas": [
        {
          "id": "meaningful-slug-1", 
          "label": "BOLD PRODUCT NAME",
          "description": "Brief one-sentence description",
          "features": [
            {"id": "feature-slug-1", "label": "SPECIFIC HIGH-LEVEL FEATURE"},
            {"id": "feature-slug-2", "label": "SPECIFIC HIGH-LEVEL FEATURE"}
          ]
        }
      ]
    }

    Generate exactly ${featuresPerIdea} features per idea. Focus on quality - only include features that are essential and distinct. If ${featuresPerIdea} is too many for a simple idea, make the features more granular. If ${featuresPerIdea} is too few for a complex idea, make the features more comprehensive.    
    
    Response must be ONLY JSON. No preamble. NO PLACEHOLDERS.
    `;

    try {
        console.log(`Generating ideas with Ai now in progress using: ${DEFAULT_MODEL}...`);
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: DEFAULT_MODEL,
            prompt: prompt,
            stream: false,
            think: true,
            format: {
                type: 'object',
                properties: {
                    ideas: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                label: { type: 'string' },
                                description: { type: 'string' },
                                features: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            label: { type: 'string' }
                                        }
                                    }
                                }
                            },
                            required: ['id', 'label', 'description', 'features']
                        }
                    }
                },
                required: ['ideas']
            }
        }, {
            timeout: 120000, // 2 minute timeout
            maxContentLength: 50 * 1024 * 1024, // 50MB max response size
            maxBodyLength: 50 * 1024 * 1024 // 50MB max request size
        });

        if (response.data.thinking) {
            console.log('\x1b[36m%s\x1b[0m', '--- THINKING ---');
            console.log(response.data.thinking);
            console.log('\x1b[36m%s\x1b[0m', '-------------------------');
        }

        const parsed = JSON.parse(response.data.response);
        return Array.isArray(parsed.ideas) ? parsed.ideas : [];
    } catch (error) {
        console.error('Generating Ideas with Ai failed:', error.message);
        if (error.code === 'ECONNRESET') {
            console.error('Connection to Ollama was reset. The model might be overloaded or the request timed out.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Could not connect to Ollama. Is Ollama running?');
        }
        return [];
    }
}

app.get('/api/trends', async (req, res) => {
    // Extract featuresPerIdea from query params, default to 4
    const featuresPerIdea = parseInt(req.query.featuresPerIdea) || 4;
    
    // 0. Check Cache
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            const now = Date.now();
            if (now - cacheData.timestamp < CACHE_TTL && req.query.force !== 'true') {
                console.log('Serving ideas from cache...');
                return res.json({
                    ideas: cacheData.ideas,
                    trends: cacheData.trends || {
                        totalSignals: 0,
                        sources: [],
                        sampleHeadlines: []
                    }
                });
            }
        }
    } catch (e) {
        console.error('Cache read error:', e.message);
    }

    const headlines = [];

    // 1. Fetch RSS Feeds (Fast)
    console.log('Fetching RSS feeds...');
    for (const feed of FEEDS) {
        try {
            const data = await parser.parseURL(feed.url);
            const items = data.items.slice(0, 5).map(item => `[${feed.name}] ${item.title}`);
            headlines.push(...items);
        } catch (e) {
            console.error(`RSS Fail [${feed.name}]:`, e.message);
        }
    }

    // 2. Web scraping with built-in protection and caching
    console.log('Scraping trending topics with protection...');
    try {
        const scrapedHeadlines = await scrapeTrendingTopics();
        headlines.push(...scrapedHeadlines);
        console.log(`Successfully scraped ${scrapedHeadlines.length} additional headlines`);
    } catch (error) {
        console.error('Web scraping failed, falling back to RSS only:', error.message);
        console.log('Using RSS feeds only as fallback...');
    }

    console.log(`Gathered ${headlines.length} signals. Transmuting into ideas with ${featuresPerIdea} features per idea...`);
    
    try {
        const ideas = await generateIdeasFromTrends(headlines, featuresPerIdea);

        // 4. Save to Cache
        if (ideas.length > 0) {
            try {
                fs.writeFileSync(CACHE_FILE, JSON.stringify({
                    timestamp: Date.now(),
                    ideas: ideas,
                    trends: {
                        totalSignals: headlines.length,
                        sources: [
                            ...FEEDS.map(f => f.name),
                            ...SCRAPING_TARGETS.map(t => t.name)
                        ],
                        sampleHeadlines: headlines.slice(0, 10)
                    }
                }, null, 2));
                console.log('Results cached successfully.');
            } catch (e) {
                console.error('Cache write error:', e.message);
            }
        }

        res.json({
            ideas: ideas,
            trends: {
                totalSignals: headlines.length,
                sources: [
                    ...FEEDS.map(f => f.name),
                    ...SCRAPING_TARGETS.map(t => t.name)
                ],
                sampleHeadlines: headlines.slice(0, 10)
            }
        });
    } catch (error) {
        console.error('AI generation failed:', error);
        res.status(500).json({ error: 'Failed to generate ideas', details: error.message });
    }
});

// Save prompt endpoint
app.post('/api/prompts', (req, res) => {
    try {
        const { id, prompt, selections, selectedModel, timestamp } = req.body;
        
        if (!id || !prompt) {
            return res.status(400).json({ error: 'Missing required fields: id, prompt' });
        }

        // Ensure the mega prompts directory exists
        ensureMegaPromptsDir();

        // Create the prompt data object
        const promptData = {
            id,
            prompt,
            selections: selections || [],
            selectedModel: selectedModel || DEFAULT_MODEL,
            timestamp: timestamp || new Date().toISOString()
        };

        // Save to individual file with ID appended
        const fileName = `megaPrompt-${id}.json`;
        const filePath = path.join(MEGA_PROMPTS_DIR, fileName);
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(promptData, null, 2));
            console.log(`Saved mega prompt to file: ${fileName}`);
            res.json({ success: true, id, fileName });
        } catch (error) {
            console.error('Failed to save mega prompt file:', error.message);
            res.status(500).json({ error: 'Failed to save mega prompt file' });
        }
    } catch (error) {
        console.error('Error saving prompt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get prompt endpoint
app.get('/api/prompts/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Read from individual mega prompt file
        const fileName = `megaPrompt-${id}.json`;
        const filePath = path.join(MEGA_PROMPTS_DIR, fileName);
        
        if (fs.existsSync(filePath)) {
            try {
                const promptData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                console.log(`Retrieved mega prompt from file: ${fileName}`);
                res.json(promptData);
            } catch (error) {
                console.error('Error reading mega prompt file:', error.message);
                res.status(500).json({ error: 'Error reading prompt file' });
            }
        } else {
            res.status(404).json({ error: 'Prompt not found' });
        }
    } catch (error) {
        console.error('Error retrieving prompt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// AI-powered tech stack selection endpoint
app.post('/api/auto-select-stack', async (req, res) => {
    try {
        const { selections } = req.body;
        
        if (!selections || !Array.isArray(selections)) {
            return res.status(400).json({ error: 'Selections array is required' });
        }

        // Create a summary of user's current selections
        const userGoals = selections.map(s => `${s.category}: ${s.label}`).join('\n');
        
        const prompt = `
        You are a senior software architect and tech stack expert. Analyze the user's project goals and recommend the optimal tech stack.

        USER'S CURRENT SELECTIONS:
        ${userGoals}

        Your task:
        1. Analyze the user's project requirements and goals
        2. Recommend the best tech stack from the available options
        3. Consider scalability, performance, development experience, and project type
        4. Return ONLY a JSON array of recommended selections

        AVAILABLE OPTIONS TO CHOOSE FROM:
        - Platform: web, mobile, game, desktop, tool
        - Frontend: react, nextjs, vue, svelte, solid, astro, typescript
        - Backend: node, hono, nest, python_fastapi, go_chi, trpc, graphql
        - Database: supabase, firebase, postgresql, mongodb, mysql, redis
        - UI: tailwind, shadcn, chakra, radix, framer, lucide
        - AI/ML: openai, anthropic, ollama, langchain, dalle, midjourney, elevenlabs, whisper, vision, sentiment, pinecone, weaviate, chroma
        - Mobile: rn, flutter, swiftui, expo, push, camera, maps, biometrics
        - Game: unity, godot, phaser, unreal, multiplayer, physics, save_system, inventory
        - Design: minimal, brutalist, glassmorphism, material, geometric, monochrome
        - Auth: clerk, auth0, nextauth, supabase_auth
        - Payment: stripe, lemonsqueezy, paypal
        - CMS: sanity, strapi, wordpress
        - Features: pwa, seo, i18n, docker, cicd, tests, analytics

        RESPONSE FORMAT (JSON ONLY):
        [
            {"id": "option_id", "category": "Category Name", "label": "Option Label"},
            {"id": "option_id", "category": "Category Name", "label": "Option Label"}
        ]

        CRITICAL RULES:
        - Choose 5-10 most relevant options for a complete stack
        - Always include a platform (web/mobile/game/desktop/tool)
        - Include appropriate frontend, backend, and database options
        - Add relevant UI/styling and authentication options
        - Consider AI/ML integrations if relevant
        - For web apps: prefer modern stacks like Next.js/React with TypeScript
        - For mobile: React Native or Flutter with Expo
        - For games: Unity or Phaser depending on platform
        - For desktop: Electron or Tauri
        - Return ONLY the JSON array, no explanations
        `;

        console.log('Getting AI tech stack recommendations...');
        
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: DEFAULT_MODEL,
            prompt: prompt,
            stream: false,
            format: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        category: { type: 'string' },
                        label: { type: 'string' }
                    },
                    required: ['id', 'category', 'label']
                }
            }
        }, {
            timeout: 120000, // 2 minute timeout
            maxContentLength: 50 * 1024 * 1024, // 50MB max response size
            maxBodyLength: 50 * 1024 * 1024 // 50MB max request size
        });

        if (response.data.thinking) {
            console.log('\x1b[36m%s\x1b[0m', '--- AI THINKING ---');
            console.log(response.data.thinking);
            console.log('\x1b[36m%s\x1b[0m', '---------------------');
        }

        let recommendations;
        try {
            recommendations = JSON.parse(response.data.response);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError.message);
            // Fallback to basic recommendations
            recommendations = [
                { id: 'web', category: 'Platform', label: 'Web Application' },
                { id: 'nextjs', category: 'Frontend Framework', label: 'Next.js' },
                { id: 'typescript', category: 'Frontend Framework', label: 'TypeScript' },
                { id: 'node', category: 'Backend & API', label: 'Node.js / Express' },
                { id: 'supabase', category: 'Database / Storage', label: 'Supabase' },
                { id: 'tailwind', category: 'UI & Styling', label: 'Tailwind CSS' }
            ];
        }

        console.log(`AI recommended ${recommendations.length} tech stack options`);
        res.json(recommendations);

    } catch (error) {
        console.error('AI tech stack selection failed:', error.message);
        if (error.code === 'ECONNRESET') {
            console.error('Connection to Ollama was reset. The model might be overloaded or the request timed out.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Could not connect to Ollama. Is Ollama running?');
        }
        
        // Fallback recommendations
        const fallbackStack = [
            { id: 'web', category: 'Platform', label: 'Web Application' },
            { id: 'nextjs', category: 'Frontend Framework', label: 'Next.js' },
            { id: 'typescript', category: 'Frontend Framework', label: 'TypeScript' },
            { id: 'node', category: 'Backend & API', label: 'Node.js / Express' },
            { id: 'supabase', category: 'Database / Storage', label: 'Supabase' },
            { id: 'tailwind', category: 'UI & Styling', label: 'Tailwind CSS' }
        ];
        
        res.json(fallbackStack);
    }
});

// Check cache endpoint
app.get('/api/cache-check', (req, res) => {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            const now = Date.now();
            const isValid = now - cacheData.timestamp < CACHE_TTL;
            res.json({ 
                exists: true, 
                valid: isValid,
                timestamp: cacheData.timestamp
            });
        } else {
            res.json({ exists: false, valid: false });
        }
    } catch (error) {
        console.error('Cache check error:', error.message);
        res.json({ exists: false, valid: false });
    }
});

app.listen(PORT, () => {
    console.log(`Generate Ideas With AI Server running at http://localhost:${PORT}`);
});
