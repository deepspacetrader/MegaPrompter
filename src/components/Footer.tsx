export const Footer = () => {
    return (
        <footer className="pt-12 pb-8 border-t border-white/5 text-center">
            <div className="flex justify-center gap-8 mb-4">
                <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Docs</a>
                <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">API</a>
                <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">GitHub</a>
            </div>
            <p className="text-muted-foreground/40 text-xs">© 2026 Mega Prompts Engine. All rights reserved.</p>
        </footer>
    )
}
