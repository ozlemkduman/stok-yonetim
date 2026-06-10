import { Select, type SelectProps } from '@stok/ui';
import styles from './SelectWithAdd.module.css';

interface SelectWithAddProps extends SelectProps {
  onAdd: () => void;
  addTitle?: string;
}

/**
 * Standart Select + yanında "＋" hızlı-ekle butonu.
 * Buton, select disabled iken pasif olur.
 */
export function SelectWithAdd({ onAdd, addTitle, ...props }: SelectWithAddProps) {
  return (
    <div className={styles.row}>
      <Select {...props} fullWidth />
      <button
        type="button"
        className={styles.addBtn}
        onClick={onAdd}
        disabled={props.disabled}
        title={addTitle}
        aria-label={addTitle}
      >
        +
      </button>
    </div>
  );
}
