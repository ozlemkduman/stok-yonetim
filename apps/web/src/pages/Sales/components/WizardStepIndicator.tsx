import { WIZARD_STEPS } from '../wizard.types';
import styles from '../SaleFormPage.module.css';

interface WizardStepIndicatorProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

export function WizardStepIndicator({ currentStep, completedSteps, onStepClick }: WizardStepIndicatorProps) {
  return (
    <div className={styles.stepIndicator}>
      {WIZARD_STEPS.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = completedSteps.has(step.number);
        const isClickable = isCompleted && !isActive;

        return (
          <div key={step.number} className={styles.stepWrapper}>
            {index > 0 && (
              <div className={`${styles.stepLine} ${isCompleted || isActive ? styles.stepLineActive : ''}`} />
            )}
            <button
              type="button"
              className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
            >
              <span className={styles.stepNumber}>
                {isCompleted && !isActive ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
