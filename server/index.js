import express from 'express';
import cors from 'cors';
import axios from 'axios';
import RSSParser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');


const app = express();
const parser = new RSSParser();
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3001;
const LM_STUDIO_URL = 'http://localhost:1234';
const DEFAULT_MODEL = 'google/gemma-4-e4b';
const CACHE_FILE = path.join(__dirname, '..', 'idea_cache.json');
const MEGA_PROMPTS_DIR = path.join(__dirname, '..', 'storage', 'mega_prompts');
const CACHE_TTL = Infinity; // Cache never expires

const FEEDS = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'MacRumors', url: 'https://feeds.macrumors.com/public/rss/all.rss' }
];

// Helper functions for prompt storage
function ensureMegaPromptsDir() {
    if (!fs.existsSync(MEGA_PROMPTS_DIR)) {
        fs.mkdirSync(MEGA_PROMPTS_DIR, { recursive: true });
    }
}

async function generateIdeasFromTrends(trends, featuresPerIdea, minIdeas, model = DEFAULT_MODEL, aiSettings = {}) {
    if (trends.length === 0) return [];

    const maxRetries = 2;
    let lastError = null;
    let allIdeas = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ideas = await attemptGenerateIdeasBatched(trends, featuresPerIdea, minIdeas, model, aiSettings, attempt);
            allIdeas.push(...ideas);

            if (allIdeas.length >= minIdeas) {
                console.log(`Successfully generated ${allIdeas.length} ideas on attempt ${attempt}`);
                return allIdeas.slice(0, minIdeas);
            } else {
                console.warn(`Attempt ${attempt}: Generated ${ideas.length} ideas (total: ${allIdeas.length}/${minIdeas})`);
                if (attempt < maxRetries) {
                    console.log(`Retrying... (${attempt}/${maxRetries})`);
                    continue;
                }
            }
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                console.log(`Retrying... (${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            }
        }
    }

    // Return whatever ideas were generated instead of empty array
    if (allIdeas.length > 0) {
        console.warn(`Generated ${allIdeas.length} ideas (below target of ${minIdeas}), returning partial results`);
        return allIdeas;
    }

    console.error(`All ${maxRetries} attempts failed. Returning empty array.`);
    if (lastError) {
        throw lastError;
    }
    return [];
}

async function attemptGenerateIdeasBatched(trends, featuresPerIdea, minIdeas, model, aiSettings, attempt) {
    // Strategy: Generate in smaller batches to avoid overwhelming the AI
    const batchSize = Math.min(3, minIdeas); // Generate max 3 ideas at a time
    const batches = Math.ceil(minIdeas / batchSize);
    const allIdeas = [];

    console.log(`Attempt ${attempt}: Generating ${minIdeas} ideas in ${batches} batches of ${batchSize} each`);

    for (let batch = 0; batch < batches; batch++) {
        const ideasNeeded = Math.min(batchSize, minIdeas - allIdeas.length);
        if (ideasNeeded <= 0) break;

        // Simplified prompt for better reliability
        const prompt = `Generate exactly ${ideasNeeded} different software project ideas as a JSON array.
Each idea needs: id, label, description, rationale, and exactly ${featuresPerIdea} features.
CRITICAL: Each idea MUST have a UNIQUE id. Use sequential numbering starting from ${allIdeas.length + 1}.
Format: [{"id":"idea-${allIdeas.length + 1}","label":"Name1","description":"Desc1","rationale":"Why1","features":[{"id":"f1","label":"Feature 1"}]}, {"id":"idea-${allIdeas.length + 2}","label":"Name2","description":"Desc2","rationale":"Why2","features":[{"id":"f1","label":"Feature 1"}]}]

CRITICAL: ONLY generate SOFTWARE and WEB APPLICATION ideas. NO hardware, physical devices, chips, or embedded systems.
Focus on: web apps, mobile apps, SaaS platforms, online tools, digital services, cloud-based solutions.

Market signals: ${trends.slice(0, 10).join(' | ')}
Return ONLY the JSON array. No explanations.`;

        console.log(`Batch ${batch + 1}: Requesting ${ideasNeeded} ideas with simplified prompt...`);

        const requestOptions = {
            model: model,
            system_prompt: "You are a helpful AI assistant that responds with valid JSON.",
            input: prompt,
            temperature: aiSettings.temperature || 0.1
        };

        try {
            const response = await axios.post(`${LM_STUDIO_URL}/api/v1/chat`, requestOptions, {
                timeout: 90000, // 90 second timeout
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024
            });

            let rawResponse = response.data;
            // LM Studio returns format: {"model_instance_id":"...","output":[{"type":"reasoning","content":"..."}, {"type":"response","content":"..."}]}
            if (typeof rawResponse === 'object' && rawResponse.output && Array.isArray(rawResponse.output)) {
                // Extract content from the output array, prefer non-reasoning content
                const contentItems = rawResponse.output.filter(item => item.type !== 'reasoning');
                if (contentItems.length > 0) {
                    rawResponse = contentItems.map(item => item.content).join('');
                } else {
                    // Fallback to all content if no non-reasoning items
                    rawResponse = rawResponse.output.map(item => item.content).join('');
                }
            } else if (typeof rawResponse === 'object' && rawResponse.content) {
                rawResponse = rawResponse.content;
            } else if (typeof rawResponse === 'object' && rawResponse.response) {
                rawResponse = rawResponse.response;
            } else if (typeof rawResponse === 'object' && rawResponse.message) {
                rawResponse = rawResponse.message;
            } else if (typeof rawResponse !== 'string') {
                rawResponse = JSON.stringify(rawResponse);
            }
            
            rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '');
            rawResponse = rawResponse.trim();

            console.log(`Batch ${batch + 1} response:`, rawResponse.substring(0, 200) + '...');

            const parsed = JSON.parse(rawResponse);
            let ideas = [];

            if (Array.isArray(parsed)) {
                ideas = parsed;
            } else if (parsed.ideas && Array.isArray(parsed.ideas)) {
                ideas = parsed.ideas;
            } else if (parsed.id && parsed.label && parsed.features) {
                ideas = [parsed];
            }

            console.log(`Batch ${batch + 1} parsed ${ideas.length} ideas`);
            allIdeas.push(...ideas);

            // Delay between batches
            if (batch < batches - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`Batch ${batch + 1} failed:`, error.message);
            console.error('Full error details:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            // Continue with next batch even if one fails
        }
    }

    console.log(`Total ideas generated: ${allIdeas.length} (requested: ${minIdeas})`);

    // Post-process to ensure unique IDs and remove duplicates based on content
    const uniqueIdeas = [];
    const seenContent = new Set();
    let idCounter = 1;

    for (const idea of allIdeas) {
        // Create content signature for deduplication (label + description)
        const contentSignature = `${idea.label?.toLowerCase().trim() || ''}-${idea.description?.toLowerCase().trim() || ''}`;

        // Skip if we've seen this content before
        if (seenContent.has(contentSignature)) {
            console.log(`Skipping duplicate idea: ${idea.label}`);
            continue;
        }

        seenContent.add(contentSignature);
        uniqueIdeas.push({
            ...idea,
            id: `idea-${idCounter++}`
        });
    }

    console.log(`After content-based deduplication: ${uniqueIdeas.length} unique ideas (removed ${allIdeas.length - uniqueIdeas.length} duplicates)`);
    return uniqueIdeas.slice(0, minIdeas);
}

app.get('/api/trends', async (req, res) => {
    console.log('--- Incoming Request: GET /api/trends ---');
    // Extract featuresPerIdea, minIdeas, model, and AI settings from query params
    const featuresPerIdea = parseInt(req.query.featuresPerIdea) || 4;
    const minIdeas = parseInt(req.query.minIdeas) || 5;
    const model = req.query.model || DEFAULT_MODEL;

    // Parse AI settings from query
    let aiSettings = {};
    try {
        if (req.query.aiSettings) {
            aiSettings = JSON.parse(req.query.aiSettings);
        }
    } catch (e) {
        console.warn('Invalid AI settings in query, using defaults:', e.message);
    }

    // 0. Check Cache
    try {
        console.log('Checking cache file:', CACHE_FILE);
        if (fs.existsSync(CACHE_FILE) && req.query.force !== 'true') {
            console.log('Serving ideas from cache (force =', req.query.force, ')...');
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            return res.json({
                ideas: cacheData.ideas,
                trends: cacheData.trends || {
                    totalSignals: 0,
                    sources: [],
                    sampleHeadlines: []
                }
            });
        } else if (req.query.force === 'true') {
            console.log('Force refresh requested - bypassing cache');
        } else {
            console.log('No cache file found - will crawl');
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


    console.log(`Gathered ${headlines.length} signals. Generating ${minIdeas} ideas with ${featuresPerIdea} features per idea...`);

    try {
        const ideas = await generateIdeasFromTrends(headlines, featuresPerIdea, minIdeas, model, aiSettings);

        // 4. Save to Cache
        if (ideas.length > 0) {
            try {
                fs.writeFileSync(CACHE_FILE, JSON.stringify({
                    timestamp: Date.now(),
                    ideas: ideas,
                    trends: {
                        totalSignals: headlines.length,
                        sources: FEEDS.map(f => f.name),
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
                sources: FEEDS.map(f => f.name),
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
        const { selections, model, aiSettings } = req.body;

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
        - AI/ML: openai, anthropic, lm_studio, langchain, dalle, midjourney, elevenlabs, whisper, vision, sentiment, pinecone, weaviate, chroma
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

        // Prepare request options with AI settings
        const requestOptions = {
            model: model || DEFAULT_MODEL,
            system_prompt: "You are a helpful AI assistant that responds with valid JSON arrays.",
            input: prompt,
            temperature: aiSettings?.temperature || 0.1
        };

        const response = await axios.post(`${LM_STUDIO_URL}/api/v1/chat`, requestOptions, {
            timeout: 120000, // 2 minute timeout
            maxContentLength: 50 * 1024 * 1024, // 50MB max response size
            maxBodyLength: 50 * 1024 * 1024 // 50MB max request size
        });

        let recommendations;
        try {
            let rawResponse = response.data;
            // LM Studio returns format: {"model_instance_id":"...","output":[{"type":"reasoning","content":"..."}, {"type":"response","content":"..."}]}
            if (typeof rawResponse === 'object' && rawResponse.output && Array.isArray(rawResponse.output)) {
                // Extract content from the output array, prefer non-reasoning content
                const contentItems = rawResponse.output.filter(item => item.type !== 'reasoning');
                if (contentItems.length > 0) {
                    rawResponse = contentItems.map(item => item.content).join('');
                } else {
                    // Fallback to all content if no non-reasoning items
                    rawResponse = rawResponse.output.map(item => item.content).join('');
                }
            } else if (typeof rawResponse === 'object' && rawResponse.content) {
                rawResponse = rawResponse.content;
            } else if (typeof rawResponse === 'object' && rawResponse.response) {
                rawResponse = rawResponse.response;
            } else if (typeof rawResponse === 'object' && rawResponse.message) {
                rawResponse = rawResponse.message;
            } else if (typeof rawResponse !== 'string') {
                rawResponse = JSON.stringify(rawResponse);
            }
            // Clean up markdown code blocks if present
            rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '');
            // Trim whitespace
            rawResponse = rawResponse.trim();

            recommendations = JSON.parse(rawResponse);
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
            console.error('Connection to LM Studio was reset. The model might be overloaded or the request timed out.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Could not connect to LM Studio. Is LM Studio running?');
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

app.post('/api/ui-preview', async (req, res) => {
    try {
        const { megaPrompt, model, aiSettings } = req.body || {};

        console.log('[UI Preview] Request received:', { model: model || DEFAULT_MODEL, megaPromptLength: megaPrompt?.length });

        if (!megaPrompt || typeof megaPrompt !== 'string') {
            return res.status(400).json({ error: 'megaPrompt (string) is required' });
        }

        const uiPrompt = `
You are generating a UI PREVIEW JSON in the SAME SHAPE as the json-render.dev playground.

Input: a "Mega Prompt" describing a software project.
Output: ONLY JSON (no markdown) with this exact schema:

{
  "root": "some_key",
  "elements": {
    "some_key": {
      "key": "some_key",
      "type": "Stack" | "Grid" | "Card" | "Text" | "Badge" | "List" | "ListItem" | "Divider" | "Button" | "Input" | "Markdown" | "Placeholder" | "KeyValue",
      "props": { ... },
      "children"?: ["child_key", ...]
    }
  }
}

Rules:
- keys must be unique strings
- children must reference keys in elements
- Only use these component types: Stack, Grid, Card, Text, Badge, List, ListItem, Divider, Button, Input, Markdown, Placeholder, KeyValue

Component props:
- Stack.props: { "direction": "vertical"|"horizontal", "gap"?: "2"|"4"|"6"|"8"|"10" }
- Grid.props: { "columns": 1|2|3, "gap"?: "2"|"4"|"6"|"8"|"10" }
- Card.props: { "title"?: string }
- Text.props: { "text": string, "variant"?: "title"|"subtitle"|"body"|"muted" }
- Badge.props: { "text": string }
- List.props: { "title"?: string }
- ListItem.props: { "title": string, "description"?: string }
- Divider.props: { }
- Button.props: { "text": string, "variant"?: "primary"|"secondary"|"ghost" }
- Input.props: { "label"?: string, "placeholder"?: string }
- Markdown.props: { "text": string }
- Placeholder.props: { "title": string, "description"?: string }
- KeyValue.props: { "title"?: string, "items": [{ "label": string, "value": string }] }

Goal:
- Create a plausible product UI preview for what the MegaPrompt describes.
- Include: product name/header, nav/tabs (as horizontal Stack of Badges), key screens/flows, and a few feature cards.

MEGA PROMPT:
${megaPrompt}
        `.trim();

        const response = await axios.post(`${LM_STUDIO_URL}/api/v1/chat`, {
            model: model || DEFAULT_MODEL,
            system_prompt: "You are a helpful AI assistant that responds with valid JSON objects.",
            input: uiPrompt,
            temperature: aiSettings?.temperature || 0.1
        }, {
            timeout: 120000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024
        });

        console.log('[UI Preview] LM Studio response status:', response.status);
        let rawResponse = response.data;
        console.log('[UI Preview] Raw response type:', typeof rawResponse);
        console.log('[UI Preview] Raw response keys:', typeof rawResponse === 'object' ? Object.keys(rawResponse) : 'N/A');
        // LM Studio returns format: {"model_instance_id":"...","output":[{"type":"reasoning","content":"..."}, {"type":"response","content":"..."}]}
        if (typeof rawResponse === 'object' && rawResponse.output && Array.isArray(rawResponse.output)) {
            // Extract content from the output array, prefer non-reasoning content
            const contentItems = rawResponse.output.filter(item => item.type !== 'reasoning');
            if (contentItems.length > 0) {
                rawResponse = contentItems.map(item => item.content).join('');
            } else {
                // Fallback to all content if no non-reasoning items
                rawResponse = rawResponse.output.map(item => item.content).join('');
            }
        } else if (typeof rawResponse === 'object' && rawResponse.content) {
            rawResponse = rawResponse.content;
        } else if (typeof rawResponse === 'object' && rawResponse.response) {
            rawResponse = rawResponse.response;
        } else if (typeof rawResponse === 'object' && rawResponse.message) {
            rawResponse = rawResponse.message;
        } else if (typeof rawResponse !== 'string') {
            rawResponse = JSON.stringify(rawResponse);
        }
        rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '');
        rawResponse = rawResponse.trim();
        console.log('[UI Preview] Parsed response length:', rawResponse.length);
        console.log('[UI Preview] Parsed response preview:', rawResponse.substring(0, 500));
        console.log('[UI Preview] Full parsed response:', rawResponse);

        try {
            const preview = JSON.parse(rawResponse);
            console.log('[UI Preview] JSON parsed successfully');

            const toGraph = (tree) => {
                if (!tree || typeof tree !== 'object') return null;

                if (typeof tree.root === 'string' && tree.elements && typeof tree.elements === 'object') {
                    // The tree already has graph format, but we need to normalize it
                    // Convert any nested object children to string references
                    const elements = { ...tree.elements };
                    let counter = Object.keys(elements).length;

                    const normalizeElement = (key) => {
                        const el = elements[key];
                        if (!el) return;

                        if (Array.isArray(el.children) && el.children.length > 0) {
                            // Handle mixed arrays (strings and objects)
                            const childKeys = el.children.map((child) => {
                                if (typeof child === 'string') {
                                    // Already a string reference, keep as-is
                                    return child;
                                } else if (typeof child === 'object') {
                                    // Convert nested object to string reference
                                    counter += 1;
                                    const childKey = child.key || `el_${counter}`;
                                    elements[childKey] = {
                                        key: childKey,
                                        type: child.type,
                                        props: (child.props && typeof child.props === 'object') ? child.props : {}
                                    };
                                    // Recursively normalize the child
                                    normalizeElement(childKey);
                                    return childKey;
                                }
                                return null;
                            }).filter(Boolean); // Remove nulls
                            el.children = childKeys;
                        }
                    };

                    // Normalize all elements
                    for (const key of Object.keys(elements)) {
                        normalizeElement(key);
                    }

                    return { root: tree.root, elements };
                }

                if (typeof tree.type !== 'string') return null;

                let counter = 0;
                const elements = {};

                const walk = (node) => {
                    counter += 1;
                    const key = (node && typeof node.key === 'string' && node.key) ? node.key : `el_${counter}`;
                    elements[key] = {
                        key,
                        type: node.type,
                        props: (node.props && typeof node.props === 'object') ? node.props : {}
                    };

                    if (Array.isArray(node.children) && node.children.length > 0) {
                        // Only treat as nested children if they are objects
                        if (typeof node.children[0] === 'object') {
                            elements[key].children = node.children.map(walk);
                        }
                    }

                    return key;
                };

                const root = walk(tree);
                return { root, elements };
            };

            const graph = toGraph(preview);
            if (!graph) {
                return res.json({
                    root: 'screen',
                    elements: {
                        screen: {
                            key: 'screen',
                            type: 'Stack',
                            props: { direction: 'vertical', gap: '6' },
                            children: ['title', 'card']
                        },
                        title: {
                            key: 'title',
                            type: 'Text',
                            props: { variant: 'title', text: 'UI Preview' }
                        },
                        card: {
                            key: 'card',
                            type: 'Card',
                            props: { title: 'Invalid Preview Format' },
                            children: ['msg']
                        },
                        msg: {
                            key: 'msg',
                            type: 'Text',
                            props: { variant: 'body', text: 'Model output was not a valid graph or nested tree.' }
                        }
                    }
                });
            }

            if (graph && typeof graph === 'object' && graph.elements && typeof graph.elements === 'object') {
                for (const [k, v] of Object.entries(graph.elements)) {
                    if (v && typeof v === 'object' && !v.key) {
                        v.key = k;
                    }
                }

                if (!graph.root || !graph.elements[graph.root]) {
                    const keys = Object.keys(graph.elements);
                    if (keys.length > 0) {
                        graph.root = keys[0];
                    }
                }

                const toTitle = (s) => {
                    if (!s || typeof s !== 'string') return 'Missing section';
                    const cleaned = s.replace(/[_-]+/g, ' ').trim();
                    if (!cleaned) return 'Missing section';
                    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
                };

                const ensureElement = (key) => {
                    if (typeof key !== 'string' || !key) return;
                    if (graph.elements[key]) return;
                    graph.elements[key] = {
                        key,
                        type: 'Text',
                        props: { variant: 'muted', text: toTitle(key) }
                    };
                };

                const visited = new Set();
                const queue = [graph.root];
                while (queue.length > 0) {
                    const k = queue.shift();
                    if (typeof k !== 'string' || !k) continue;
                    if (visited.has(k)) continue;
                    visited.add(k);

                    if (!graph.elements[k]) {
                        ensureElement(k);
                    }

                    const el = graph.elements[k];
                    if (!el || typeof el !== 'object') continue;

                    if (!el.key) el.key = k;
                    if (!Array.isArray(el.children)) continue;

                    for (const child of el.children) {
                        if (typeof child === 'string') {
                            ensureElement(child);
                            queue.push(child);
                        }
                    }
                }
            }

            return res.json(graph);
        } catch (parseError) {
            console.error('Failed to parse ui-preview JSON:', parseError.message);
        }

        return res.json({
            root: 'screen',
            elements: {
                screen: {
                    key: 'screen',
                    type: 'Stack',
                    props: { direction: 'vertical', gap: '6' },
                    children: ['title', 'card']
                },
                title: {
                    key: 'title',
                    type: 'Text',
                    props: { variant: 'title', text: 'UI Preview' }
                },
                card: {
                    key: 'card',
                    type: 'Card',
                    props: { title: 'Preview Unavailable' },
                    children: ['msg']
                },
                msg: {
                    key: 'msg',
                    type: 'Text',
                    props: { variant: 'body', text: 'Could not parse model output into a json-render preview.' }
                }
            }
        });
    } catch (error) {
        console.error('UI preview generation failed:', error.message);
        return res.json({
            root: 'screen',
            elements: {
                screen: {
                    key: 'screen',
                    type: 'Stack',
                    props: { direction: 'vertical', gap: '6' },
                    children: ['title', 'card']
                },
                title: {
                    key: 'title',
                    type: 'Text',
                    props: { variant: 'title', text: 'UI Preview' }
                },
                card: {
                    key: 'card',
                    type: 'Card',
                    props: { title: 'Preview Error' },
                    children: ['msg', 'detail']
                },
                msg: {
                    key: 'msg',
                    type: 'Text',
                    props: { variant: 'body', text: 'Failed to generate preview.' }
                },
                detail: {
                    key: 'detail',
                    type: 'Text',
                    props: { variant: 'muted', text: String(error.message || error) }
                }
            }
        });
    }
});

// Get LM Studio models endpoint
app.get('/api/models', async (req, res) => {
    try {
        const url = `${LM_STUDIO_URL}/api/v1/models`;
        console.log('[LM Studio] Fetching models from:', url);
        const response = await axios.get(url);
        console.log('[LM Studio] Response status:', response.status, response.statusText);

        if (!response.ok && response.status !== 200) {
            console.log('[LM Studio] Response not OK, returning empty');
            return res.json({ models: [] });
        }

        const data = response.data;
        console.log('[LM Studio] Raw response data:', data);

        // LM Studio returns {models: [...]}
        if (Array.isArray(data.models)) {
            const models = data.models
                .filter(m => m.type === 'llm') // Only include LLM models, not embeddings
                .map(m => m.key || m.id || m.model || m.name || '')
                .filter(Boolean);
            console.log('[LM Studio] Parsed models:', models);
            return res.json({ models });
        }

        // Fallback for other formats
        if (Array.isArray(data)) {
            const models = data
                .filter(m => m.type !== 'embedding') // Exclude embedding models
                .map(m => m.key || m.id || m.model || m.name || '')
                .filter(Boolean);
            console.log('[LM Studio] Parsed models (array):', models);
            return res.json({ models });
        }

        if (data.data && Array.isArray(data.data)) {
            const models = data.data
                .filter(m => m.type !== 'embedding')
                .map(m => m.key || m.id || m.model || m.name || '')
                .filter(Boolean);
            console.log('[LM Studio] Parsed models from data.data:', models);
            return res.json({ models });
        }

        console.log('[LM Studio] No models found in response');
        return res.json({ models: [] });
    } catch (error) {
        console.error('[LM Studio] Error listing models:', error.message);
        // Return empty array on error (expected when LM Studio is not running)
        return res.json({ models: [] });
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
