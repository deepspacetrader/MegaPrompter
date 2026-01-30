import { motion } from 'framer-motion'
import { Code, Database, Globe, Layers, Loader2, Server, Smartphone, Zap } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { Selection } from '../types'

interface InstantPreviewProps {
  selections: Selection[]
  generatedResult: { id: string, prompt: string } | null
  generatedJson: string
  selectedModel: string
  isOpen: boolean
  onClose: () => void
}

const renderNode = (node: any): any => {
  if (!node || typeof node !== 'object') return null
  const Comp = previewRegistry[node.type]
  const renderedChildren = Array.isArray(node.children)
    ? node.children.map((c: any, i: number) => (
      <Fragment key={i}>{renderNode(c)}</Fragment>
    ))
    : null

  if (!Comp) {
    const rawProps = node?.props && typeof node.props === 'object' ? node.props : {}
    const propLines = Object.entries(rawProps)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
      .slice(0, 6)
      .map(([k, v]) => `${k}: ${String(v)}`)

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
        <div className="text-xs text-white/40 font-mono">[unknown component: {String(node.type)}]</div>
        {propLines.length > 0 ? (
          <div className="text-xs text-white/50 font-mono whitespace-pre-wrap">
            {propLines.join('\n')}
          </div>
        ) : null}
        {renderedChildren}
      </div>
    )
  }

  return <Comp element={node} children={renderedChildren} />
}

const gapClassMap: Record<string, string> = {
  '1': 'gap-1',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '10': 'gap-10'
}

type PreviewElement = {
  key: string
  type: string
  props?: Record<string, any>
  children?: string[]
}

const graphToNested = (rootKey: string, elements: Record<string, PreviewElement>) => {
  const seen = new Set<string>()

  const normalizedRoot = elements[rootKey]
    ? rootKey
    : (Object.keys(elements)[0] || rootKey)

  const build = (key: string): any => {
    if (seen.has(key)) {
      return { type: 'Text', props: { variant: 'muted', text: '[circular]' } }
    }
    seen.add(key)

    const el = elements[key]
    if (!el) return { type: 'Text', props: { variant: 'muted', text: `[missing: ${key}]` } }

    return {
      type: el.type,
      props: el.props || {},
      children: Array.isArray(el.children) ? el.children.map(build) : undefined
    }
  }

  return build(normalizedRoot)
}

