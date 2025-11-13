'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './code-block'
import { MermaidDiagram } from './mermaid-diagram'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''

          if (inline) {
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            )
          }

          if (language === 'mermaid') {
            return <MermaidDiagram code={String(children)} />
          }

          return <CodeBlock language={language} code={String(children)} />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
