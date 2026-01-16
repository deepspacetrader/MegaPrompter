import { Globe, Smartphone, Gamepad2, Monitor, Terminal, Palette, Plug, Zap, Database, Server, Shield, Layers, CreditCard, FileText, Code2, Bot, Wand2, Cpu, BrainCircuit } from 'lucide-react'
import type { ProjectOption, Selection } from './types'

export const PROJECT_TYPES: ProjectOption[] = [
    {
        id: 'web',
        label: 'Web Application',
        icon: <Globe className="w-5 h-5 text-blue-400" />,
        exclusive: true,
        subOptions: [
            {
                id: 'frontend',
                label: 'Frontend Framework',
                icon: <Code2 className="w-5 h-5 text-cyan-400" />,
                subOptions: [
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
                subOptions: [
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
                subOptions: [
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
                subOptions: [
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
                subOptions: [
                    {
                        id: 'chatbots',
                        label: 'Chat Bots & NLP',
                        icon: <Bot className="w-4 h-4" />,
                        subOptions: [
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
                        subOptions: [
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
                        subOptions: [
                            { id: 'whisper', label: 'Whisper (Speech-to-Text)', exclusive: false },
                            { id: 'vision', label: 'Computer Vision / OCR', exclusive: false },
                            { id: 'sentiment', label: 'Sentiment Analysis', exclusive: false },
                        ]
                    },
                    {
                        id: 'vector_db',
                        label: 'Vector Databases (RAG)',
                        icon: <Database className="w-4 h-4" />,
                        subOptions: [
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
                subOptions: [
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
                subOptions: [
                    {
                        id: 'auth',
                        label: 'Authentication',
                        icon: <Shield className="w-4 h-4" />,
                        subOptions: [
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
                        subOptions: [
                            { id: 'stripe', label: 'Stripe', exclusive: true },
                            { id: 'lemonsqueezy', label: 'Lemon Squeezy', exclusive: true },
                            { id: 'paypal', label: 'PayPal', exclusive: true },
                        ]
                    },
                    {
                        id: 'cms',
                        label: 'CMS / Content',
                        icon: <FileText className="w-4 h-4" />,
                        subOptions: [
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
                subOptions: [
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
        subOptions: [
            { id: 'rn', label: 'React Native', exclusive: true },
            { id: 'flutter', label: 'Flutter', exclusive: true },
            { id: 'swiftui', label: 'SwiftUI', exclusive: true },
            { id: 'expo', label: 'Expo', exclusive: false },
            {
                id: 'mobile_features',
                label: 'Native Features',
                subOptions: [
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
        label: 'Digital Game',
        icon: <Gamepad2 className="w-5 h-5 text-purple-400" />,
        exclusive: true,
        subOptions: [
            { id: 'unity', label: 'Unity', exclusive: true },
            { id: 'godot', label: 'Godot', exclusive: true },
            { id: 'phaser', label: 'Phaser (Web)', exclusive: true },
            { id: 'unreal', label: 'Unreal Engine', exclusive: true },
            {
                id: 'game_features',
                label: 'Game Systems',
                subOptions: [
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
        subOptions: [
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
        subOptions: [
            { id: 'node_cli', label: 'Node.js', exclusive: true },
            { id: 'rust_cli', label: 'Rust', exclusive: true },
            { id: 'go_cli', label: 'Go', exclusive: true },
            { id: 'python_cli', label: 'Python (Click/Typer)', exclusive: true },
        ]
    }
];

export const DEFAULT_MODELS = ['llama3', 'codellama', 'mistral'];

export const RECOMMENDATIONS_MAP: Record<string, Selection> = {
    'react': { id: 'node_cli', label: 'Node.js', category: 'Backend Suggestion' },
    'nextjs': { id: 'node_cli', label: 'Node.js', category: 'Backend Suggestion' },
    'typescript': { id: 'node_cli', label: 'Node.js', category: 'Runtime Suggestion' },
};

export const ARCHITECT_SYSTEM_PROMPT = `
[ROLE]
You are a World-Class Software Architect and Systems Engineer. Your task is to generate a "Mega Prompt" – a master orchestration document that can be handed to any advanced LLM to build a specific software project.

[OBJECTIVE]
Transform the user's technical requirements into a dense, structured, and actionable Project Blueprint. The output must be optimized for context-density and logical flow.

[BLUEPRINT STRUCTURE]
1. Project Essence: A high-level vision.
2. Technical Stack: Validating dependencies and version harmony.
3. Core Architecture: Defining the relationship between components.
4. Feature Specification: Granular breakdown of logic.
5. AI Implementation Strategy: How a target AI should approach the build.
6. Safety & Security: Essential constraints.

[CONSTRAINTS]
- If React/Next.js is selected, enforce strict TypeScript patterns.
- If Database is selected, define schema relations.
- Keep the output professional, detailed, and ready for execution.
`.trim();
