'use client';

interface StepInfo {
  number: number;
  name: string;
  description: string;
  scope: 'post' | 'wash' | 'none';
}

const steps: StepInfo[] = [
  { number: 1, name: 'Тип транспорта', description: 'Тип ТС и объекта', scope: 'post' },
  { number: 2, name: 'Базовая комплектация', description: 'Профиль и аксессуары', scope: 'post' },
  { number: 3, name: 'Терминалы / БУМы', description: 'Модель и оплата', scope: 'post' },
  { number: 4, name: 'Функции на посту', description: 'Базовые и доп. функции', scope: 'post' },
  { number: 5, name: 'Оборудование', description: 'АВД и дозаторы', scope: 'post' },
  { number: 6, name: 'Формирование постов', description: 'Сборка мойки', scope: 'none' },
  { number: 7, name: 'Водоподготовка', description: 'Осмос и ARAS', scope: 'wash' },
  { number: 8, name: 'Доп. к посту', description: 'Доп. оборудование', scope: 'wash' },
  { number: 9, name: 'Доп. на мойку', description: 'Пылесосы, магистрали', scope: 'wash' },
  { number: 10, name: 'Финализация', description: 'Сводка и условия', scope: 'wash' },
];

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepClick }: StepNavigationProps) {
  return (
    <div className="w-[250px] shrink-0 bg-surface border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-accent">Конфигуратор МСО</h2>
        <p className="text-xs text-muted mt-1">DKR Group</p>
      </div>
      <nav className="py-2">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isPast = currentStep > step.number;
          return (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                isActive
                  ? 'bg-accent/10 border-l-2 border-accent'
                  : 'border-l-2 border-transparent hover:bg-surface-hover'
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-accent text-white'
                    : isPast
                      ? 'bg-success/20 text-success'
                      : 'bg-border text-muted'
                }`}
              >
                {isPast ? '✓' : step.number}
              </span>
              <div className="min-w-0">
                <div className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-foreground'}`}>
                  {step.name}
                </div>
                <div className="text-xs text-muted truncate">{step.description}</div>
                {step.scope !== 'none' && (
                  <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                    step.scope === 'post' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'
                  }`}>
                    {step.scope === 'post' ? 'на пост' : 'на мойку'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
