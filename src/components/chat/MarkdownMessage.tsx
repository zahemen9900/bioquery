import { Children, useMemo, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { CodeProps } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { GroundingSource } from '@/contexts/chat-context-types'
import { CitationLink } from './CitationLink'

type MarkdownMessageProps = {
  content: string
  className?: string
  sources?: GroundingSource[]
}

const renderCode = ({ inline, className: codeClass, children, ...props }: CodeProps) => {
  const languageMatch = /language-(\w+)/.exec(codeClass ?? '')
  const codeContent = String(children ?? '').replace(/\n$/, '')

  if (!inline) {
    return (
      <pre className="chat-markdown-pre" data-language={languageMatch?.[1] ?? undefined}>
        <code className={cn('chat-markdown-code', codeClass)} {...props}>
          {codeContent}
        </code>
      </pre>
    )
  }

  return (
    <code className={cn('chat-markdown-inline-code', codeClass)} {...props}>
      {codeContent}
    </code>
  )
}

const renderUnorderedList = ({ children, ...props }: ComponentPropsWithoutRef<'ul'>) => (
  <ul {...props} className="chat-markdown-list">
    {children}
  </ul>
)

const renderOrderedList = ({ children, ...props }: ComponentPropsWithoutRef<'ol'>) => (
  <ol {...props} className="chat-markdown-ordered-list">
    {children}
  </ol>
)

const renderListItem = ({ children, ...props }: ComponentPropsWithoutRef<'li'>) => (
  <li {...props} className="chat-markdown-list-item">
    {children}
  </li>
)

const renderBlockquote = ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
  <blockquote {...props} className="chat-markdown-quote">
    {children}
  </blockquote>
)

const renderTable = ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
  <div className="chat-markdown-table-wrapper">
    <table {...props} className="chat-markdown-table">
      {children}
    </table>
  </div>
)

const renderTableHeader = ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
  <th {...props} className="chat-markdown-th">
    {children}
  </th>
)

const renderTableCell = ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
  <td {...props} className="chat-markdown-td">
    {children}
  </td>
)

const renderParagraph = ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
  <p {...props} className="chat-markdown-paragraph">
    {children}
  </p>
)

const createAnchorRenderer = (sources: Map<number, GroundingSource>) =>
  ({ children, href, className, ...props }: ComponentPropsWithoutRef<'a'>) => {
    const rawText = Children.toArray(children)
      .map((child) => {
        if (typeof child === 'string' || typeof child === 'number') return String(child)
        return ''
      })
      .join('')

    const citationMatch = rawText.match(/^\[\[(\d+)\]\]$/)

    if (citationMatch) {
      const sourceId = Number(citationMatch[1])
      const source = Number.isFinite(sourceId) ? sources.get(sourceId) ?? null : null
      return <CitationLink source={source} href={href} label={citationMatch[0]} />
    }

    return (
      <a
        {...props}
        href={href}
        className={cn('chat-markdown-link', className)}
        target={href ? '_blank' : undefined}
        rel={href ? 'noreferrer' : undefined}
      >
        {children}
      </a>
    )
  }

export function MarkdownMessage({ content, className, sources }: MarkdownMessageProps) {
  const safeContent = content ?? ''
  const sourceMap = useMemo(() => {
    const map = new Map<number, GroundingSource>()
    for (const source of sources ?? []) {
      if (Number.isFinite(source.id)) {
        map.set(source.id, source)
      }
    }
    return map
  }, [sources])

  const markdownComponents = useMemo<Components>(() => {
    const anchorRenderer = createAnchorRenderer(sourceMap)
    return {
      code: renderCode,
      a: anchorRenderer,
      ul: renderUnorderedList,
      ol: renderOrderedList,
      li: renderListItem,
      blockquote: renderBlockquote,
      table: renderTable,
      th: renderTableHeader,
      td: renderTableCell,
      p: renderParagraph,
    }
  }, [sourceMap])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn('chat-markdown', className)}
      components={markdownComponents}
    >
      {safeContent.trim().length > 0 ? safeContent : ''}
    </ReactMarkdown>
  )
}

export default MarkdownMessage
