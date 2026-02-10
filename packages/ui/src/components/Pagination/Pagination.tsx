import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav className={styles.pagination} aria-label="Sayfalama">
      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Ilk sayfa"
        >
          ««
        </button>
      )}

      <button
        className={styles.button}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Onceki sayfa"
      >
        «
      </button>

      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          className={`${styles.button} ${page === currentPage ? styles.active : ''} ${page === '...' ? styles.ellipsis : ''}`}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        className={styles.button}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Sonraki sayfa"
      >
        »
      </button>

      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Son sayfa"
        >
          »»
        </button>
      )}
    </nav>
  );
}
