'use client';

import { useRef, useEffect } from 'react';
import type { ObjectType } from '@/types';
import { ThemeToggle } from './ThemeToggle';

interface StepInfo {
  number: number;
  name: string;
  description: string;
  scope: 'post' | 'wash' | 'none';
}

const msoSteps: StepInfo[] = [
  { number: 1, name: 'Тип транспорта', description: 'Тип ТС и объекта', scope: 'post' },
  { number: 2, name: 'Базовая комплектация', description: 'Профиль и аксессуары', scope: 'post' },
  { number: 3, name: 'Терминалы / БУМы', description: 'Модель и оплата', scope: 'post' },
  { number: 4, name: 'Функции на посту', description: 'Базовые и доп. функции', scope: 'post' },
  { number: 5, name: 'Выбор помпы', description: 'Помпы (АВД)', scope: 'post' },
  { number: 6, name: 'Формирование постов', description: 'Сборка мойки', scope: 'none' },
  { number: 7, name: 'Водоподготовка', description: 'Осмос и ARAS', scope: 'wash' },
  { number: 8, name: 'Доп. к посту', description: 'Доп. оборудование', scope: 'wash' },
  { number: 9, name: 'Доп. на мойку', description: 'Пылесосы, магистрали', scope: 'wash' },
  { number: 10, name: 'Финализация', description: 'Сводка и условия', scope: 'wash' },
];

const robotSteps: StepInfo[] = [
  { number: 1, name: 'Тип транспорта', description: 'Тип ТС и объекта', scope: 'post' },
  { number: 2, name: 'Модель робота', description: 'Smartbot DKR 360', scope: 'post' },
  { number: 3, name: 'Выбор БУР', description: 'Блок управления', scope: 'post' },
  { number: 4, name: 'Опции робота', description: 'Доп. оборудование', scope: 'post' },
  { number: 5, name: 'Водоподготовка', description: 'Осмос и ARAS', scope: 'wash' },
  { number: 6, name: 'Доп. на мойку', description: 'Пылесосы, магистрали', scope: 'wash' },
  { number: 7, name: 'Финализация', description: 'Сводка и условия', scope: 'wash' },
];

const truckSteps: StepInfo[] = [
  { number: 1, name: 'Тип транспорта', description: 'Тип ТС и объекта', scope: 'post' },
  { number: 2, name: 'Тип мойки', description: 'КОМПАК / SmartBot Track', scope: 'post' },
  { number: 3, name: 'БУР', description: 'Модель БУРа', scope: 'post' },
  { number: 4, name: 'Опции', description: 'Дополнительные опции', scope: 'post' },
  { number: 5, name: 'Ручной пост', description: 'АВД и подвесы', scope: 'post' },
  { number: 6, name: 'Водоочистка', description: 'Циклон / АРОС', scope: 'wash' },
  { number: 7, name: 'Финализация', description: 'Сводка и условия', scope: 'wash' },
];

interface StepNavigationProps {
  currentStep: number;
  objectType: ObjectType;
  onStepClick: (step: number) => void;
}

export function StepNavigation({ currentStep, objectType, onStepClick }: StepNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const steps = objectType === 'truck' ? truckSteps : objectType === 'robotic' ? robotSteps : msoSteps;
  const title = objectType === 'truck' ? 'Конфигуратор Грузовая' : objectType === 'robotic' ? 'Конфигуратор Робот' : 'Конфигуратор МСО';

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentStep]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[250px] shrink-0 bg-surface border-r border-border overflow-y-auto flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <h2 className="text-lg font-bold text-accent">{title}</h2>
            <p className="text-xs text-muted mt-1">DKR Group</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="py-2">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isPast = currentStep > step.number;
            const prevStep = idx > 0 ? steps[idx - 1] : null;
            const showDivider = prevStep && prevStep.scope !== 'wash' && step.scope === 'wash';
            return (
              <div key={step.number}>
              {showDivider && (
                <div className="mx-4 my-2 border-t border-border" />
              )}
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
                        ? 'bg-success text-white'
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
                      {step.scope === 'post' ? (objectType === 'robotic' ? 'робот' : 'на пост') : 'на мойку'}
                    </span>
                  )}
                </div>
              </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile horizontal strip */}
      <div className="lg:hidden shrink-0 bg-surface border-b border-border">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide"
        >
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isPast = currentStep > step.number;
            return (
              <button
                key={step.number}
                data-active={isActive}
                onClick={() => onStepClick(step.number)}
                className={`shrink-0 flex items-center gap-1.5 transition-colors ${
                  isActive ? 'pr-3' : ''
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : isPast
                        ? 'bg-success text-white'
                        : 'bg-border text-muted'
                  }`}
                >
                  {isPast ? '✓' : step.number}
                </span>
                {isActive && (
                  <span className="text-xs font-medium text-accent whitespace-nowrap">
                    {step.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
