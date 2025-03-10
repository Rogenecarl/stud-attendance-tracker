import React from 'react'

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  // Ensure all values are valid numbers with defaults
  const validCurrentPage = Math.max(1, Number(currentPage) || 1)
  const validTotalItems = Math.max(0, Number(totalItems) || 0)
  const validItemsPerPage = Math.max(1, Number(itemsPerPage) || 20)
  const validTotalPages = Math.max(1, Number(totalPages) || 1)

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (validTotalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of visible pages
      let start = Math.max(2, validCurrentPage - 1)
      let end = Math.min(validTotalPages - 1, validCurrentPage + 1)

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...')
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < validTotalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      if (validTotalPages > 1) {
        pages.push(validTotalPages)
      }
    }

    return pages
  }

  // Calculate start and end items with validation
  const startItem = validTotalItems === 0 ? 0 : Math.min((validCurrentPage - 1) * validItemsPerPage + 1, validTotalItems)
  const endItem = Math.min(validCurrentPage * validItemsPerPage, validTotalItems)

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-700">
          {validTotalItems === 0 ? (
            'No entries to show'
          ) : (
            <>
              Showing{' '}
              <span className="font-medium">{startItem}</span>{' '}
              to{' '}
              <span className="font-medium">{endItem}</span>{' '}
              of{' '}
              <span className="font-medium">{validTotalItems}</span> entries
            </>
          )}
        </p>
      </div>
      {validTotalItems > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            className={`p-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
              validCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`min-w-[2.5rem] h-10 px-4 text-sm font-medium rounded-lg
                ${page === validCurrentPage
                  ? 'bg-indigo-600 text-white'
                  : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
              aria-label={typeof page === 'number' ? `Page ${page}` : 'More pages'}
              aria-current={page === validCurrentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === validTotalPages}
            className={`p-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
              validCurrentPage === validTotalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default Pagination 