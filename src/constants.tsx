import { Globe, Smartphone, Gamepad2, Monitor, Terminal, Palette, Plug, Zap, Database, Server, Shield, Layers, CreditCard, FileText, Code2, Bot, Wand2, Cpu, BrainCircuit, Target, Rocket, Users, Brain, Heart, TrendingUp, Lightbulb, Zap as ZapIcon } from 'lucide-react'
import type { ProjectOption, Selection } from './types'

export const PROJECT_TYPES: ProjectOption[] = [
    {
        id: 'web',
        label: 'Web Application',
        icon: <Globe className="w-5 h-5 text-blue-400" />,
        exclusive: true,
        features: [
            {
                id: 'frontend',
                label: 'Frontend Framework',
                icon: <Code2 className="w-5 h-5 text-cyan-400" />,
                features: [
                    { id: 'react', label: 'React.js', exclusive: true },
                    { id: 'nextjs', label: 'Next.js', exclusive: true },
                    { id: 'vue', label: 'Vue.js', exclusive: true },
                    { id: 'svelte', label: 'Svelte', exclusive: true },
                    { id: 'solid', label: 'SolidJS', exclusive: true },
                    { id: 'astro', label: 'Astro', exclusive: true },
                    { id: 'typescript', label: 'TypeScript', exclusive: false },
                ]
            },
            {
                id: 'backend',
                label: 'Backend & API',
                icon: <Server className="w-5 h-5 text-indigo-400" />,
                features: [
                    { id: 'node', label: 'Node.js / Express', exclusive: true },
                    { id: 'hono', label: 'Hono', exclusive: true },
                    { id: 'nest', label: 'NestJS', exclusive: true },
                    { id: 'python_fastapi', label: 'Python FastAPI', exclusive: true },
                    { id: 'go_chi', label: 'Go Chi', exclusive: true },
                    { id: 'trpc', label: 'tRPC', exclusive: false },
                    { id: 'graphql', label: 'GraphQL', exclusive: false },
                ]
            },
            {
                id: 'database',
                label: 'Database / Storage',
                icon: <Database className="w-5 h-5 text-emerald-400" />,
                features: [
                    { id: 'supabase', label: 'Supabase', exclusive: true },
                    { id: 'firebase', label: 'Firebase', exclusive: true },
                    { id: 'postgresql', label: 'PostgreSQL', exclusive: true },
                    { id: 'mongodb', label: 'MongoDB', exclusive: true },
                    { id: 'mysql', label: 'MySQL', exclusive: true },
                    { id: 'redis', label: 'Redis (Cache)', exclusive: false },
                ]
            },
            {
                id: 'ui_library',
                label: 'UI & Styling',
                icon: <Layers className="w-5 h-5 text-pink-400" />,
                features: [
                    { id: 'tailwind', label: 'Tailwind CSS', exclusive: false },
                    { id: 'shadcn', label: 'shadcn/ui', exclusive: false },
                    { id: 'chakra', label: 'Chakra UI', exclusive: false },
                    { id: 'radix', label: 'Radix UI', exclusive: false },
                    { id: 'framer', label: 'Framer Motion', exclusive: false },
                    { id: 'lucide', label: 'Lucide Icons', exclusive: false },
                ]
            },
            {
                id: 'ai_integrations',
                label: 'AI & Machine Learning',
                icon: <BrainCircuit className="w-5 h-5 text-violet-400" />,
                features: [
                    {
                        id: 'chatbots',
                        label: 'Chat Bots & NLP',
                        icon: <Bot className="w-4 h-4" />,
                        features: [
                            { id: 'openai', label: 'OpenAI GPT-4/3.5', exclusive: false },
                            { id: 'anthropic', label: 'Anthropic Claude', exclusive: false },
                            { id: 'ollama', label: 'Local Ollama Models', exclusive: false },
                            { id: 'langchain', label: 'LangChain Orchestration', exclusive: false },
                        ]
                    },
                    {
                        id: 'media_gen',
                        label: 'Media Generation',
                        icon: <Wand2 className="w-4 h-4" />,
                        features: [
                            { id: 'dalle', label: 'DALL-E (Images)', exclusive: false },
                            { id: 'midjourney', label: 'Midjourney API', exclusive: false },
                            { id: 'elevenlabs', label: 'ElevenLabs (Voice)', exclusive: false },
                            { id: 'sora', label: 'Video Generation', exclusive: false },
                        ]
                    },
                    {
                        id: 'media_proc',
                        label: 'Media Processing',
                        icon: <Cpu className="w-4 h-4" />,
                        features: [
                            { id: 'whisper', label: 'Whisper (Speech-to-Text)', exclusive: false },
                            { id: 'vision', label: 'Computer Vision / OCR', exclusive: false },
                            { id: 'sentiment', label: 'Sentiment Analysis', exclusive: false },
                        ]
                    },
                    {
                        id: 'vector_db',
                        label: 'Vector Databases (RAG)',
                        icon: <Database className="w-4 h-4" />,
                        features: [
                            { id: 'pinecone', label: 'Pinecone', exclusive: true },
                            { id: 'weaviate', label: 'Weaviate', exclusive: true },
                            { id: 'chroma', label: 'ChromaDB', exclusive: true },
                        ]
                    }
                ]
            },
            {
                id: 'design',
                label: 'Design Aesthetics',
                icon: <Palette className="w-5 h-5 text-purple-400" />,
                features: [
                    { id: 'minimal', label: 'Minimalist / Clean', exclusive: true },
                    { id: 'brutalist', label: 'Neo-Brutalism', exclusive: true },
                    { id: 'glassmorphism', label: 'Glassmorphism', exclusive: true },
                    { id: 'material', label: 'Material Design', exclusive: true },
                    { id: 'geometric', label: 'Geometric / Grids', exclusive: true },
                    { id: 'monochrome', label: 'Monochromatic', exclusive: true },
                ]
            },
            {
                id: 'integrations',
                label: 'Integrations',
                icon: <Plug className="w-5 h-5 text-orange-400" />,
                features: [
                    {
                        id: 'auth',
                        label: 'Authentication',
                        icon: <Shield className="w-4 h-4" />,
                        features: [
                            { id: 'clerk', label: 'Clerk', exclusive: true },
                            { id: 'auth0', label: 'Auth0', exclusive: true },
                            { id: 'nextauth', label: 'NextAuth.js', exclusive: true },
                            { id: 'supabase_auth', label: 'Supabase Auth', exclusive: true },
                        ]
                    },
                    {
                        id: 'payment',
                        label: 'Payments',
                        icon: <CreditCard className="w-4 h-4" />,
                        features: [
                            { id: 'stripe', label: 'Stripe', exclusive: true },
                            { id: 'lemonsqueezy', label: 'Lemon Squeezy', exclusive: true },
                            { id: 'paypal', label: 'PayPal', exclusive: true },
                        ]
                    },
                    {
                        id: 'cms',
                        label: 'CMS / Content',
                        icon: <FileText className="w-4 h-4" />,
                        features: [
                            { id: 'sanity', label: 'Sanity.io', exclusive: true },
                            { id: 'strapi', label: 'Strapi', exclusive: true },
                            { id: 'wordpress', label: 'WordPress API', exclusive: true },
                        ]
                    }
                ]
            },
            {
                id: 'capabilities',
                label: 'Capabilities & Config',
                icon: <Zap className="w-5 h-5 text-yellow-400" />,
                features: [
                    { id: 'pwa', label: 'Progressive Web App (PWA)', exclusive: false },
                    { id: 'seo', label: 'Advanced SEO Setup', exclusive: false },
                    { id: 'i18n', label: 'Internationalization (i18n)', exclusive: false },
                    { id: 'docker', label: 'Docker / Containerization', exclusive: false },
                    { id: 'cicd', label: 'CI/CD Pipelines', exclusive: false },
                    { id: 'tests', label: 'Unit & E2E Testing', exclusive: false },
                    { id: 'analytics', label: 'Analytics Setup', exclusive: false },
                ]
            }
        ]
    },
    {
        id: 'mobile',
        label: 'Mobile App',
        icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
        exclusive: true,
        features: [
            { id: 'rn', label: 'React Native', exclusive: true },
            { id: 'flutter', label: 'Flutter', exclusive: true },
            { id: 'swiftui', label: 'SwiftUI', exclusive: true },
            { id: 'expo', label: 'Expo', exclusive: false },
            {
                id: 'mobile_features',
                label: 'Native Features',
                features: [
                    { id: 'push', label: 'Push Notifications', exclusive: false },
                    { id: 'camera', label: 'Camera / Media', exclusive: false },
                    { id: 'maps', label: 'Maps / Geolocation', exclusive: false },
                    { id: 'biometrics', label: 'Biometrics (FaceID)', exclusive: false },
                ]
            }
        ]
    },
    {
        id: 'game',
        label: 'Game',
        icon: <Gamepad2 className="w-5 h-5 text-purple-400" />,
        exclusive: true,
        features: [
            { id: 'unity', label: 'Unity', exclusive: true },
            { id: 'godot', label: 'Godot', exclusive: true },
            { id: 'phaser', label: 'Phaser (Web)', exclusive: true },
            { id: 'unreal', label: 'Unreal Engine', exclusive: true },
            {
                id: 'game_features',
                label: 'Game Systems',
                features: [
                    { id: 'multiplayer', label: 'Multiplayer (Netcode)', exclusive: false },
                    { id: 'physics', label: 'Physics Engine', exclusive: false },
                    { id: 'save_system', label: 'Save System', exclusive: false },
                    { id: 'inventory', label: 'Inventory System', exclusive: false },
                ]
            }
        ]
    },
    {
        id: 'desktop',
        label: 'Desktop Software',
        icon: <Monitor className="w-5 h-5 text-rose-400" />,
        exclusive: true,
        features: [
            { id: 'electron', label: 'Electron', exclusive: true },
            { id: 'tauri', label: 'Tauri', exclusive: true },
            { id: 'native_win', label: 'Windows Native (C#)', exclusive: true },
        ]
    },
    {
        id: 'tool',
        label: 'CLI / Tool',
        icon: <Terminal className="w-5 h-5 text-amber-400" />,
        exclusive: true,
        features: [
            { id: 'node_cli', label: 'Node.js', exclusive: true },
            { id: 'rust_cli', label: 'Rust', exclusive: true },
            { id: 'go_cli', label: 'Go', exclusive: true },
            { id: 'python_cli', label: 'Python (Click/Typer)', exclusive: true },
        ]
    }
];

