interface SourceOverlayProps {
  alias: string
  color: string
}

export function SourceOverlay({ alias, color }: SourceOverlayProps) {
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-white/80 text-[10px] font-semibold truncate max-w-[80px]">
        {alias}
      </span>
    </div>
  )
}
