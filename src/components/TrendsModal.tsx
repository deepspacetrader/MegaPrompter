interface TrendsData {
  totalSignals: number
  sources: string[]
  sampleHeadlines: string[]
}

interface TrendsModalProps {
  trends: TrendsData
  onClose: () => void
}

export function TrendsModal({ trends, onClose }: TrendsModalProps) {
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

  const getSourceDescription = (source: string) => {
    const descriptions: { [key: string]: string } = {
      'TechCrunch': 'Latest tech startup news and funding announcements',
      'The Verge': 'Technology and digital culture coverage',
      'Wired': 'Emerging tech and science journalism',
      'Hacker News': 'Community-curated tech discussions',
      'Product Hunt': 'New product launches and discoveries',
      'GitHub Trending': 'Popular open source projects'
    }
    return descriptions[source] || 'Technology news source'
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-background border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Detailed Trend Analysis
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center border border-border"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Analysis Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Analysis Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Signals Processed</span>
                <span className="text-lg font-bold text-primary">{trends.totalSignals}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Active Sources</span>
                <span className="text-lg font-bold text-blue-500">{trends.sources.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Headlines Analyzed</span>
                <span className="text-lg font-bold text-green-500">{trends.sampleHeadlines.length}</span>
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Source Breakdown</h3>
            <div className="space-y-2">
              {trends.sources.map((source, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-background/30 rounded-lg">
                  <span className="text-lg">{getSourceIcon(source)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{source}</div>
                    <div className="text-xs text-muted-foreground">{getSourceDescription(source)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Headlines */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">All Trending Headlines</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {trends.sampleHeadlines.map((headline, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-foreground leading-relaxed">{headline}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-foreground mb-2">🤖 AI Insights</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• These trends are analyzed in real-time from multiple sources</p>
            <p>• AI identifies patterns and generates project ideas based on emerging technologies</p>
            <p>• Signals are weighted by source authority and recency</p>
            <p>• Analysis updates every 6 hours to ensure fresh insights</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors border border-border"
          >
            Close
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(trends, null, 2))
              alert('Trend data copied to clipboard!')
            }}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}
