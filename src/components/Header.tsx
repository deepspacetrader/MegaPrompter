import { Rocket, Settings } from 'lucide-react'

interface HeaderProps {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    ollamaModels: string[];
    onOpenSettings: () => void;
}

export const Header = ({ selectedModel, setSelectedModel, ollamaModels, onOpenSettings }: HeaderProps) => {
    return (
        <header className="glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                    <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Mega Prompts
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">Intelligence Architect</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Drafting Agent</span>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    >
                        {ollamaModels.map(m => <option key={m} value={m} className="bg-gray-900 text-white">{m}</option>)}
                    </select>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors"
                >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>
        </header>
    )
}
