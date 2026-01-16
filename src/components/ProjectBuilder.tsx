import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Sparkles, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProjectOption, Selection } from '../types'

interface ProjectBuilderProps {
    navStack: { title: string; options: ProjectOption[] }[];
    goBack: () => void;
    currentOptions: ProjectOption[];
    handleOptionClick: (option: ProjectOption) => void;
    customReq: string;
    setCustomReq: (val: string) => void;
    addCustom: () => void;
    selections: Selection[];
}

export const ProjectBuilder = ({
    navStack,
    goBack,
    currentOptions,
    handleOptionClick,
    customReq,
    setCustomReq,
    addCustom,
    selections
}: ProjectBuilderProps) => {
    const [otherValue, setOtherValue] = useState('');
    const [isOtherActive, setIsOtherActive] = useState(false);

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isSelected = (opt: ProjectOption) => {
        return selections.some(s => s.id === opt.id || normalize(s.label) === normalize(opt.label));
    };

    const currentNav = navStack[navStack.length - 1];
    const currentTitle = currentNav.title;
    const displayTitle = currentTitle === 'Project Type' ? 'Define Scope' : currentTitle;

    const getRecursiveSelectedCount = (opt: ProjectOption): number => {
        let count = isSelected(opt) ? 1 : 0;
        if (opt.subOptions) {
            opt.subOptions.forEach(sub => {
                count += getRecursiveSelectedCount(sub);
            });
        }
        return count;
    };

    const handleOtherSubmit = () => {
        if (otherValue.trim()) {
            handleOptionClick({
                id: `other-${Date.now()}`,
                label: otherValue.trim()
            });
            setOtherValue('');
            setIsOtherActive(false);
        }
    };

    return (
        <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-8 min-h-[480px] flex flex-col gap-8 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        {displayTitle}
                    </h2>
                    {navStack.length > 1 && (
                        <button
                            onClick={() => {
                                setIsOtherActive(false);
                                setOtherValue('');
                                goBack();
                            }}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all font-medium text-muted-foreground"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {(() => {
                            const activeExclusiveOption = currentOptions.find(o => o.exclusive && isSelected(o));
                            const showOther = navStack.length > 1;

                            return (
                                <>
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
                                                whileHover={!selected && !isIrrelevant ? { scale: 1.02 } : { scale: 1.01 }}
                                                whileTap={!selected ? { scale: 0.98 } : {}}
                                                onClick={() => !selected && handleOptionClick(opt)}
                                                className={`flex items-center justify-between p-5 rounded-2xl transition-all group border ${selected
                                                    ? 'bg-primary/10 border-primary/40 cursor-default shadow-[0_0_15px_rgba(139,92,246,0.1)]'
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
                                                        {opt.subOptions && (
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                                                                {opt.subOptions.length} Options
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {selected ? (
                                                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                ) : (
                                                    opt.subOptions && <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isIrrelevant ? 'text-muted-foreground/50' : 'text-muted-foreground'
                                                        }`} />
                                                )}
                                            </motion.button>
                                        );
                                    })}

                                    {showOther && (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`relative flex items-center justify-between rounded-2xl transition-all border ${isOtherActive
                                                ? 'col-span-full bg-primary/5 border-primary/30 p-2'
                                                : 'glass-card hover:bg-white/[0.06] border-white/5 p-5 cursor-pointer'
                                                }`}
                                            onClick={() => !isOtherActive && setIsOtherActive(true)}
                                        >
                                            {isOtherActive ? (
                                                <div className="flex items-center gap-3 w-full p-1 animate-in fade-in zoom-in duration-200">
                                                    <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                                                        <Plus className="w-5 h-5" />
                                                    </div>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={otherValue}
                                                        onChange={(e) => setOtherValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
                                                        onBlur={() => !otherValue && setIsOtherActive(false)}
                                                        placeholder={`Custom ${currentTitle}...`}
                                                        className="flex-1 bg-transparent border-none focus:outline-none text-white font-medium placeholder:text-muted-foreground/50"
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOtherSubmit(); }}
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
                                </>
                            );
                        })()}
                    </AnimatePresence>
                </div>
            </div>

            <div className="glass-card rounded-3xl p-8">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-3">
                    <Plus className="w-6 h-6 text-primary" />
                    Custom Directives
                </h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={customReq}
                        onChange={(e) => setCustomReq(e.target.value)}
                        placeholder="Additional specific requirements..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                        onKeyPress={(e) => e.key === 'Enter' && addCustom()}
                    />
                    <button
                        onClick={addCustom}
                        className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    )
}
