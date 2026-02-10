import { type ReactNode } from 'react';
import styles from './Table.module.css';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  responsive?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Veri bulunamadi',
  loading = false,
  responsive = true,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Yukleniyor...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${responsive ? styles.responsive : ''}`}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles.th}
                style={{
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item)}
              className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={styles.td}
                  data-label={column.header}
                  style={{ textAlign: column.align || 'left' }}
                >
                  {column.render
                    ? column.render(item, rowIndex)
                    : ((item as Record<string, unknown>)[column.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
