import { X, Server, MessageSquare, RefreshCw, Cpu, Zap, Thermometer, Database } from 'lucide-react'
import { useState } from 'react';
import type { AIModelSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lmStudioUrl: string;
    setLmStudioUrl: (url: string) => void;
    systemPrompt: string;
    setSystemPrompt: (prompt: string) => void;
    onRefreshModels: () => void;
    aiModelSettings: AIModelSettings;
    setAiModelSettings: (settings: AIModelSettings) => void;
}

export const SettingsModal = ({
    isOpen,
    onClose,
    lmStudioUrl,
    setLmStudioUrl,
    systemPrompt,
    setSystemPrompt,
    onRefreshModels,
    aiModelSettings,
    setAiModelSettings
}: SettingsModalProps) => {
    const [localUrl, setLocalUrl] = useState(lmStudioUrl);
    const [localPrompt, setLocalPrompt] = useState(systemPrompt);
    const [localAiSettings, setLocalAiSettings] = useState(aiModelSettings);

    if (!isOpen) return null;

    const handleSave = () => {
        setLmStudioUrl(localUrl);
        setSystemPrompt(localPrompt);
        setAiModelSettings(localAiSettings);
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
            <div className="relative glass-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-8 flex-1 overflow-y-auto">
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
                    {/* LM Studio URL */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                                <Server className="w-4 h-4" />
                                LM Studio Base URL
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
                            placeholder="http://localhost:1234"
                        />
                        <p className="text-[11px] text-muted-foreground italic">
                            The endpoint where your local LM Studio instance is running. Usually http://localhost:1234.
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

                    {/* AI Model Settings */}
                    <div className="space-y-6">
                        <label className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            AI Model Configuration
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Context Window */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Database className="w-3 h-3" />
                                    Context Window
                                </label>
                                <input
                                    type="number"
                                    value={localAiSettings.contextWindow}
                                    onChange={(e) => setLocalAiSettings(prev => ({
                                        ...prev,
                                        contextWindow: parseInt(e.target.value) || 4096
                                    }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    min="1024"
                                    max="128000"
                                    step="1024"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Maximum context size (tokens). Higher values allow longer conversations.
                                </p>
                            </div>

                            {/* Max Tokens */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Max Response Tokens
                                </label>
                                <input
                                    type="number"
                                    value={localAiSettings.maxTokens}
                                    onChange={(e) => setLocalAiSettings(prev => ({
                                        ...prev,
                                        maxTokens: parseInt(e.target.value) || 2048
                                    }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    min="256"
                                    max="8192"
                                    step="256"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Maximum tokens in AI response. Controls response length.
                                </p>
                            </div>

                            {/* Temperature */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Thermometer className="w-3 h-3" />
                                    Temperature
                                </label>
                                <input
                                    type="number"
                                    value={localAiSettings.temperature}
                                    onChange={(e) => setLocalAiSettings(prev => ({
                                        ...prev,
                                        temperature: parseFloat(e.target.value) || 0.7
                                    }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Controls randomness. 0 = focused, 1+ = creative.
                                </p>
                            </div>

                            {/* Quantization Method */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">
                                    Quantization Method
                                </label>
                                <select
                                    value={localAiSettings.quantizationMethod}
                                    onChange={(e) => setLocalAiSettings(prev => ({
                                        ...prev,
                                        quantizationMethod: e.target.value as AIModelSettings['quantizationMethod']
                                    }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                >
                                    <option className="text-black" value="none">None (Full Precision)</option>
                                    <option className="text-black" value="q8_0">Q8_0 (8-bit)</option>
                                    <option className="text-black" value="q6_k">Q6_K (6-bit)</option>
                                    <option className="text-black" value="q5_k">Q5_K (5-bit)</option>
                                    <option className="text-black" value="q5_0">Q5_0 (5-bit)</option>
                                    <option className="text-black" value="q4_k">Q4_K (4-bit)</option>
                                    <option className="text-black" value="q4_0">Q4_0 (4-bit)</option>
                                    <option className="text-black" value="q3_k">Q3_K (3-bit)</option>
                                    <option className="text-black" value="q2_k">Q2_K (2-bit)</option>
                                </select>
                                <p className="text-[10px] text-muted-foreground">
                                    Model compression. Lower = smaller size, less accuracy.
                                </p>
                            </div>
                        </div>

                        {/* Flash Attention */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-primary" />
                                <div>
                                    <label className="text-sm font-medium text-white/80">
                                        Flash Attention
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">
                                        Optimizes attention mechanism for better performance
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLocalAiSettings(prev => ({
                                    ...prev,
                                    flashAttention: !prev.flashAttention
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    localAiSettings.flashAttention ? 'bg-primary' : 'bg-white/20'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        localAiSettings.flashAttention ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
                </div>

                <div className="flex gap-4 mt-4 p-8 pt-0">
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
