import { X, Server, MessageSquare, RefreshCw } from 'lucide-react'
import { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ollamaUrl: string;
    setOllamaUrl: (url: string) => void;
    systemPrompt: string;
    setSystemPrompt: (prompt: string) => void;
    onRefreshModels: () => void;
}

export const SettingsModal = ({
    isOpen,
    onClose,
    ollamaUrl,
    setOllamaUrl,
    systemPrompt,
    setSystemPrompt,
    onRefreshModels
}: SettingsModalProps) => {
    const [localUrl, setLocalUrl] = useState(ollamaUrl);
    const [localPrompt, setLocalPrompt] = useState(systemPrompt);

    if (!isOpen) return null;

    const handleSave = () => {
        setOllamaUrl(localUrl);
        setSystemPrompt(localPrompt);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative glass-card w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <Server className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">System Configuration</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Ollama URL */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                                <Server className="w-4 h-4" />
                                Ollama Base URL
                            </label>
                            <button
                                onClick={onRefreshModels}
                                className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Refresh Connection
                            </button>
                        </div>
                        <input
                            type="text"
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                            placeholder="http://localhost:11434"
                        />
                        <p className="text-[11px] text-muted-foreground italic">
                            The endpoint where your local Ollama instance is running. Usually http://localhost:11434.
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Core Architect System Prompt
                        </label>
                        <textarea
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm resize-none scrollbar-hide"
                            placeholder="Define the architect's personality and constraints..."
                        />
                        <p className="text-[11px] text-muted-foreground italic">
                            This prompt defines how the "Mega Prompt" is drafted. It shapes the architectural logic and output density.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] px-6 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                        Apply & Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