export const PROJECT_IDEATION: ProjectOption[] = [
    {
        id: 'purpose',
        label: 'Core Purpose',
        icon: <Target className="w-5 h-5 text-rose-400" />,
        features: [
            {
                id: 'solve_pain',
                label: 'Solve a specific user pain point',
                exclusive: false,
                features: [
                    { id: 'b2b_productivity', label: 'B2B Productivity Gap', exclusive: false },
                    { id: 'personal_finance', label: 'Personal Finance Chaos', exclusive: false },
                    { id: 'health_tracking', label: 'Fragmented Health Data', exclusive: false },
                    { id: 'career_growth', label: 'Career Path Mapping', exclusive: false },
                ]
            },
            {
                id: 'saas_mvp',
                label: 'Build a commercial SaaS MVP',
                exclusive: false,
                features: [
                    { id: 'ai_wrapper', label: 'AI Workflow Wrapper', exclusive: false },
                    { id: 'niche_crm', label: 'Ultra-Niche CRM', exclusive: false },
                    { id: 'automated_news', label: 'Automated Newsletter Engine', exclusive: false },
                    { id: 'dev_tooling', label: 'Developer Micro-utility', exclusive: false },
                ]
            },
            { id: 'education', label: 'Educational or Learning platform', exclusive: false },
            { id: 'portfolio_wow', label: 'Showcase skill for portfolio', exclusive: false },
            { id: 'automation_task', label: 'Automate a complex manual task', exclusive: false },
            { id: 'social_impact', label: 'Create positive social impact', exclusive: false },
        ]
    },
    {
        id: 'vision',
        label: 'Long-term Vision',
        icon: <Rocket className="w-5 h-5 text-amber-400" />,
        features: [
            {
                id: 'enterprise_scale',
                label: 'Ready for Enterprise scaling',
                exclusive: false,
                features: [
                    { id: 'multi_tenant', label: 'Multi-tenant Architecture', exclusive: false },
                    { id: 'rbac_ready', label: 'RBAC & Single Sign-On', exclusive: false },
                    { id: 'high_availability', label: 'Region-failover Ready', exclusive: false },
                ]
            },
            { id: 'cutting_edge_lab', label: 'Experimental & Cutting-edge', exclusive: false },
            { id: 'boutique_quality', label: 'Small, Boutique & High Quality', exclusive: false },
            { id: 'privacy_focused', label: 'Privacy & Security first', exclusive: false },
            { id: 'community_driven', label: 'Open Source & Community driven', exclusive: false },
            { id: 'passive_income', label: 'Low maintenance passive engine', exclusive: false },
        ]
    },
    {
        id: 'audience',
        label: 'Target Audience',
        icon: <Users className="w-5 h-5 text-cyan-400" />,
        features: [
            { id: 'developers_tech', label: 'For Developers & Tech-savvy', exclusive: false },
            { id: 'non_tech_mass', label: 'For Non-technical mass market', exclusive: false },
            { id: 'small_biz', label: 'For Small business owners', exclusive: false },
            { id: 'creative_artists', label: 'For Artists & Creatives', exclusive: false },
            { id: 'internal_teams', label: 'Internal tool for companies', exclusive: false },
            { id: 'hobbyists', label: 'For Niche hobbyist communities', exclusive: false },
        ]
    },
    {
        id: 'personality',
        label: 'Project Personality',
        icon: <Brain className="w-5 h-5 text-violet-400" />,
        features: [
            { id: 'playful_fun', label: 'Playful, Fun & Engaging', exclusive: false },
            { id: 'serious_pro', label: 'Serious, Professional & Trusted', exclusive: false },
            { id: 'minimalist_calm', label: 'Minimalist, Calm & Focused', exclusive: false },
            { id: 'bold_loud', label: 'Bold, Loud & Energetic', exclusive: false },
            { id: 'futuristic_sci_fi', label: 'Futuristic & Sci-Fi aesthetics', exclusive: false },
            { id: 'warm_organic', label: 'Warm, Organic & Human-centric', exclusive: false },
        ]
    },
    {
        id: 'values',
        label: 'Core Values',
        icon: <Heart className="w-5 h-5 text-pink-400" />,
        features: [
            { id: 'speed_perf', label: 'Blazing speed & performance', exclusive: false },
            { id: 'accessibility', label: 'Universal accessibility', exclusive: false },
            { id: 'sustainability', label: 'Eco-friendly & Sustainable', exclusive: false },
            { id: 'transparency', label: 'Radical transparency', exclusive: false },
            { id: 'simplicity', label: 'Absolute simplicity of use', exclusive: false },
            { id: 'innovation', label: 'Boundary-pushing innovation', exclusive: false },
        ]
    },
    {
        id: 'web_deep_dive',
        label: 'Platform Experience',
        icon: <Globe className="w-5 h-5 text-blue-400" />,
        features: [
            { id: 'real_time_collab', label: 'Real-time Collaboration focus', exclusive: false },
            { id: 'data_viz_heavy', label: 'High-density Data Visualization', exclusive: false },
            { id: 'social_engagement', label: 'Social & Community engagement', exclusive: false },
            { id: 'workflow_optimized', label: 'Professional Workflow optimization', exclusive: false },
        ]
    },
    {
        id: 'game_deep_dive',
        label: 'Game Mechanics & Feel',
        icon: <Gamepad2 className="w-5 h-5 text-purple-400" />,
        features: [
            { id: 'roguelike_proc', label: 'Roguelike / Procedural systems', exclusive: false },
            { id: 'narrative_choice', label: 'Branching Narrative & Choices', exclusive: false },
            { id: 'competitive_multi', label: 'Competitive Online Multiplayer', exclusive: false },
            { id: 'casual_zen', label: 'Relaxing, Zen-like atmosphere', exclusive: false },
        ]
    },
    {
        id: 'safety_compliance',
        label: 'Safety & Trust',
        icon: <Shield className="w-5 h-5 text-emerald-400" />,
        features: [
            { id: 'hipaa_ready', label: 'HIPAA / Healthcare compliance', exclusive: false },
            { id: 'gdpr_privacy', label: 'Strict GDPR / Privacy compliance', exclusive: false },
            { id: 'child_safe', label: 'COPPA / Child-safe interactions', exclusive: false },
            { id: 'audit_logs', label: 'Enterprise Grade Audit Logs', exclusive: false },
        ]
    }
];

