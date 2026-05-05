import { useTagStore } from '../../store/tagStore'
import { useImageStore } from '../../store/imageStore'
import { tokens } from '../../styles/tokens'

export function TagStats() {
  const tagsByPath = useTagStore((s) => s.tagsByPath)
  const tagFilter = useImageStore((s) => s.tagFilter)
  const setTagFilter = useImageStore((s) => s.setTagFilter)

  const counts: Record<string, number> = {}
  for (const tag of Object.values(tagsByPath)) {
    counts[tag] = (counts[tag] || 0) + 1
  }

  const items = [
    { key: 'red', label: '红标', color: tokens.tagColors.red },
    { key: 'yellow', label: '黄标', color: tokens.tagColors.yellow },
    { key: 'blue', label: '蓝标', color: tokens.tagColors.blue },
    { key: 'green', label: '绿标', color: tokens.tagColors.green },
  ]

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-1">
        <p className="text-dim text-[10px] font-semibold">标记统计</p>
        {tagFilter && (
          <button
            onClick={() => setTagFilter(null)}
            className="text-accent text-[10px] hover:underline"
          >
            清除
          </button>
        )}
      </div>
      {items.map(({ key, label, color }) => (
        <div
          key={key}
          onClick={() => setTagFilter(tagFilter === key ? null : key)}
          className={`flex items-center px-3 py-1 hover:bg-surface rounded cursor-pointer ${
            tagFilter === key ? 'bg-accent/10' : ''
          }`}
        >
          <span className="text-xs mr-2">{label}</span>
          <span className="text-xs font-semibold ml-auto" style={{ color }}>
            {counts[key] || 0}
          </span>
        </div>
      ))}
      {total > 0 && (
        <p className="text-dim text-[10px] px-3 mt-1">总计: {total} 张已标记</p>
      )}
    </div>
  )
}
