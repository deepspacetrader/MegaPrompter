import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProjectOption, Selection } from '../types'
import { PROJECT_IDEATION } from '../constants'
import { Compass, Undo2, ChevronLeft, ChevronRight, Plus, Sparkles, Check, X, Database, NotebookPen, Brain, Goal } from 'lucide-react'
import { useCacheCheck } from '../hooks/useCacheCheck'

interface ProjectBuilderProps {
    navStack: { title: string; options: ProjectOption[] }[];
    goBack: () => void;
    currentOptions: ProjectOption[];
    handleOptionClick: (option: ProjectOption, category?: string) => void;
    customReq: string;
    setCustomReq: (val: string) => void;
    addCustom: () => void;
    selections: Selection[];
    onAutoSelect: () => void;
    isAutoSelecting?: boolean;
}

export const ProjectBuilder = ({
    navStack,
    goBack,
    currentOptions,
    handleOptionClick,
    customReq,
    setCustomReq,
    addCustom,
    selections,
    onAutoSelect,
    isAutoSelecting = false
}: ProjectBuilderProps) => {
    const [otherValueScope, setOtherValueScope] = useState('');
    const [isOtherActiveScope, setIsOtherActiveScope] = useState(false);
    const [otherValueIdeation, setOtherValueIdeation] = useState('');
    const [isOtherActiveIdeation, setIsOtherActiveIdeation] = useState(false);
    const [ideationStack, setIdeationStack] = useState<{ title: string; options: ProjectOption[] }[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const { useCache, setUseCache } = useCacheCheck();

    // Retry utility for API calls
    const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: AbortSignal.timeout(60000) // 60 second timeout for trends
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

    const fetchLiveTrends = async () => {
        setIsSyncing(true);
        try {
            const url = `/api/trends${!useCache ? '?force=true' : ''}`;
            const response = await fetchWithRetry(url);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setIdeationStack([{ title: 'Live Trending Tech', options: data }]);
                } else {
                    console.error('Invalid trending data format:', data);
                }
            }
        } catch (error) {
            console.error('Failed to sync trends:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isSelected = (opt: ProjectOption) => {
        return selections.some(s => s.id === opt.id || normalize(s.label) === normalize(opt.label));
    };

    const currentNav = navStack[navStack.length - 1];
    const currentTitle = currentNav.title;
    const displayTitle = currentTitle === 'Project Type' ? 'Define Scope' : currentTitle;

    const activeExclusiveOption = useMemo(() =>
        currentOptions.find(o => o.exclusive && isSelected(o)),
        [currentOptions, selections]);

    const getRecursiveSelectedCount = (opt: ProjectOption): number => {
        let count = isSelected(opt) ? 1 : 0;
        if (opt.features) {
            opt.features.forEach(sub => {
                count += getRecursiveSelectedCount(sub);
            });
        }
        return count;
    };

    const handleOtherSubmitScope = () => {
        if (otherValueScope.trim()) {
            handleOptionClick({
                id: `other-${Date.now()}`,
                label: otherValueScope.trim()
            });
            setOtherValueScope('');
            setIsOtherActiveScope(false);
        }
    };

    const handleOtherSubmitIdeation = () => {
        if (otherValueIdeation.trim()) {
            const currentIdeation = ideationStack[ideationStack.length - 1];
            handleOptionClick({
                id: `other-ideation-${Date.now()}`,
                label: otherValueIdeation.trim()
            }, currentIdeation.title);
            setOtherValueIdeation('');
            setIsOtherActiveIdeation(false);
        }
    };

    const relevantIdeation = useMemo(() => {
        let options = [...PROJECT_IDEATION];
        const hasGame = selections.some(s => s.id === 'game' || s.category === 'Game' || s.label === 'Game');
        const hasWeb = selections.some(s => s.id === 'web' || s.id === 'frontend' || s.category === 'Web Application' || s.label === 'Web Application');

        return options.filter(opt => {
            if (opt.id === 'game_deep_dive') return hasGame;
            if (opt.id === 'web_deep_dive') return hasWeb;
            return true;
        });
    }, [selections]);

    const totalCustomDirectives = useMemo(() => {
        const filtered = selections.filter(s => {
            if (s.category === 'Custom') return true;
            
            // Check if category matches any PROJECT_IDEATION option or its sub-options
            return PROJECT_IDEATION.some(p => {
                if (p.label === s.category) return true;
                if (p.features) {
                    return p.features.some(sub => sub.label === s.category);
                }
                return false;
            });
        });
        
        // Debug logging to help identify the issue
        console.log('Selections:', selections);
        console.log('Filtered selections for directives:', filtered);
        console.log('Total custom directives:', filtered.length);
        
        return filtered.length;
    }, [selections]);

    return (
        <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Goals & Purpose - Now FIRST */}
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="step-1 text-lg font-semibold flex items-center gap-3">
                        <Compass className="w-6 h-6 text-primary" />
                        <span className="flex items-center gap-2">
                            Goals & Purpose
                            {totalCustomDirectives > 0 && (
                                <div className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20 animate-in zoom-in">
                                    {totalCustomDirectives}
                                </div>
                            )}
                        </span>
                    </h3>
                    <span className="text-xs text-center text-muted-foreground/60 tracking-widest font-bold">
                         Choose a path to start building your project
                    </span>

                    {ideationStack.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIdeationStack(prev => prev.slice(0, -1));
                                    setIsOtherActiveIdeation(false);
                                    setOtherValueIdeation('');
                                }}
                                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg glass-card hover:bg-white/10 transition-all font-medium text-muted-foreground"
                            >
                                <Undo2 className="w-3 h-3" />
                                Back
                            </button>
                            {/* <button
                                onClick={() => {
                                    setIdeationStack([]);
                                    setIsOtherActiveIdeation(false);
                                    setOtherValueIdeation('');
                                }}
                                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all font-semibold border border-emerald-500/20"
                            >
                                Done
                            </button> */}
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {ideationStack.length > 0 ? (
                        <>
                            {/* Show parent description when viewing sub-options */}
                            {ideationStack.length > 1 && (() => {
                                const parentStack = ideationStack[ideationStack.length - 2];
                                const parentOption = parentStack.options.find(opt => opt.label === ideationStack[ideationStack.length - 1].title);
                                return parentOption?.description ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/10"
                                    >
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {parentOption.description}
                                        </p>
                                    </motion.div>
                                ) : null;
                            })()}
                            
                            <motion.div
                                key="ideation-flow"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            >
                            {ideationStack[ideationStack.length - 1].options.map((opt: ProjectOption) => {
                                const active = isSelected(opt);
                                const selectedCount = getRecursiveSelectedCount(opt);
                                return (
                                    <motion.button
                                        key={opt.id}
                                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (opt.features) {
                                                setIdeationStack([...ideationStack, { title: opt.label, options: opt.features }]);
                                            } else {
                                                handleOptionClick(opt, ideationStack[ideationStack.length - 1].title);
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-left border ${active
                                            ? 'bg-primary/10 border-primary/40'
                                            : 'glass-card border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        {opt.icon && <div className="p-2 bg-white/5 rounded-xl">{opt.icon}</div>}
                                        {!opt.icon && <div className="w-1.5 h-1.5 rounded-full bg-primary/60 ml-2" />}
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-white/80'}`}>
                                                {opt.label}
                                            </span>
                                            {opt.description && (
                                                <span className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                                                    {opt.description}
                                                </span>
                                            )}
                                            {opt.features && (
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">
                                                    {opt.features.length} more
                                                </span>
                                            )}
                                        </div>
                                        {selectedCount > 0 && !active && (
                                            <div className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center ml-auto">
                                                {selectedCount}
                                            </div>
                                        )}
                                        {opt.features && !selectedCount && <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />}
                                        {active && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                    </motion.button>
                                );
                            })}
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative flex items-center justify-between rounded-2xl transition-all border ${isOtherActiveIdeation
                                    ? 'col-span-full bg-primary/5 border-primary/30 p-2'
                                    : 'glass-card hover:bg-white/[0.06] border-white/5 p-4 cursor-pointer'
                                    }`}
                                onClick={() => !isOtherActiveIdeation && setIsOtherActiveIdeation(true)}
                            >
                                {isOtherActiveIdeation ? (
                                    <div className="flex items-center gap-3 w-full p-1 animate-in fade-in zoom-in duration-200">
                                        <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={otherValueIdeation}
                                            onChange={(e) => setOtherValueIdeation(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmitIdeation()}
                                            onBlur={() => !otherValueIdeation && setIsOtherActiveIdeation(false)}
                                            placeholder={`Custom ${ideationStack[ideationStack.length - 1].title}...`}
                                            className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-muted-foreground/50"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOtherSubmitIdeation(); }}
                                            className="bg-primary hover:bg-primary/80 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-wider"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="p-2 rounded-xl bg-white/5 text-muted-foreground group-hover:bg-primary/20 transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-sm font-semibold text-muted-foreground">Other / Custom...</span>
                                    </div>
                                )}
                            </motion.div>
                            </motion.div>
                        </>
                    ) : (
                        <motion.div
                            key="split-path"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIdeationStack([{ title: 'Core Vision', options: relevantIdeation }])}
                                    className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-primary/10 transition-all group border border-primary/20 hover:bg-primary/20  flex-1 min-h-[200px] max-h-[200px] max-w-[277px]"
                                >
                                    <div className="p-4 rounded-2xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        <Goal className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-white">I have a clear vision</span>
                                        <span className="text-xs text-primary/60 font-medium italic">Define your specific goals</span>
                                    </div>
                                </motion.button>

                                <div className="text-white/60 font-medium text-sm px-4 py-0 flex items-center justify-center">
                                    or
                                </div>

                                <div className="flex-1 flex flex-col gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={fetchLiveTrends}
                                        disabled={isSyncing}
                                        className={`flex flex-col items-center gap-4 p-8 rounded-3xl transition-all group relative overflow-hidden w-full min-h-[200px] max-h-[200px] min-w-[250px] ${isSyncing
                                            ? 'bg-orange-500/5 border-orange-500/20 cursor-wait'
                                            : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'}`}
                                    >
                                        {isSyncing && (
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '100%' }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"
                                            />
                                        )}
                                        <div className={`p-4 rounded-2xl bg-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform ${isSyncing ? 'animate-pulse' : ''}`}>
                                            <Brain className="w-8 h-8" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <span className="block text-sm font-bold text-white">
                                                {isSyncing ? 'The AI is Working...' : 'Generate Ideas With AI'}
                                            </span>
                                            <span className="text-xs text-orange-400/60 font-medium italic">
                                                {isSyncing ? 'Transmuting X, GitHub & News...' : 'Synthesize viral trends into products'}
                                            </span>
                                        </div>
                                    </motion.button>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="self-end"
                                    >
                                        <button
                                            onClick={() => setUseCache(!useCache)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${useCache
                                                ? 'bg-white/5 border-white/10 text-white/40'
                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                }`}
                                        >
                                            <Database className={`w-4 h-4 ${useCache ? 'animate-pulse' : ''}`} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                {useCache ? 'Read from Cache' : 'Download Fresh Data'}
                                            </span>
                                        </button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Define Scope - Now SECOND */}
            <div className="glass-card rounded-3xl p-8 min-h-[480px] flex flex-col gap-8 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <h2 className="step-2 text-xl font-semibold flex items-center gap-3">
                        <NotebookPen className="w-6 h-6 text-primary" />
                        {displayTitle}
                    </h2>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-center text-muted-foreground/60 tracking-widest font-bold">
                            Click to add whatever you'd like
                        </span>
                        {navStack.length > 1 && (
                            <button
                                onClick={() => {
                                    setIsOtherActiveScope(false);
                                    setOtherValueScope('');
                                    goBack();
                                }}
                                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all font-medium text-muted-foreground"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {currentOptions.map((opt) => {
                            const selected = isSelected(opt);
                            const isIrrelevant = activeExclusiveOption && !selected && opt.exclusive;
                            const selectedCount = getRecursiveSelectedCount(opt);

                            return (
                                <motion.button
                                    key={opt.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={!isIrrelevant ? { scale: 1.02 } : { scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOptionClick(opt)}
                                    className={`flex items-center justify-between p-5 rounded-2xl transition-all group border ${selected
                                        ? 'bg-primary/10 border-primary/40 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                        : isIrrelevant
                                            ? 'glass-card border-white/5 opacity-40 hover:opacity-60 grayscale-[0.5] cursor-pointer'
                                            : 'glass-card hover:bg-white/[0.06] border-white/5 cursor-pointer hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {opt.icon ? (
                                            <div className={`p-2.5 rounded-xl transition-colors ${selected
                                                ? 'bg-primary/20 text-primary'
                                                : isIrrelevant
                                                    ? 'bg-white/5 text-muted-foreground'
                                                    : 'bg-white/5 group-hover:bg-primary/20 text-white'
                                                }`}>
                                                {opt.icon}
                                            </div>
                                        ) : (
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] ${selected
                                                ? 'bg-primary'
                                                : isIrrelevant
                                                    ? 'bg-muted'
                                                    : 'bg-primary'
                                                }`} />
                                        )}
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold transition-colors ${selected
                                                    ? 'text-primary'
                                                    : isIrrelevant
                                                        ? 'text-muted-foreground'
                                                        : 'text-white/90'
                                                    }`}>
                                                    {opt.label}
                                                </span>
                                                {selectedCount > 0 && !selected && (
                                                    <div className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                                        {selectedCount}
                                                    </div>
                                                )}
                                            </div>
                                            {opt.features && (
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                                                    {opt.features.length} Options
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selected ? (
                                        <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    ) : (
                                        opt.features && <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isIrrelevant ? 'text-muted-foreground/50' : 'text-muted-foreground'
                                            }`} />
                                    )}
                                </motion.button>
                            );
                        })}

                        {navStack.length > 1 && (
                            <motion.div
                                layout
                                key="other-field"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative flex items-center justify-between rounded-2xl transition-all border ${isOtherActiveScope
                                    ? 'col-span-full bg-primary/5 border-primary/30 p-2'
                                    : 'glass-card hover:bg-white/[0.06] border-white/5 p-5 cursor-pointer'
                                    }`}
                                onClick={() => !isOtherActiveScope && setIsOtherActiveScope(true)}
                            >
                                {isOtherActiveScope ? (
                                    <div className="flex items-center gap-3 w-full p-1 animate-in fade-in zoom-in duration-200">
                                        <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={otherValueScope}
                                            onChange={(e) => setOtherValueScope(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmitScope()}
                                            onBlur={() => !otherValueScope && setIsOtherActiveScope(false)}
                                            placeholder={`Custom ${currentTitle}...`}
                                            className="flex-1 bg-transparent border-none focus:outline-none text-white font-medium placeholder:text-muted-foreground/50"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOtherSubmitScope(); }}
                                            className="bg-primary hover:bg-primary/80 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:bg-primary/20 transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-muted-foreground">Other / Custom...</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {currentTitle === 'Project Type' && (
                            <motion.button
                                whileHover={{ scale: isAutoSelecting ? 1 : 1.02 }}
                                whileTap={{ scale: isAutoSelecting ? 1 : 0.98 }}
                                onClick={() => {
                                    console.log('Choose for me button clicked!');
                                    console.log('totalCustomDirectives:', totalCustomDirectives);
                                    console.log('isAutoSelecting:', isAutoSelecting);
                                    
                                    if (totalCustomDirectives === 0) {
                                        console.log('No directives found, guiding user to step 1');
                                        // Guide user to step 1 first - scroll to the main buttons and animate them
                                        const step1Container = document.querySelector('.step-1')?.closest('.glass-card');
                                        step1Container?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        
                                        // Add pulse animation to the main buttons
                                        setTimeout(() => {
                                            const buttons = step1Container?.querySelectorAll('motion-button button');
                                            buttons?.forEach((btn, index) => {
                                                setTimeout(() => {
                                                    btn.classList.add('animate-pulse', 'ring-4', 'ring-orange-400/50');
                                                    setTimeout(() => {
                                                        btn.classList.remove('animate-pulse', 'ring-4', 'ring-orange-400/50');
                                                    }, 2000);
                                                }, index * 200);
                                            });
                                        }, 500);
                                    } else {
                                        console.log('Directives found, calling onAutoSelect');
                                        onAutoSelect();
                                    }
                                }}
                                disabled={isAutoSelecting}
                                className={`flex items-center justify-between p-5 rounded-2xl transition-all group border ${
                                    isAutoSelecting
                                        ? 'bg-orange-500/5 border-orange-500/20 cursor-wait'
                                        : 'bg-orange-500/10 border-orange-500/40 cursor-pointer shadow-[0_0_15px_rgba(251,146,60,0.1)] hover:bg-orange-500/20'
                                }`}
                            >
                                {isAutoSelecting && (
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"
                                    />
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl bg-orange-500/20 text-orange-400 ${isAutoSelecting ? 'animate-pulse' : ''}`}>
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold text-orange-400">
                                            {isAutoSelecting ? 'AI is choosing...' : 'Choose for me'}
                                        </span>
                                        <span className="text-[10px] text-orange-400/60 font-medium uppercase tracking-tighter mt-0.5">
                                            {isAutoSelecting ? 'Analyzing your requirements' : 'AI-powered selection'}
                                        </span>
                                    </div>
                                </div>
                                {!isAutoSelecting && <ChevronRight className="w-4 h-4 text-orange-400 transition-transform group-hover:translate-x-1" />}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 3. Extra Guidance - Same place */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative overflow-hidden duration-500" style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-3">
                        <Plus className="w-6 h-6 text-primary" />
                        Extra Guidance
                    </h3>
                    <span className="text-xs text-center text-muted-foreground/60 tracking-widest font-bold">
                        Add any specific requirements or constraints
                    </span>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-6"
                >
                    {totalCustomDirectives > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <AnimatePresence mode="popLayout">
                                {selections
                                    .filter(s => s.category === 'Custom' || PROJECT_IDEATION.some(p => p.label === s.category))
                                    .map((s) => (
                                        <motion.div
                                            key={s.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 group hover:border-primary/30 transition-all"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-primary/50 font-bold uppercase tracking-widest leading-none mb-1">
                                                    {s.category}
                                                </span>
                                                <span className="text-xs font-medium text-white/90">{s.label}</span>
                                            </div>
                                            <button
                                                onClick={() => handleOptionClick({ id: s.id, label: s.label })}
                                                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={customReq}
                            onChange={(e) => setCustomReq(e.target.value)}
                            placeholder="e.g. Use websockets, Needs dark mode by default, must be GDPR compliant..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && addCustom()}
                        />
                        <button
                            onClick={addCustom}
                            className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            Add
                        </button>
                    </div>
                </motion.div>
            </div>
        </div >
    )
}
