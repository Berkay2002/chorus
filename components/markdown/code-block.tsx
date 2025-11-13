'use client'

import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    async function highlight() {
      const highlighted = await codeToHtml(code, {
        lang: language || 'text',
        theme: 'github-dark',
      })
      setHtml(highlighted)
    }
    highlight()
  }, [code, language])

  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 text-xs text-muted-foreground border-b">
        {language || 'code'}
      </div>
      <div 
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  )
}
