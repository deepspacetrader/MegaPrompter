import { useState, useMemo, useEffect } from 'react'
import type { Selection, ProjectOption } from './types'
import { PROJECT_TYPES, DEFAULT_MODELS, RECOMMENDATIONS_MAP, ARCHITECT_SYSTEM_PROMPT } from './constants'
import { Header } from './components/Header'
import { ProjectBuilder } from './components/ProjectBuilder'
import { ProjectRequirements } from './components/ProjectRequirements'
import { Preview } from './components/Preview'
import { InstantPreview } from './components/InstantPreview'
import { Footer } from './components/Footer'
import { SettingsModal } from './components/SettingsModal'

function App() {
  const [selections, setSelections] = useState<Selection[]>([]);
  
  // Retry utility for API calls
  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        if (response.ok) return response;
        
        console.log(`API call failed with status ${response.status} (attempt ${attempt}/${retries})`);
        if (attempt === retries) throw new Error(`Failed after ${retries} attempts`);
      } catch (error) {
        console.error(`API call error (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) throw error;
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    throw new Error('All retry attempts failed');
  };
  interface NavItem {
    title: string;
    options: ProjectOption[];
  }

  const [navStack, setNavStack] = useState<NavItem[]>([{ title: 'Project Type', options: PROJECT_TYPES }]);
  const [customReq, setCustomReq] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [recommendations, setRecommendations] = useState<Selection[]>([]);
  const [generatedResult, setGeneratedResult] = useState<{ id: string, prompt: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'prompt' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstantPreviewOpen, setIsInstantPreviewOpen] = useState(false);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [systemPrompt, setSystemPrompt] = useState(ARCHITECT_SYSTEM_PROMPT);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const models = data.models.map((m: any) => m.name);
        if (models.length > 0) {
          setOllamaModels(models);
          if (!models.includes(selectedModel)) {
            setSelectedModel(models[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch Ollama models. Is Ollama running?', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [ollamaUrl]);

  // Parse URL for prompt ID on mount
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 4 && pathParts[1] === 'v1' && pathParts[2] === 'prompt') {
      const promptId = pathParts[3];
      loadPromptFromStorage(promptId);
    }
  }, []);

  const loadPromptFromStorage = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`);
      if (response.ok) {
        const data = await response.json();
        setSelections(data.selections || []);
        setGeneratedResult({ id: data.id, prompt: data.prompt });
        setSelectedModel(data.selectedModel || DEFAULT_MODELS[0]);
      } else {
        console.error('Prompt not found on server');
      }
    } catch (error) {
      console.error('Failed to load prompt from server:', error);
    }
  };

  const savePromptToStorage = async (promptId: string, data: any) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promptId,
          prompt: data.generatedResult?.prompt,
          selections: data.selections,
          selectedModel: data.selectedModel,
          timestamp: data.timestamp
        })
      });
      
      if (response.ok) {
        console.log('Prompt saved to server successfully');
      } else {
        console.error('Failed to save prompt to server');
      }
    } catch (error) {
      console.error('Failed to save prompt to server:', error);
    }
  };

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const currentNav = navStack[navStack.length - 1];
  const currentOptions = currentNav.options;

  const handleOptionClick = (option: ProjectOption, categoryOverride?: string) => {
    if (option.features) {
      setNavStack([...navStack, { title: option.label, options: option.features }]);
    } else {
      const normalizedLabel = normalize(option.label);
      const alreadyExists = selections.find(s =>
        s.id === option.id || normalize(s.label) === normalizedLabel
      );

      if (alreadyExists) {
        removeSelection(alreadyExists.id);
      } else {
        const category = categoryOverride || (currentNav.title === 'Project Type' ? 'Platform' : currentNav.title);
        const newSelection = { id: option.id, category: category, label: option.label, description: option.description };
        setSelections(prev => [...prev, newSelection]);

        setRecommendations(prev => prev.filter(r =>
          r.id !== option.id && normalize(r.label) !== normalizedLabel
        ));

        const rec = RECOMMENDATIONS_MAP[option.id];
        if (rec) {
          const normalizedRecLabel = normalize(rec.label);
          const isAlreadyInSelections = selections.find(s =>
            s.id === rec.id || normalize(s.label) === normalizedRecLabel
          );
          const isAlreadyInRecommendations = recommendations.find(r =>
            r.id === rec.id || normalize(r.label) === normalizedRecLabel
          );

          if (!isAlreadyInSelections && !isAlreadyInRecommendations) {
            setRecommendations(prev => [...prev, rec]);
          }
        }
      }
    }
  };

  const acceptRecommendation = (rec: Selection) => {
    const normalizedLabel = normalize(rec.label);
    setSelections(prev => {
      const exists = prev.find(s => s.id === rec.id || normalize(s.label) === normalizedLabel);
      if (!exists) {
        return [...prev, { ...rec, category: 'Tech' }];
      }
      return prev;
    });
    setRecommendations(prev => prev.filter(r => r.id !== rec.id && normalize(r.label) !== normalizedLabel));
  };

  const goBack = () => {
    if (navStack.length > 1) {
      setNavStack(navStack.slice(0, -1));
    }
  };

  const addCustom = () => {
    const trimmed = customReq.trim();
    if (trimmed) {
      const normalizedLabel = normalize(trimmed);
      const isDuplicate = selections.find(s => normalize(s.label) === normalizedLabel);

      if (!isDuplicate) {
        setSelections(prev => [...prev, { id: `c-${Date.now()}`, category: 'Custom', label: trimmed }]);
        setRecommendations(prev => prev.filter(r => normalize(r.label) !== normalizedLabel));
      }
      setCustomReq('');
    }
  };

  const removeSelection = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const removeRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleAutoSelect = async () => {
    setIsAutoSelecting(true);
    try {
      console.log('Getting AI-powered tech stack recommendations...');
      
      const response = await fetchWithRetry('/api/auto-select-stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }

      const aiRecommendations = await response.json();
      
      if (!Array.isArray(aiRecommendations)) {
        throw new Error('Invalid response format from AI');
      }

      console.log(`AI recommended ${aiRecommendations.length} tech stack options`);

      // Apply AI recommendations
      setSelections(prev => {
        const newSelections = [...prev];
        aiRecommendations.forEach(item => {
          const normalizedLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const exists = newSelections.find(s =>
            s.id === item.id || s.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedLabel
          );
          if (!exists) {
            newSelections.push(item);
          }
        });
        return newSelections;
      });

      // Clear recommendations that are now in the stack
      setRecommendations(prev => prev.filter(r =>
        !aiRecommendations.some(s => s.id === r.id || s.label.toLowerCase() === r.label.toLowerCase())
      ));

    } catch (error) {
      console.error('AI tech stack selection failed, using fallback:', error);
      
      // Fallback to logic-based selection
      const hasGoal = (keywords: string[]) =>
        selections.some(s => keywords.some(k => s.label.toLowerCase().includes(k.toLowerCase())));

      const isGame = hasGoal(['game', 'quest', 'rpg', 'mmo', 'play', 'unity', 'engine', 'steam']) ||
        selections.some(s => s.category === 'Game Mechanics & Feel');

      const isMobile = hasGoal(['mobile', 'app', 'ios', 'android', 'phone', 'touch', 'native']) ||
        selections.some(s => s.id === 'mobile');

      let stack = [];

      if (isGame) {
        stack = [
          { id: 'game', label: 'Game', category: 'Platform' },
          { id: 'phaser', label: 'Phaser (Web)', category: 'Game' },
          { id: 'physics', label: 'Physics Engine', category: 'Game Systems' },
          { id: 'save_system', label: 'Save System', category: 'Game Systems' }
        ];
      } else if (isMobile) {
        stack = [
          { id: 'mobile', label: 'Mobile App', category: 'Platform' },
          { id: 'rn', label: 'React Native', category: 'Mobile App' },
          { id: 'expo', label: 'Expo', category: 'Mobile App' },
          { id: 'push', label: 'Push Notifications', category: 'Native Features' },
          { id: 'supabase', label: 'Supabase', category: 'Database / Storage' },
          { id: 'tailwind', label: 'Tailwind CSS', category: 'UI & Styling' }
        ];
      } else {
        stack = [
          { id: 'web', label: 'Web Application', category: 'Platform' },
          { id: 'nextjs', label: 'Next.js', category: 'Frontend Framework' },
          { id: 'typescript', label: 'TypeScript', category: 'Frontend Framework' },
          { id: 'node', label: 'Node.js / Express', category: 'Backend & API' },
          { id: 'supabase', label: 'Supabase', category: 'Database / Storage' },
          { id: 'tailwind', label: 'Tailwind CSS', category: 'UI & Styling' },
          { id: 'lucide', label: 'Lucide Icons', category: 'UI & Styling' },
          { id: 'framer', label: 'Framer Motion', category: 'UI & Styling' }
        ];
      }

      // Apply fallback stack
      setSelections(prev => {
        const newSelections = [...prev];
        stack.forEach(item => {
          const normalizedLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const exists = newSelections.find(s =>
            s.id === item.id || s.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedLabel
          );
          if (!exists) {
            newSelections.push(item);
          }
        });
        return newSelections;
      });

      setRecommendations(prev => prev.filter(r =>
        !stack.some(s => s.id === r.id || s.label.toLowerCase() === r.label.toLowerCase())
      ));
    } finally {
      setIsAutoSelecting(false);
    }
  };

  const generatedJson = useMemo(() => {
    return JSON.stringify({
      projectName: "Mega Prompt Project",
      timestamp: new Date().toISOString(),
      model: selectedModel,
      requirements: selections.map(s => ({ 
        type: s.category, 
        value: s.label,
        description: s.description 
      })),
      config: {
        theme: "modern",
        responsive: true,
        ai_powered: true
      }
    }, null, 2);
  }, [selections, selectedModel]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newId = Math.random().toString(36).substring(2, 10);

    // Group selections by category for a cleaner prompt
    const categories = Array.from(new Set(selections.map(s => s.category)));
    const techSummary = selections.map(s => s.label).join(', ');
    const extraGuidance = selections.filter(s => s.category === 'Custom').map(s => s.label).join('\n- ');

    const formattedCategories = categories
      .filter(cat => cat !== 'Custom')
      .map(cat => {
        const items = selections.filter(s => s.category === cat).map(s => `- ${s.label}`).join('\n');
        return `#### ${cat}\n${items}`;
      }).join('\n\n');

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Create a Master "Mega Prompt" for a software project. This Mega Prompt will be used to instruct a high-end AI agent (like Ralph or Goose) to build the system.

[TECHNICAL SPECIFICATION JSON]
Include this exact JSON inside the final Mega Prompt as a <specification> block:
${generatedJson}

[PROJECT COMPONENTS]
${formattedCategories}

${extraGuidance ? `[EXTRA GUIDANCE]\n${extraGuidance}` : ''}

[OUTPUT REQUIREMENTS]
1. Generate a comprehensive, Ralph-Loop friendly PRD.md section.
2. Include a baseline agents.md structure for institutional memory.
3. Your response must be ONLY the Mega Prompt itself. Start immediately with the title of the project blueprint. No preamble, no "Sure, here is your prompt", no talk about the process. JUST THE PROMPT.`
            }
          ],
          stream: false
        })
      });

      if (!response.ok) throw new Error('Failed to connect to Ollama');

      const data = await response.json();
      let aiResponse = data.message?.content || '';

      // Clean up response
      aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, ''); // Remove thinking
      aiResponse = aiResponse.replace(/^(Certainly!|Here's|Sure|Okay)[\s\S]*?\n\n/i, ''); // Remove conversational starters
      aiResponse = aiResponse.trim();

      if (!aiResponse) throw new Error('Empty response from AI');

      setGeneratedResult({
        id: newId,
        prompt: aiResponse
      });

      // Save to server storage
      await savePromptToStorage(newId, {
        selections,
        generatedResult: { id: newId, prompt: aiResponse },
        selectedModel,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('AI Generation failed, using technical fallback:', err);

      const finalMegaPrompt = `
# SYSTEM OVERVIEW: MASTER ARCHITECT BLUEPRINT
## Reference ID: MP-${newId.toUpperCase()}

### 1. MISSION STATEMENT
Build a highly scalable and performant application leveraging a modern stack including: ${techSummary}. 
Focus on modularity, security, and developer experience.

### 2. RALPH-LOOP PRD.MD (TASK BACKLOG)
- Task 1: Scaffolding and Infrastructure setup.
- Task 2: Core Business Logic implementation.
- Task 3: UI/UX Component development.
- Task 4: Integration and E2E Testing.

### 3. INSTITUTIONAL MEMORY (AGENTS.MD)
- **Convention**: Use functional components with Tailwind CSS.
- **Pattern**: Unidirectional data flow via strictly typed interfaces.
- **Rule**: All state must be localized or managed via optimized stores.

### 4. PROJECT SPECIFICATION (JSON)
\`\`\`json
${generatedJson}
\`\`\`

### 5. PROJECT COMPOSITION & ARCHITECTURE
${formattedCategories}

${extraGuidance ? `### 6. EXTRA GUIDANCE & SPECIFIC REQUIREMENTS\n- ${extraGuidance}\n` : ''}

### 7. ARCHITECTURAL PATTERNS
- **Design System**: Atomic Design principles with high-fidelity components.
- **State Management**: Distributed state with optimized reactivity.
- **Data Flow**: Unidirectional data binding with strictly typed interfaces.

### 8. IMPLEMENTATION ROADMAP (FOR RALPH/GOOSE)
1. **Scaffolding**: Initialize project with requested dependencies.
2. **Infrastructure**: Setup baseline configuration and type safety.
3. **Core Logic**: Build primary services and data models.
4. **Integration**: Connect components and verify cross-functional logic.

---
*Generated by Mega Prompter Engine v1.0 (Ralph-Loop Fallback Mode)*
*Target Model: ${selectedModel}*
      `.trim();

      setGeneratedResult({
        id: newId,
        prompt: finalMegaPrompt
      });

      // Save to server storage
      await savePromptToStorage(newId, {
        selections,
        generatedResult: { id: newId, prompt: finalMegaPrompt },
        selectedModel,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestart = () => {
    setSelections([]);
    setNavStack([{ title: 'Project Type', options: PROJECT_TYPES }]);
    setCustomReq('');
    setRecommendations([]);
    setGeneratedResult(null);
    setCopiedField(null);
    setIsRestartConfirmOpen(false);
  };

  const copyToClipboard = (text: string, field: 'url' | 'prompt') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openInstantPreview = () => {
    setIsInstantPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-20">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 flex flex-col gap-8">
        <Header
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          ollamaModels={ollamaModels}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRestart={() => setIsRestartConfirmOpen(true)}
        />

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <ProjectBuilder
            navStack={navStack}
            goBack={goBack}
            currentOptions={currentOptions}
            handleOptionClick={handleOptionClick}
            customReq={customReq}
            setCustomReq={setCustomReq}
            addCustom={addCustom}
            selections={selections}
            onAutoSelect={handleAutoSelect}
            isAutoSelecting={isAutoSelecting}
          />

          <div className="lg:col-span-5 flex flex-col gap-8">
            <ProjectRequirements
              selections={selections}
              recommendations={recommendations}
              removeSelection={removeSelection}
              acceptRecommendation={acceptRecommendation}
              removeRecommendation={removeRecommendation}
            />

            <Preview
              generatedResult={generatedResult}
              generatedJson={generatedJson}
              isGenerating={isGenerating}
              selections={selections}
              handleGenerate={handleGenerate}
              setGeneratedResult={setGeneratedResult}
              copyToClipboard={copyToClipboard}
              copiedField={copiedField}
              openInstantPreview={openInstantPreview}
            />
          </div>
        </main>

        <Footer />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ollamaUrl={ollamaUrl}
        setOllamaUrl={setOllamaUrl}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        onRefreshModels={fetchModels}
      />

      <InstantPreview
        selections={selections}
        isOpen={isInstantPreviewOpen}
        onClose={() => setIsInstantPreviewOpen(false)}
      />

      {/* Restart Confirmation Modal */}
      {isRestartConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Restart Mega Prompter?</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to restart? This will clear all your current selections and generated content,
              but will preserve any cached results from the crawler.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsRestartConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-white font-medium"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
