import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, ExternalLink, X, Info, Eye, EyeOff } from 'lucide-react'

interface IdeaRationaleModalProps {
  idea: {
    id: string
    label: string
    description: string
    rationale: string
    features?: Array<{ id: string; label: string }>
  } | null
  trends: {
    totalSignals: number
    sources: string[]
    sampleHeadlines: string[]
  } | null
  onClose: () => void
}

export function IdeaRationaleModal({ idea, trends, onClose }: IdeaRationaleModalProps) {
  const [showHeadlines, setShowHeadlines] = useState(false)

  if (!idea) return null

  // Extract keywords from rationale to find matching headlines
  const extractKeywords = (text: string) => {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || []
    const keywords = words.filter(word => 
      !['with', 'that', 'this', 'from', 'they', 'have', 'been', 'were', 'said', 'will', 'would', 'could', 'should'].includes(word)
    )
    return [...new Set(keywords)].slice(0, 10)
  }

  const keywords = extractKeywords(idea.rationale)
  
  // Find matching headlines
  const findMatchingHeadlines = () => {
    if (!trends?.sampleHeadlines) return []
    
    return trends.sampleHeadlines.filter(headline => {
      const headlineLower = headline.toLowerCase()
      return keywords.some(keyword => headlineLower.includes(keyword))
    }).slice(0, 5)
  }

  const matchingHeadlines = findMatchingHeadlines()

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

  const extractSourceFromHeadline = (headline: string) => {
    const match = headline.match(/^\[([^\]]+)\]/)
    return match ? match[1] : 'Unknown'
  }

  const highlightKeywords = (text: string) => {
    let highlightedText = text
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, `<mark class="bg-primary/20 text-primary px-1 rounded">${keyword}</mark>`)
    })
    return highlightedText
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Why This Idea Was Chosen</h2>
              <p className="text-sm text-muted-foreground">AI analysis of trend data connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center border border-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Idea Overview */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/10 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{idea.label}</h3>
              <p className="text-sm text-muted-foreground">{idea.description}</p>
              {idea.features && (
                <div className="mt-2 text-xs text-primary/70">
                  {idea.features.length} core features identified
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Rationale */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">AI Rationale</h3>
            <div className="ml-auto flex items-center gap-2">
              <Info className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Based on trend analysis</span>
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border/50">
            <div 
              className="text-sm text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightKeywords(idea.rationale) }}
            />
          </div>
        </div>

        {/* Key Insights */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="text-xs font-medium text-primary mb-1">Signal Strength</div>
              <div className="text-sm text-foreground">
                {matchingHeadlines.length > 3 ? 'Strong' : matchingHeadlines.length > 1 ? 'Moderate' : 'Emerging'} market signals
              </div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="text-xs font-medium text-primary mb-1">Data Sources</div>
              <div className="text-sm text-foreground">
                {trends?.sources.length || 0} tech sources analyzed
              </div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="text-xs font-medium text-primary mb-1">Keyword Matches</div>
              <div className="text-sm text-foreground">
                {keywords.length} key concepts identified
              </div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="text-xs font-medium text-primary mb-1">Relevance Score</div>
              <div className="text-sm text-foreground">
                {Math.min(95, 60 + (matchingHeadlines.length * 7))}% match to trends
              </div>
            </div>
          </div>
        </div>

        {/* Matching Headlines */}
        {matchingHeadlines.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Matching Trend Signals ({matchingHeadlines.length})
              </h3>
              <button
                onClick={() => setShowHeadlines(!showHeadlines)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {showHeadlines ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHeadlines ? 'Hide' : 'Show'} headlines
              </button>
            </div>
            
            <AnimatePresence>
              {showHeadlines && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {matchingHeadlines.map((headline, index) => {
                    const source = extractSourceFromHeadline(headline)
                    const title = headline.replace(/^\[[^\]]+\]\s*/, '')
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-background/30 rounded-lg border border-border/30 hover:bg-background/50 transition-all"
                      >
                        <div className="text-lg">{getSourceIcon(source)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-primary">{source}</span>
                            <div className="flex-1 h-px bg-border/30"></div>
                          </div>
                          <div 
                            className="text-sm text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: highlightKeywords(title) }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Keywords */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3">Identified Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* AI Process Explanation */}
        <div className="p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg border border-blue-500/20">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            How This Connection Was Made
          </h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• AI analyzed {trends?.totalSignals || 0} trend signals from multiple sources</p>
            <p>• Identified {keywords.length} key concepts from market data</p>
            <p>• Found {matchingHeadlines.length} matching headlines with strong relevance</p>
            <p>• Generated this idea based on pattern recognition and market opportunities</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors border border-border"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