export const TRENDING_IDEATION: ProjectOption[] = [
    {
        id: 'viral_patterns',
        label: 'Viral Trends & Buzz',
        icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
        features: [
            { id: 'ai_companion', label: 'AI "Digital Twin" Companion', exclusive: false },
            { id: 'gamified_habit', label: 'Gamified Wellness RPG', exclusive: false },
            { id: 'micro_saas_ops', label: 'Micro-SaaS for Ghost Kitchens', exclusive: false },
            { id: 'web3_utility', label: 'Non-speculative Web3 Ticketing', exclusive: false },
            { id: 'voice_ai_first', label: 'Voice-Only Social Interface', exclusive: false },
        ]
    },
    {
        id: 'inspired_by',
        label: 'Inspired By...',
        icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
        features: [
            { id: 'linear_app', label: 'Linear-inspired Workflow Tool', exclusive: false },
            { id: 'stripe_docs', label: 'Stripe-inspired Documentation Engine', exclusive: false },
            { id: 'duolingo_game', label: 'Duolingo-style Skill Learning', exclusive: false },
            { id: 'notion_blocks', label: 'Notion-like Block Editor', exclusive: false },
        ]
    },
    {
        id: 'random_generator',
        label: 'The "Wildcard" Idea',
        icon: <ZapIcon className="w-5 h-5 text-indigo-400" />,
        features: [
            { id: 'local_commerce', label: 'A Hyper-local Item Swap Market', exclusive: false },
            { id: 'dev_health', label: 'A "Mindfulness" Plugin for VS Code', exclusive: false },
            { id: 'pet_tech', label: 'AI Translator for Pet Body Language', exclusive: false },
            { id: 'legacy_revive', label: 'Modern UX for Old Government Sites', exclusive: false },
        ]
    }
];

