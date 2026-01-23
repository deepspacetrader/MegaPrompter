import { Code2, ExternalLink, Rocket, Sparkles, Check, Link2, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Selection } from '../types'

interface PreviewProps {
    generatedResult: { id: string, prompt: string } | null;
    generatedJson: string;
    isGenerating: boolean;
    selections: Selection[];
    handleGenerate: () => void;
    setGeneratedResult: (res: { id: string, prompt: string } | null) => void;
    copyToClipboard: (text: string, field: 'url' | 'prompt') => void;
    copiedField: 'url' | 'prompt' | null;
    openInstantPreview: () => void;
}

export const Preview = ({
    generatedResult,
    generatedJson,
    isGenerating,
    selections,
    handleGenerate,
    setGeneratedResult,
    copyToClipboard,
    copiedField,
    openInstantPreview
}: PreviewProps) => {
    if (!generatedResult) {
        return (
            <div className="glass-card rounded-3xl p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="step-4 text-lg font-bold flex items-center gap-3">
                        <Code2 className="w-6 h-6 text-primary" />
                        JSON Preview
                    </h2>
                    <button
                        onClick={openInstantPreview}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                    >
                        Instant Preview
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="relative group">
                    <pre className="p-5 rounded-2xl bg-black/60 text-emerald-400/90 text-xs font-mono h-[240px] overflow-y-auto border border-white/5 custom-scrollbar">
                        {generatedJson}
                    </pre>
                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || selections.length === 0}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${isGenerating || selections.length === 0
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-primary text-white hover:shadow-primary/40 active:scale-[0.98]'
                        }`}
                >
                    {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Rocket className="w-6 h-6" />
                            Create Mega Prompt!
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 flex flex-col gap-6 border-primary/20 bg-primary/[0.02]"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Mega Prompt Ready
                </h2>
                <button
                    onClick={() => setGeneratedResult(null)}
                    className="text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest"
                >
                    Reset
                </button>
            </div>

            <div className="space-y-4">
                {/* API URL */}
                <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">API Endpoint</label>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black/40 rounded-xl px-4 py-3 text-xs font-mono text-primary truncate border border-white/5">
                            http://localhost:5173/v1/prompt/{generatedResult.id}
                        </div>
                        <button
                            onClick={() => copyToClipboard(`http://localhost:5173/v1/prompt/${generatedResult.id}`, 'url')}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-primary"
                        >
                            {copiedField === 'url' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Prompt Text */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Full Prompt</label>
                        <button
                            onClick={() => copyToClipboard(generatedResult.prompt, 'prompt')}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-all"
                        >
                            {copiedField === 'prompt' ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    COPIED
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    COPY PROMPT
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={generatedResult.prompt}
                        className="w-full bg-black/40 rounded-2xl p-4 text-xs font-mono text-white/70 h-[280px] resize-none border border-white/5 focus:outline-none custom-scrollbar"
                    />
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
                <p className="text-[10px] text-muted-foreground text-center italic">
                    Ready for integration. You can fetch this prompt via CURL or copy it directly.
                </p>
                <button
                    onClick={() => window.open(`http://localhost:3001/api/prompts/${generatedResult.id}`, '_blank')}
                    className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    Open in API Explorer
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}
