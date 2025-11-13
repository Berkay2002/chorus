'use client'

export function MentionAutocomplete({
  onSelect,
}: {
  onSelect: (username: string) => void
}) {
  const suggestions = ['chorus', 'ai', 'user1', 'user2']

  return (
    <div className="absolute bottom-full mb-2 w-64 bg-popover border rounded-lg shadow-lg p-2">
      <div className="text-xs text-muted-foreground mb-2 px-2">Suggestions</div>
      {suggestions.map((username) => (
        <button
          key={username}
          onClick={() => onSelect(username)}
          className="w-full text-left px-2 py-1.5 hover:bg-accent rounded text-sm"
        >
          @{username}
        </button>
      ))}
    </div>
  )
}
