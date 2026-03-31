interface PaginationProps {
  page: number
  totalPages: number
  totalCount: number
  onPrev: () => void
  onNext: () => void
  label?: string
}

export function Pagination({ page, totalPages, totalCount, onPrev, onNext, label = 'résultats' }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
      <span>{totalCount} {label}</span>
      <div className="flex gap-2 items-center">
        <button
          disabled={page === 1}
          onClick={onPrev}
          className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Précédent
        </button>
        <span className="px-2">{page} / {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={onNext}
          className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