export const DEFAULT_MODELS = ['deepseek-r1:8b'];

export const RECOMMENDATIONS_MAP: Record<string, Selection> = {
    'react': { id: 'node_cli', label: 'Node.js', category: 'Backend Suggestion' },
    'nextjs': { id: 'node_cli', label: 'Node.js', category: 'Backend Suggestion' },
    'typescript': { id: 'node_cli', label: 'Node.js', category: 'Runtime Suggestion' },
};

export const ARCHITECT_SYSTEM_PROMPT = `
[ROLE]
You are a World-Class Software Architect and Systems Engineer. Your task is to generate a "Mega Prompt" – a master orchestration document that can be handed to any advanced LLM (like Goose or Claude) to build a specific software project using the "Ralph Loop" autonomous development methodology.

[OBJECTIVE]
Transform the user's technical requirements into a dense, structured, and actionable Project Blueprint. The output must be optimized for context-density and specifically formatted to be "Ralph-Loop" friendly.

[RALPH LOOP INTEGRATION]
The output must be structured as a comprehensive PRD (Product Requirements Document) that an autonomous agent can execute iteratively. 
- Reference "Ralph Loop" principles: https://agents.md/
- Repository context: https://github.com/snarktank/ralph
- Tutorial context: https://block.github.io/goose/docs/tutorials/ralph-loop/

[BLUEPRINT STRUCTURE]
1. Project Essence & Vision: High-level intent.
2. Ralph-Friendly PRD.md: A structured, task-oriented requirement list that can be converted to JSON/Tasks easily.
3. Institutional Memory (agents.md): A set of initial rules, patterns, and "learnings" for the agent to follow and update.
4. Technical Stack: Validating dependencies and version harmony.
5. Core Architecture: Defining the relationship between components and modules.
6. AI Implementation Strategy: Step-by-step roadmap for Ralph/Goose to follow.
7. Safety & Security: Essential constraints and edge cases.

[CONSTRAINTS]
- Always generate a baseline "agents.md" content block within the prompt.
- Ensure the PRD uses clear, atomic user stories or tasks.
- If React/Next.js is selected, enforce strict TypeScript patterns.
- Keep the output professional, detailed, and ready for autonomous execution.
`.trim();
