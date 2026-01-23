import { Layers, Trash2, Plus, Sparkles, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Selection } from '../types'

interface ProjectRequirementsProps {
    selections: Selection[];
    recommendations: Selection[];
    removeSelection: (id: string) => void;
    acceptRecommendation: (rec: Selection) => void;
    removeRecommendation: (id: string) => void;
}

export const ProjectRequirements = ({
    selections,
    recommendations,
    removeSelection,
    acceptRecommendation,
    removeRecommendation
}: ProjectRequirementsProps) => {
    return (
        <div className="glass-card rounded-3xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="step-3 text-lg font-bold flex items-center gap-3">
                    <Layers className="w-6 h-6 text-primary" />
                    Project Requirements
                </h2>
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {selections.length} Items
                </div>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {selections.length === 0 && recommendations.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-white/5 rounded-3xl gap-4">
                            <Cpu className="w-12 h-12" />
                            <p className="font-medium">No requirements yet</p>
                        </div>
                    ) : (
                        <>
                            {selections.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-primary font-black uppercase tracking-widest opacity-70 leading-none mb-1">{item.category}</span>
                                        <span className="font-semibold text-sm text-white/80">{item.label}</span>
                                    </div>
                                    <button
                                        onClick={() => removeSelection(item.id)}
                                        className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}

                            {recommendations.map((item) => (
                                <motion.div
                                    key={`rec-${item.id}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        rotate: [0, -1, 1, -1, 1, 0],
                                    }}
                                    transition={{
                                        rotate: {
                                            repeat: Infinity,
                                            duration: 0.5,
                                            repeatDelay: 2
                                        }
                                    }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-dashed border-primary/30 group hover:border-primary/50 transition-all relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <div className="flex flex-col relative z-10">
                                        <span className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            Recommended
                                        </span>
                                        <span className="font-semibold text-sm text-white/90">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <button
                                            onClick={() => acceptRecommendation(item)}
                                            className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/80 transition-all flex items-center gap-1 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-3 h-3" />
                                            ADD
                                        </button>
                                        <button
                                            onClick={() => removeRecommendation(item.id)}
                                            className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
