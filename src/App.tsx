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
  interface NavItem {
    title: string;
    options: ProjectOption[];
  }

  const [navStack, setNavStack] = useState<NavItem[]>([{ title: 'Project Type', options: PROJECT_TYPES }]);
  const [customReq, setCustomReq] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Selection[]>([]);
  const [generatedResult, setGeneratedResult] = useState<{ id: string, prompt: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'prompt' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstantPreviewOpen, setIsInstantPreviewOpen] = useState(false);
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

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const currentNav = navStack[navStack.length - 1];
  const currentOptions = currentNav.options;

  const handleOptionClick = (option: ProjectOption) => {
    if (option.subOptions) {
      setNavStack([...navStack, { title: option.label, options: option.subOptions }]);
    } else {
      const normalizedLabel = normalize(option.label);
      const alreadyExists = selections.find(s =>
        s.id === option.id || normalize(s.label) === normalizedLabel
      );

      if (!alreadyExists) {
        // Use the current category title (e.g., "Frontend Framework") property
        const category = currentNav.title === 'Project Type' ? 'Platform' : currentNav.title;
        const newSelection = { id: option.id, category: category, label: option.label };
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

  const generatedJson = useMemo(() => {
    return JSON.stringify({
      projectName: "Mega Prompt Project",
      timestamp: new Date().toISOString(),
      model: selectedModel,
      requirements: selections.map(s => ({ type: s.category, value: s.label })),
      config: {
        theme: "modern",
        responsive: true,
        ai_powered: true
      }
    }, null, 2);
  }, [selections, selectedModel]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2500));

    const newId = Math.random().toString(36).substring(2, 10);

    // Group selections by category for a cleaner prompt
    const categories = Array.from(new Set(selections.map(s => s.category)));
    const techSummary = selections.map(s => s.label).join(', ');
    const customDirectives = selections.filter(s => s.category === 'Custom').map(s => s.label).join('\n- ');

    const formattedCategories = categories
      .filter(cat => cat !== 'Custom')
      .map(cat => {
        const items = selections.filter(s => s.category === cat).map(s => `- ${s.label}`).join('\n');
        return `#### ${cat}\n${items}`;
      }).join('\n\n');

    const finalMegaPrompt = `
${systemPrompt}

# SYSTEM OVERVIEW: MASTER ARCHITECT BLUEPRINT
## Reference ID: MP-${newId.toUpperCase()}

### 1. MISSION STATEMENT
Build a highly scalable and performant application leveraging a modern stack including: ${techSummary}. 
Focus on modularity, security, and developer experience.

### 2. PROJECT COMPOSITION & ARCHITECTURE
${formattedCategories}

${customDirectives ? `### 3. CUSTOM DIRECTIVES & SPECIFIC REQUIREMENTS\n- ${customDirectives}\n` : ''}

### 4. ARCHITECTURAL PATTERNS
- **Design System**: Atomic Design principles with high-fidelity components.
- **State Management**: Distributed state with optimized reactivity.
- **Data Flow**: Unidirectional data binding with strictly typed interfaces.

### 4. CORE MODULES & LOGIC
${customDirectives ? `#### CUSTOM DIRECTIVES:\n- ${customDirectives}\n` : ''}
- **Module A (Core)**: Handles business logic orchestration.
- **Module B (UI)**: Manages layout consistency and responsiveness.
- **Module C (Data)**: Abstracted interface for storage/API interactions.

### 5. IMPLEMENTATION ROADMAP
1. **Scaffolding**: Initialize project with requested dependencies.
2. **Infrastructure**: Setup baseline configuration and type safety.
3. **Core Logic**: Build primary services and data models.
4. **Integration**: Connect components and verify cross-functional logic.

---
*Generated by Mega Prompts Engine v1.0 using ${selectedModel}*
*Target Model: Agnostic / Universal Context*
    `.trim();

    setGeneratedResult({
      id: newId,
      prompt: finalMegaPrompt
    });
    setIsGenerating(false);
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
    </div>
  )
}

export default App
