import { useState, useMemo, useEffect } from 'react'
import type { Selection, ProjectOption, AIModelSettings } from './types'
import { PROJECT_TYPES, DEFAULT_MODELS, RECOMMENDATIONS_MAP, ARCHITECT_SYSTEM_PROMPT } from './constants'
import { Header } from './components/Header'
import { Trends } from './components/Trends'
import { TrendsModal } from './components/TrendsModal'
import { HeadlineAnalysisModal } from './components/HeadlineAnalysisModal'
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
  const [lmStudioModels, setLmStudioModels] = useState<string[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [recommendations, setRecommendations] = useState<Selection[]>([]);
  const [generatedResult, setGeneratedResult] = useState<{ id: string, prompt: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'prompt' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstantPreviewOpen, setIsInstantPreviewOpen] = useState(false);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234');
  const [systemPrompt, setSystemPrompt] = useState(ARCHITECT_SYSTEM_PROMPT);
  const [selectedHeadline, setSelectedHeadline] = useState<{
    original: string
    source: string
    title: string
    analysis: any
    timestamp: string
  } | null>(null);
  const [trends, setTrends] = useState<{
    totalSignals: number
    sources: string[]
    sampleHeadlines: string[]
  } | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  // AI Model Settings
  const [aiModelSettings, setAiModelSettings] = useState<AIModelSettings>({
    contextWindow: 4096,
    maxTokens: 2048,
    temperature: 0.7,
    flashAttention: true,
    quantizationMethod: 'q4_k'
  });

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        if (models.length > 0) {
          setLmStudioModels(models);
          // Only change selectedModel if current selection is not available
          if (!models.includes(selectedModel)) {
            setSelectedModel(models[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch LM Studio models. Is LM Studio running?', err);
    }
  };

  const fetchTrends = async (force = false, featuresPerIdea = 4, minIdeas = 5, model = selectedModel) => {
    setIsLoadingTrends(true);
    try {
      const aiSettingsQuery = encodeURIComponent(JSON.stringify(aiModelSettings));
      const cacheParam = force ? '?force=true' : '';
      const featuresParam = featuresPerIdea !== 4 ? (cacheParam ? '&' : '?') + `featuresPerIdea=${featuresPerIdea}` : '';
      const minIdeasParam = minIdeas !== 5 ? (cacheParam || featuresParam ? '&' : '?') + `minIdeas=${minIdeas}` : '';
      const modelParam = (cacheParam || featuresParam || minIdeasParam ? '&' : '?') + `model=${encodeURIComponent(model)}`;
      const url = `/api/trends${cacheParam}${featuresParam}${minIdeasParam}${modelParam}&aiSettings=${aiSettingsQuery}`;
      const response = await fetchWithRetry(url);
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends);
        // Handle the ideas from the response
        const ideas = Array.isArray(data) ? data : data.ideas;
        if (Array.isArray(ideas) && ideas.length > 0) {
          setGeneratedIdeas(ideas);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setIsLoadingTrends(false);
    }
  };

  useEffect(() => {
    fetchModels();
    // fetchTrends(); // Commented out to prevent automatic crawler start on page load
  }, []);

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
        body: JSON.stringify({ selections, model: selectedModel, aiSettings: aiModelSettings })
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
    // Group selections by category to create a cleaner structure
    const features = selections.map(s => s.label);
    const description = selections.length > 0 
      ? `A platform featuring ${selections.slice(0, 3).map(s => s.label).join(', ')}${selections.length > 3 ? ` and ${selections.length - 3} more features` : ''}.`
      : "A customizable software project built with modern technologies.";

    return JSON.stringify({
      projectName: "Mega Prompt Project",
      description: description,
      timestamp: new Date().toISOString(),
      requirements: {
        features: features
      },
      config: {
        theme: "modern",
        responsive: true,
        ai_powered: true
      }
    }, null, 2);
  }, [selections]);

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
      const response = await fetch('http://localhost:1234/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          system_prompt: systemPrompt,
          input: `Create a Master "Mega Prompt" for a software project. This Mega Prompt will be used to instruct a high-end AI agent (like Ralph or Goose) to build the system.

[TECHNICAL SPECIFICATION JSON]
Include this exact JSON inside the final Mega Prompt as a <specification> block:
${generatedJson}

[PROJECT COMPONENTS]
${formattedCategories}

${extraGuidance ? `[EXTRA GUIDANCE]\n${extraGuidance}` : ''}

[OUTPUT REQUIREMENTS]
1. Generate a comprehensive, Ralph-Loop friendly PRD.md section.
2. Include a baseline agents.md structure for institutional memory.
3. Your response must be ONLY the Mega Prompt itself. Start immediately with the title of the project blueprint. No preamble, no "Sure, here is your prompt", no talk about the process. JUST THE PROMPT.`,
          temperature: aiModelSettings.temperature
        })
      });

      if (!response.ok) throw new Error('Failed to connect to LM Studio');

      const data = await response.json();
      let aiResponse = data;

      // LM Studio might return the response directly or in a different structure
      if (typeof aiResponse === 'object' && aiResponse.output && Array.isArray(aiResponse.output)) {
        // Extract content from the output array, prefer non-reasoning content
        const contentItems = aiResponse.output.filter((item: any) => item.type !== 'reasoning');
        if (contentItems.length > 0) {
          aiResponse = contentItems.map((item: any) => item.content).join('');
        } else {
          // Fallback to all content if no non-reasoning items
          aiResponse = aiResponse.output.map((item: any) => item.content).join('');
        }
      } else if (typeof aiResponse === 'object' && aiResponse.content) {
        aiResponse = aiResponse.content;
      } else if (typeof aiResponse === 'object' && aiResponse.response) {
        aiResponse = aiResponse.response;
      } else if (typeof aiResponse === 'object' && aiResponse.message) {
        aiResponse = aiResponse.message;
      } else if (typeof aiResponse !== 'string') {
        aiResponse = JSON.stringify(aiResponse);
      }

      // Clean up response
      aiResponse = aiResponse.replace(/```[\s\S]*?<\/think>/g, ''); // Remove thinking
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
Focus on modularity, security, and performance.

### 2. PROJECT REQUIREMENTS (TASK BACKLOG)
- Task 1: Scaffolding and Infrastructure setup.
- Task 2: Core Business Logic implementation.
- Task 3: UI/UX Component development.
- Task 4: Integration and E2E Testing.

### 3. PROJECT SPECIFICATION (JSON)
\`\`\`json
${generatedJson}
\`\`\`

### 4. PROJECT COMPOSITION & ARCHITECTURE
${formattedCategories}

${extraGuidance ? `### 5. EXTRA GUIDANCE & SPECIFIC REQUIREMENTS\n- ${extraGuidance}\n` : ''}
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
          lmStudioModels={lmStudioModels}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRestart={() => setIsRestartConfirmOpen(true)}
        />

        <Trends trends={trends} isLoading={isLoadingTrends} onAnalyzeHeadline={setSelectedHeadline} onOpenDetailedAnalysis={() => setIsTrendsModalOpen(true)} />

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
            trends={null}
            selectedModel={selectedModel}
            onFetchTrends={fetchTrends}
            generatedIdeas={generatedIdeas}
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
        lmStudioUrl={lmStudioUrl}
        setLmStudioUrl={setLmStudioUrl}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        onRefreshModels={fetchModels}
        aiModelSettings={aiModelSettings}
        setAiModelSettings={setAiModelSettings}
      />

      <InstantPreview
        selections={selections}
        generatedResult={generatedResult}
        generatedJson={generatedJson}
        selectedModel={selectedModel}
        aiModelSettings={aiModelSettings}
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


      {/* Headline Analysis Modal - Rendered at top level for highest z-index */}
      <HeadlineAnalysisModal
        selectedHeadline={selectedHeadline}
        onClose={() => setSelectedHeadline(null)}
      />

      {/* Trends Modal */}
      {isTrendsModalOpen && trends && (
        <TrendsModal
          trends={trends}
          onClose={() => setIsTrendsModalOpen(false)}
        />
      )}
    </div>
  )
}

export default App
