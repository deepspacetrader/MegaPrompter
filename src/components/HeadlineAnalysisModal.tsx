interface HeadlineAnalysisModalProps {
  selectedHeadline: {
    original: string
    source: string
    title: string
    analysis: any
    timestamp: string
  } | null
  onClose: () => void
}

export function HeadlineAnalysisModal({ selectedHeadline, onClose }: HeadlineAnalysisModalProps) {
  if (!selectedHeadline) return null

  const getSourceIcon = (source: string) => {
    const icons: { [key: string]: string } = {
      'TechCrunch': '🚀',
      'The Verge': '📱',
      'Wired': '🔬',
      'Hacker News': '👨‍💻',
      'Product Hunt': '🎯',
      'GitHub Trending': '⭐'
    }
    return icons[source] || '📊'
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-background border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Headline Analysis
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center border border-border"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Original Headline */}
          <div className="p-4 bg-background/30 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-2">Original Headline</div>
            <div className="text-sm font-medium text-foreground mb-2">{selectedHeadline.title}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Source:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {getSourceIcon(selectedHeadline.source)}
                {selectedHeadline.source}
              </span>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {selectedHeadline.analysis.categories.map((category: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded-full border border-blue-500/20">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Impact Level</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                selectedHeadline.analysis.impact === 'High' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                selectedHeadline.analysis.impact === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                'bg-green-500/10 text-green-600 border border-green-500/20'
              }`}>
                {selectedHeadline.analysis.impact} Impact
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Trend Strength</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                selectedHeadline.analysis.trendStrength === 'Very Strong' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                selectedHeadline.analysis.trendStrength === 'Strong' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                selectedHeadline.analysis.trendStrength === 'Moderate' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                'bg-gray-500/10 text-gray-600 border border-gray-500/20'
              }`}>
                {selectedHeadline.analysis.trendStrength}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Relevance Score</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500"
                    style={{ width: `${selectedHeadline.analysis.relevance}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-foreground">{selectedHeadline.analysis.relevance}%</span>
              </div>
            </div>
          </div>

          {/* Project Potential */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">💡 Project Potential</h3>
            <div className="space-y-2">
              {selectedHeadline.analysis.projectPotential.map((potential: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gradient-to-r from-primary/5 to-transparent rounded-lg">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className="text-sm text-foreground">{potential}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-2">🤖 AI Insights</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• This trend shows {selectedHeadline.analysis.trendStrength.toLowerCase()} market signals</p>
              <p>• Consider {selectedHeadline.analysis.impact.toLowerCase()} impact opportunities first</p>
              <p>• High relevance score indicates strong project potential</p>
              <p>• Multiple categories suggest cross-industry applications</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors border border-border"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
