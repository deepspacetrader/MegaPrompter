import { useState } from 'react'

interface TrendsData {
  totalSignals: number
  sources: string[]
  sampleHeadlines: string[]
}

interface TrendsProps {
  trends: TrendsData | null
  isLoading?: boolean
}

export function Trends({ trends, isLoading, onOpenDetailedAnalysis, onAnalyzeHeadline }: TrendsProps & { 
  onOpenDetailedAnalysis?: () => void
  onAnalyzeHeadline?: (data: any) => void 
}) {
  const [hoveredHeadline, setHoveredHeadline] = useState<string | null>(null)
  const [hoveredSource, setHoveredSource] = useState<string | null>(null)
  const [expandedHeadlines, setExpandedHeadlines] = useState(false)

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold">Analyzing Trends...</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Scanning tech news and sources for emerging patterns...
        </div>
        <div className="mt-4 flex gap-2">
          {['TechCrunch', 'Hacker News', 'GitHub'].map((source, i) => (
            <div key={source} className="w-16 h-2 bg-primary/10 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
          ))}
        </div>
      </div>
    )
  }

  if (!trends) {
    return null
  }

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

  const analyzeHeadline = (headline: string) => {
    // Extract source from headline format [Source] Title
    const sourceMatch = headline.match(/^\[([^\]]+)\]/)
    const source = sourceMatch ? sourceMatch[1] : 'Unknown'
    const title = headline.replace(/^\[[^\]]+\]\s*/, '')
    
    // Generate AI-like analysis based on keywords
    const analysis = generateHeadlineAnalysis(title, source)
    
    // Call the parent callback with the analysis data
    if (onAnalyzeHeadline) {
      onAnalyzeHeadline({
        original: headline,
        source,
        title,
        analysis,
        timestamp: new Date().toISOString()
      })
    }
  }

  const generateHeadlineAnalysis = (title: string, source: string) => {
    const keywords = title.toLowerCase()
    
    // Technology categories
    const techCategories = []
    if (keywords.includes('ai') || keywords.includes('machine learning') || keywords.includes('gpt')) {
      techCategories.push('Artificial Intelligence')
    }
    if (keywords.includes('blockchain') || keywords.includes('crypto') || keywords.includes('web3')) {
      techCategories.push('Blockchain/Crypto')
    }
    if (keywords.includes('mobile') || keywords.includes('ios') || keywords.includes('android')) {
      techCategories.push('Mobile Technology')
    }
    if (keywords.includes('cloud') || keywords.includes('aws') || keywords.includes('azure')) {
      techCategories.push('Cloud Computing')
    }
    if (keywords.includes('security') || keywords.includes('cyber') || keywords.includes('privacy')) {
      techCategories.push('Cybersecurity')
    }
    if (keywords.includes('startup') || keywords.includes('funding') || keywords.includes('venture')) {
      techCategories.push('Startup/Funding')
    }
    
    // Impact assessment
    let impact = 'Medium'
    if (keywords.includes('billion') || keywords.includes('massive') || keywords.includes('breakthrough')) {
      impact = 'High'
    } else if (keywords.includes('update') || keywords.includes('minor') || keywords.includes('small')) {
      impact = 'Low'
    }
    
    // Project potential
    const projectPotential = []
    if (techCategories.includes('Artificial Intelligence')) {
      projectPotential.push('AI-powered applications', 'Machine learning tools', 'Automation solutions')
    }
    if (techCategories.includes('Mobile Technology')) {
      projectPotential.push('Mobile apps', 'Cross-platform solutions', 'Mobile-first services')
    }
    if (techCategories.includes('Blockchain/Crypto')) {
      projectPotential.push('DeFi platforms', 'NFT marketplaces', 'Blockchain infrastructure')
    }
    if (techCategories.includes('Cybersecurity')) {
      projectPotential.push('Security tools', 'Privacy solutions', 'Compliance platforms')
    }
    
    return {
      categories: techCategories.length > 0 ? techCategories : ['General Technology'],
      impact,
      projectPotential: projectPotential.length > 0 ? projectPotential : ['Technology solutions', 'Digital products'],
      relevance: calculateRelevance(title, source),
      trendStrength: calculateTrendStrength(keywords)
    }
  }

  const calculateRelevance = (title: string, source: string) => {
    let score = 50 // Base score
    
    // Source authority bonus
    const sourceScores: { [key: string]: number } = {
      'TechCrunch': 20,
      'Hacker News': 15,
      'GitHub Trending': 15,
      'The Verge': 10,
      'Wired': 10,
      'Product Hunt': 10
    }
    score += sourceScores[source] || 5
    
    // Title relevance keywords
    const relevantKeywords = ['launch', 'release', 'new', 'ai', 'breakthrough', 'funding', 'acquisition']
    const foundKeywords = relevantKeywords.filter(keyword => title.toLowerCase().includes(keyword))
    score += foundKeywords.length * 5
    
    return Math.min(score, 100)
  }

  const calculateTrendStrength = (keywords: string) => {
    if (keywords.includes('viral') || keywords.includes('explosive') || keywords.includes('revolutionary')) {
      return 'Very Strong'
    } else if (keywords.includes('growing') || keywords.includes('rising') || keywords.includes('trending')) {
      return 'Strong'
    } else if (keywords.includes('emerging') || keywords.includes('new') || keywords.includes('developing')) {
      return 'Moderate'
    }
    return 'Emerging'
  }

  return (
    <div className="glass-card rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Trend Analysis
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <div className="px-3 py-1 bg-green-500/10 text-green-600 text-sm rounded-full font-medium border border-green-500/20">
            {trends.totalSignals} signals
          </div>
          <div className="px-3 py-1 bg-blue-500/10 text-blue-600 text-sm rounded-full font-medium border border-blue-500/20">
            {trends.sources.length} sources
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Sources Monitored</h4>
            <div className="text-xs text-muted-foreground">({trends.sources.length} active)</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trends.sources.map((source, index) => (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredSource(source)}
                onMouseLeave={() => setHoveredSource(null)}
              >
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary hover:from-primary/20 hover:to-blue-500/20 text-xs rounded-full font-medium border border-primary/20 transition-all duration-200 cursor-pointer hover:scale-105">
                  <span className="text-sm">{getSourceIcon(source)}</span>
                  {source}
                </span>
                
                {hoveredSource === source && (
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-background border border-border rounded-lg shadow-lg whitespace-nowrap">
                    <div className="text-xs font-medium text-foreground">{source}</div>
                    <div className="text-xs text-muted-foreground">{getSourceDescription(source)}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-background border-r border-t border-border rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Headlines Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">Sample Headlines</h4>
              <div className="text-xs text-muted-foreground">
                ({expandedHeadlines ? trends.sampleHeadlines.length : Math.min(3, trends.sampleHeadlines.length)} shown)
              </div>
            </div>
            {trends.sampleHeadlines.length > 3 && (
              <button
                onClick={() => setExpandedHeadlines(!expandedHeadlines)}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {expandedHeadlines ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>
          
          <div className={`space-y-2 ${expandedHeadlines ? 'max-h-48 overflow-y-auto' : 'max-h-24 overflow-y-auto'} pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent`}>
            {(expandedHeadlines ? trends.sampleHeadlines : trends.sampleHeadlines.slice(0, 3)).map((headline, index) => (
              <div
                key={index}
                className="group relative p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30"
                onMouseEnter={() => setHoveredHeadline(headline)}
                onMouseLeave={() => setHoveredHeadline(null)}
                onClick={() => analyzeHeadline(headline)}
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                      {headline}
                    </div>
                    <div className="text-xs text-primary/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to analyze →
                    </div>
                  </div>
                </div>
                
                {hoveredHeadline === headline && (
                  <div className="absolute z-10 bottom-full left-0 right-0 mb-2 p-3 bg-background border border-border rounded-lg shadow-lg">
                    <div className="text-xs font-medium text-foreground mb-1">Full Headline</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{headline}</div>
                    <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-background border-r border-t border-border rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="mt-6 pt-4 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time trend analysis powered by AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Updated: {new Date().toLocaleTimeString()}</span>
            <span 
              onClick={onOpenDetailedAnalysis}
              className="text-primary hover:text-primary/80 cursor-pointer transition-colors"
            >
              View detailed analysis →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