const treeToGraph = (tree: any) => {
  if (!tree || typeof tree !== 'object') return null
  if (typeof tree.root === 'string' && tree.elements && typeof tree.elements === 'object') return tree
  if (typeof tree.type !== 'string') return null

  let counter = 0
  const elements: Record<string, any> = {}

  const walk = (node: any): string => {
    counter += 1
    const key = typeof node?.key === 'string' ? node.key : `el_${counter}`
    elements[key] = {
      key,
      type: node.type,
      props: node.props && typeof node.props === 'object' ? node.props : {}
    }

    if (Array.isArray(node.children) && node.children.length > 0 && typeof node.children[0] === 'object') {
      elements[key].children = node.children.map(walk)
    }

    return key
  }

  const root = walk(tree)
  return { root, elements }
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

const previewRegistry: any = {
  Stack: ({ element, children }: any) => {
    const dir = element?.props?.direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'
    const gap = String(element?.props?.gap || '6')
    const gapClass = gapClassMap[gap] || 'gap-6'

    return <div className={`flex ${dir} ${gapClass}`}>{children}</div>
  },
  Grid: ({ element, children }: any) => {
    const cols = element?.props?.columns || 2
    const gap = String(element?.props?.gap || '6')
    const colsClass = cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
    const gapClass = gapClassMap[gap] || 'gap-6'
    return <div className={`grid ${colsClass} ${gapClass}`}>{children}</div>
  },
  Card: ({ element, children }: any) => {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        {element?.props?.title ? (
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-white/90">
              {element?.props?.title}
            </div>
          </div>
        ) : null}
        {children}
      </div>
    )
  },
  Text: ({ element }: any) => {
    const variant = element?.props?.variant || 'body'
    const cls =
      variant === 'title'
        ? 'text-lg font-bold text-white'
        : variant === 'subtitle'
          ? 'text-sm font-semibold text-white/80'
          : variant === 'muted'
            ? 'text-xs text-white/40'
            : 'text-sm text-white/70'

    return <div className={cls}>{element?.props?.text}</div>
  },
  Badge: ({ element }: any) => (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
      {element?.props?.text}
    </span>
  ),
  List: ({ element, children }: any) => (
      <div className="space-y-2">
        {element?.props?.title ? (
          <div className="text-xs font-semibold text-white/70">{element.props.title}</div>
        ) : null}
        <div className="space-y-2">{children}</div>
      </div>
    ),
  ListItem: ({ element }: any) => (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-xs font-semibold text-white/80">{element?.props?.title}</div>
      {element?.props?.description ? (
        <div className="text-xs text-white/50 mt-1">{element.props.description}</div>
      ) : null}
    </div>
  ),
  Divider: () => <div className="h-px w-full bg-white/10" />,
  Button: ({ element }: any) => {
    const variant = element?.props?.variant || 'primary'
    const cls =
      variant === 'ghost'
        ? 'border border-white/10 bg-transparent text-white/70'
        : variant === 'secondary'
          ? 'border border-white/10 bg-white/[0.04] text-white/80'
          : 'border border-white/10 bg-white/10 text-white'

    return (
      <button type="button" className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold ${cls}`}>
        {element?.props?.text || 'Button'}
      </button>
    )
  },
  Input: ({ element }: any) => (
    <div className="space-y-1">
      {element?.props?.label ? (
        <div className="text-[10px] font-semibold text-white/60">{element.props.label}</div>
      ) : null}
      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50">
        {element?.props?.placeholder || 'Enter value…'}
      </div>
    </div>
  ),
  Markdown: ({ element }: any) => (
    <div className="text-sm text-white/70 whitespace-pre-wrap">
      {element?.props?.text}
    </div>
  ),
  Placeholder: ({ element }: any) => (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 space-y-2">
      <div className="text-xs font-semibold text-white/70">{element?.props?.title}</div>
      {element?.props?.description ? (
        <div className="text-xs text-white/45">{element.props.description}</div>
      ) : null}
    </div>
  ),
  KeyValue: ({ element }: any) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
      {element?.props?.title ? (
        <div className="text-xs font-semibold text-white/70">{element.props.title}</div>
      ) : null}
      <div className="space-y-1">
        {(Array.isArray(element?.props?.items) ? element.props.items : []).slice(0, 12).map((it: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/50">{String(it?.label ?? '')}</div>
            <div className="text-xs font-semibold text-white/80 truncate">{String(it?.value ?? '')}</div>
          </div>
        ))}
      </div>
    </div>
  )
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

export const InstantPreview = ({ selections, generatedResult, generatedJson, selectedModel, isOpen, onClose }: InstantPreviewProps) => {
  if (!isOpen) return null

  // Note: generatedResult is currently unused; generatedJson is the source-of-truth for preview.
  // Keeping the prop allows future enhancements (e.g., parsing <specification> from the generated prompt).

  const effectiveSelections = useMemo((): Selection[] => {
    try {
      const parsed = JSON.parse(generatedJson)
      if (!parsed || !Array.isArray(parsed.requirements)) return selections

      return parsed.requirements
        .map((r: any, idx: number) => ({
          id: `spec-${idx}`,
          category: String(r.type ?? 'Spec'),
          label: String(r.value ?? ''),
          description: typeof r.description === 'string' ? r.description : undefined
        }))
        .filter((s: Selection) => s.label.trim().length > 0)
    } catch {
      return selections
    }
  }, [generatedJson, selections])

  const [uiTree, setUiTree] = useState<any>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!generatedResult?.prompt) return

      setIsPreviewLoading(true)
      setPreviewError(null)

      try {
        const resp = await fetch('/api/ui-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ megaPrompt: generatedResult.prompt, model: selectedModel })
        })

        const data = await resp.json()
        if (cancelled) return

        if (!resp.ok) {
          setPreviewError(data?.error || 'Failed to generate preview')
          setUiTree(null)
          return
        }

        const graph = treeToGraph(data) || treeToGraph(data?.tree)
        setUiTree(graph)
      } catch (e: any) {
        if (cancelled) return
        setPreviewError(e?.message || 'Failed to generate preview')
        setUiTree(null)
      } finally {
        if (!cancelled) setIsPreviewLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [generatedResult?.id, generatedResult?.prompt, selectedModel])

  const nestedPreview = useMemo(() => {
    if (!uiTree?.root || !uiTree?.elements) return null
    return graphToNested(uiTree.root, uiTree.elements)
  }, [uiTree])

  const groupedSelections = effectiveSelections.reduce<Record<string, Selection[]>>((acc, selection) => {
    if (!acc[selection.category]) {
      acc[selection.category] = []
    }
    acc[selection.category].push(selection)
    return acc
  }, {})

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

        <div className="space-y-6">

          {/* UI Preview - Full Width */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/90">UI Preview</h3>
            <div className="bg-black/40 rounded-lg p-4 border border-white/5">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="text-sm text-white/60">Generating preview…</div>
                </div>
              ) : previewError ? (
                <div className="space-y-2">
                  <div className="text-sm text-red-400">{previewError}</div>
                  <div className="text-xs text-white/40">
                    If Ollama isn't running or the model can't follow the JSON-only instruction, preview generation will fail.
                  </div>
                </div>
              ) : nestedPreview ? (
                <div className="space-y-4">
                  {renderNode(nestedPreview)}
                </div>
              ) : (
                <div className="text-sm text-white/50">No preview yet.</div>
              )}

              {uiTree ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[10px] text-white/40 font-mono select-none">
                    Show raw preview JSON
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed text-emerald-400/80 font-mono overflow-auto max-h-64">
                    {JSON.stringify(uiTree, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}
