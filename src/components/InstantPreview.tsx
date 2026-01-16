import { motion } from 'framer-motion'
import { Code, Database, Globe, Layers, Server, Smartphone, Zap } from 'lucide-react'
import type { Selection } from '../types'

interface InstantPreviewProps {
  selections: Selection[]
  isOpen: boolean
  onClose: () => void
}

const getIconForCategory = (category: string) => {
  switch (category.toLowerCase()) {
    case 'frontend framework':
    case 'frontend':
      return <Code className="w-4 h-4" />
    case 'backend':
    case 'backend framework':
      return <Server className="w-4 h-4" />
    case 'database':
      return <Database className="w-4 h-4" />
    case 'platform':
      return <Globe className="w-4 h-4" />
    case 'styling':
      return <Layers className="w-4 h-4" />
    case 'mobile':
      return <Smartphone className="w-4 h-4" />
    case 'deployment':
      return <Zap className="w-4 h-4" />
    default:
      return <Code className="w-4 h-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'frontend framework':
    case 'frontend':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'backend':
    case 'backend framework':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'database':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'platform':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'styling':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    case 'mobile':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    case 'deployment':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export const InstantPreview = ({ selections, isOpen, onClose }: InstantPreviewProps) => {
  if (!isOpen) return null

  const groupedSelections = selections.reduce((acc, selection) => {
    if (!acc[selection.category]) {
      acc[selection.category] = []
    }
    acc[selection.category].push(selection)
    return acc
  }, {} as Record<string, Selection[]>)

  const projectStructure = {
    'my-project/': {
      type: 'folder',
      children: {
        'src/': {
          type: 'folder',
          children: {
            'components/': { type: 'folder' },
            'pages/': { type: 'folder' },
            'utils/': { type: 'folder' },
            'App.tsx': { type: 'file' },
            'main.tsx': { type: 'file' }
          }
        },
        'package.json': { type: 'file' },
        'README.md': { type: 'file' },
        '.gitignore': { type: 'file' }
      }
    }
  }

  const renderFileTree = (structure: any, depth = 0) => {
    return Object.entries(structure).map(([name, item]: [string, any]) => (
      <div key={name} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 py-1">
          {item.type === 'folder' ? (
            <div className="w-4 h-4 text-yellow-500">📁</div>
          ) : (
            <div className="w-4 h-4 text-blue-400">📄</div>
          )}
          <span className="text-sm font-mono text-white/80">{name}</span>
        </div>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            Project Preview
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tech Stack */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Tech Stack</h3>
            <div className="space-y-3">
              {Object.entries(groupedSelections).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                    {getIconForCategory(category)}
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                          category
                        )}`}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Structure */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Project Structure</h3>
            <div className="bg-black/40 rounded-lg p-4 border border-white/5">
              {renderFileTree(projectStructure)}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white/90">Features Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium text-white">Modern Stack</span>
              </div>
              <p className="text-sm text-white/70">
                Built with cutting-edge technologies for optimal performance
              </p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">Scalable</span>
              </div>
              <p className="text-sm text-white/70">
                Designed to grow with your business needs
              </p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-green-400" />
                <span className="font-medium text-white">Production Ready</span>
              </div>
              <p className="text-sm text-white/70">
                Enterprise-grade architecture and best practices
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
