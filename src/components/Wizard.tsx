'use client';

import { useState, useCallback } from 'react';
import type {
  WizardState,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step7Data,
  Step8Data,
  Step9Data,
  Step10Data,
  PostConfig,
  RobotStep2Data,
  RobotStep3Data,
  RobotStep4Data,
} from '@/types';
import {
  defaultAccessories,
  defaultBaseFunctions,
  defaultExtraFunctions,
  profiles,
  defaultPostExtras,
  defaultWashExtras,
} from '@/data/mockData';
import { StepNavigation } from './StepNavigation';
import { CostPanel } from './CostPanel';
import { Step1Transport } from './steps/Step1Transport';
import { Step2BaseConfig } from './steps/Step2BaseConfig';
import { Step3Terminals } from './steps/Step3Terminals';
import { Step4Functions } from './steps/Step4Functions';
import { Step5Equipment } from './steps/Step5Equipment';
import { Step6Posts } from './steps/Step6Posts';
import { Step7Water } from './steps/Step7Water';
import { Step8PostExtras } from './steps/Step8PostExtras';
import { Step9WashExtras } from './steps/Step9WashExtras';
import { Step10Final } from './steps/Step10Final';
import { RobotStep2Model } from './steps/RobotStep2Model';
import { RobotStep3Bur } from './steps/RobotStep3Bur';
import { RobotStep4Options } from './steps/RobotStep4Options';

// Функции, которые входят в комплект Премиум (становятся isBase + enabled)
const premiumIncludedFunctions = [
  'osmos', 'turbo_water', 'active_chem', 'call_operator',
];

function applyProfileDefaults(profileId: string) {
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return null;
  const isPremium = profileId === 'premium';

  const step4Functions = [
    ...defaultBaseFunctions.map((f) => ({ ...f })),
    ...defaultExtraFunctions.map((f) => {
      if (isPremium && premiumIncludedFunctions.includes(f.id)) {
        return { ...f, isBase: true, enabled: true, option: undefined };
      }
      return { ...f };
    }),
  ];

  return {
    step2: {
      profile: profileId as WizardState['step2']['profile'],
      accessories: defaultAccessories.map((a) => ({
        ...a,
        selected: profile.defaultAccessories.includes(a.id),
      })),
    },
    step3: {
      bumModel: profile.defaultTerminal,
      paymentSystems: [...profile.defaultPayments],
      customDesign: false,
    },
    step4: {
      functions: step4Functions,
    },
    step5: {
      avdSelections: [
        { id: '1', avdId: profile.defaultAvd, isDefault: true },
      ],
    },
  };
}

function createInitialState(): WizardState {
  const defaults = applyProfileDefaults('standard')!;
  return {
    currentStep: 1,
    step1: {
      vehicleType: 'passenger',
      objectType: 'self_service',
      clientSearch: '',
      manager: '',
    },
    // MSO
    step2: defaults.step2,
    step3: defaults.step3,
    step4: defaults.step4,
    step5: defaults.step5,
    posts: [],
    currentPostIndex: -1,
    step7: {
      osmosOption: '',
      arasModel: '',
      customWaterPrice: 0,
    },
    step8: {
      extras: defaultPostExtras.map((e) => ({ ...e })),
    },
    step9: {
      vacuumOption: 'none',
      vacuumQuantity: 0,
      extras: defaultWashExtras.map((e) => ({ ...e })),
      pipelinesAirPrice: 0,
      pipelinesWaterPrice: 0,
      pipelinesChemPrice: 0,
    },
    step10: {
      deliveryConditions: '',
      paymentConditions: '',
      region: '',
      currency: 'RUB',
      discount: 0,
      vatEnabled: false,
      vat: 22,
      montage: 'none',
      montageExtra: 0,
      language: 'ru',
    },
    // Robot
    robotStep2: { robotModel: '' },
    robotStep3: { burModel: '' },
    robotStep4: { sideBlowerEnabled: false, sideBlowerPrice: 0, guidesEnabled: false, guidesPrice: 0 },
  };
}

export function Wizard() {
  const [state, setState] = useState<WizardState>(createInitialState);

  const isRobot = state.step1.objectType === 'robotic';
  const maxStep = isRobot ? 7 : 10;

  const setStep = (step: number) => setState((s) => ({ ...s, currentStep: Math.min(step, maxStep) }));

  const updateStep1 = useCallback((data: Step1Data) => {
    setState((s) => {
      // Reset step to 1 when switching objectType to avoid being on an invalid step
      const switched = data.objectType !== s.step1.objectType;
      return { ...s, step1: data, ...(switched ? { currentStep: 1 } : {}) };
    });
  }, []);
  const updateStep2 = useCallback((data: Step2Data) => {
    setState((s) => {
      if (data.profile !== s.step2.profile) {
        const defaults = applyProfileDefaults(data.profile);
        if (defaults) {
          return {
            ...s,
            step2: defaults.step2,
            step3: { ...defaults.step3, customDesign: s.step3.customDesign },
            step4: defaults.step4,
            step5: defaults.step5,
          };
        }
      }
      return { ...s, step2: data };
    });
  }, []);
  const updateStep3 = useCallback((data: Step3Data) => setState((s) => ({ ...s, step3: data })), []);
  const updateStep4 = useCallback((data: Step4Data) => setState((s) => ({ ...s, step4: data })), []);
  const updateStep5 = useCallback((data: Step5Data) => setState((s) => ({ ...s, step5: data })), []);
  const updateStep7 = useCallback((data: Step7Data) => setState((s) => ({ ...s, step7: data })), []);
  const updateStep8 = useCallback((data: Step8Data) => setState((s) => ({ ...s, step8: data })), []);
  const updateStep9 = useCallback((data: Step9Data) => setState((s) => ({ ...s, step9: data })), []);
  const updateStep10 = useCallback((data: Step10Data) => setState((s) => ({ ...s, step10: data })), []);

  // Robot updaters
  const updateRobotStep2 = useCallback((data: RobotStep2Data) => setState((s) => ({ ...s, robotStep2: data })), []);
  const updateRobotStep3 = useCallback((data: RobotStep3Data) => setState((s) => ({ ...s, robotStep3: data })), []);
  const updateRobotStep4 = useCallback((data: RobotStep4Data) => setState((s) => ({ ...s, robotStep4: data })), []);

  // ─── MSO post operations ───
  const saveCurrentPostToList = useCallback(() => {
    setState((s) => {
      const newPost: PostConfig = {
        id: String(Date.now()),
        vehicleType: s.step1.vehicleType,
        objectType: s.step1.objectType,
        profile: s.step2.profile,
        accessories: s.step2.accessories.map((a) => ({ ...a })),
        bumModel: s.step3.bumModel,
        paymentSystems: [...s.step3.paymentSystems],
        customDesign: s.step3.customDesign,
        functions: s.step4.functions.map((f) => ({ ...f })),
        avdSelections: s.step5.avdSelections.map((a) => ({ ...a })),
      };
      return { ...s, posts: [...s.posts, newPost] };
    });
  }, []);

  const handleCopyCurrent = useCallback((count: number) => {
    setState((s) => {
      const copies: PostConfig[] = [];
      for (let i = 0; i < count; i++) {
        copies.push({
          id: String(Date.now() + i),
          vehicleType: s.step1.vehicleType,
          objectType: s.step1.objectType,
          profile: s.step2.profile,
          accessories: s.step2.accessories.map((a) => ({ ...a })),
          bumModel: s.step3.bumModel,
          paymentSystems: [...s.step3.paymentSystems],
          customDesign: s.step3.customDesign,
          functions: s.step4.functions.map((f) => ({ ...f })),
          avdSelections: s.step5.avdSelections.map((a) => ({ ...a })),
        });
      }
      return { ...s, posts: [...s.posts, ...copies] };
    });
  }, []);

  const handleEditPost = useCallback((index: number) => {
    setState((s) => {
      const post = s.posts[index];
      if (!post) return s;
      return {
        ...s,
        currentStep: 1,
        currentPostIndex: index,
        step1: { ...s.step1, vehicleType: post.vehicleType, objectType: post.objectType },
        step2: { profile: post.profile, accessories: post.accessories.map((a) => ({ ...a })) },
        step3: { bumModel: post.bumModel, paymentSystems: [...post.paymentSystems], customDesign: post.customDesign },
        step4: { functions: post.functions.map((f) => ({ ...f })) },
        step5: { avdSelections: post.avdSelections.map((a) => ({ ...a })) },
      };
    });
  }, []);

  const handleDuplicatePost = useCallback((index: number) => {
    setState((s) => {
      const post = s.posts[index];
      if (!post) return s;
      const copy: PostConfig = {
        ...post,
        id: String(Date.now()),
        accessories: post.accessories.map((a) => ({ ...a })),
        paymentSystems: [...post.paymentSystems],
        functions: post.functions.map((f) => ({ ...f })),
        avdSelections: post.avdSelections.map((a) => ({ ...a })),
      };
      const newPosts = [...s.posts];
      newPosts.splice(index + 1, 0, copy);
      return { ...s, posts: newPosts };
    });
  }, []);

  const handleDeletePost = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      posts: s.posts.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdatePost = useCallback((index: number, post: PostConfig) => {
    setState((s) => ({
      ...s,
      posts: s.posts.map((p, i) => (i === index ? post : p)),
    }));
  }, []);

  const handleCreateNew = useCallback(() => {
    saveCurrentPostToList();
    const defaults = applyProfileDefaults('standard')!;
    setState((s) => ({
      ...s,
      currentStep: 1,
      currentPostIndex: -1,
      step2: defaults.step2,
      step3: defaults.step3,
      step4: defaults.step4,
      step5: defaults.step5,
    }));
  }, [saveCurrentPostToList]);

  const handleFinishPosts = useCallback(() => {
    setStep(7);
  }, []);

  // ─── Step rendering ───
  const renderMsoStep = () => {
    switch (state.currentStep) {
      case 2:
        return <Step2BaseConfig data={state.step2} onChange={updateStep2} />;
      case 3:
        return <Step3Terminals data={state.step3} onChange={updateStep3} />;
      case 4:
        return <Step4Functions data={state.step4} bumModelId={state.step3.bumModel} profileId={state.step2.profile} onChange={updateStep4} />;
      case 5:
        return <Step5Equipment data={state.step5} profileId={state.step2.profile} onChange={updateStep5} />;
      case 6:
        return (
          <Step6Posts
            posts={state.posts}
            onEdit={handleEditPost}
            onDuplicate={handleDuplicatePost}
            onDelete={handleDeletePost}
            onCopyCurrent={handleCopyCurrent}
            onCreateNew={handleCreateNew}
            onFinish={handleFinishPosts}
            onUpdatePost={handleUpdatePost}
          />
        );
      case 7:
        return <Step7Water data={state.step7} onChange={updateStep7} />;
      case 8:
        return <Step8PostExtras data={state.step8} avdSelections={state.step5.avdSelections} profileId={state.step2.profile} onChange={updateStep8} />;
      case 9:
        return <Step9WashExtras data={state.step9} onChange={updateStep9} />;
      case 10:
        return (
          <Step10Final
            data={state.step10}
            posts={state.posts}
            wizardState={state}
            onChange={updateStep10}
            onEditPost={handleEditPost}
            onDuplicatePost={handleDuplicatePost}
            onDeletePost={handleDeletePost}
          />
        );
      default:
        return null;
    }
  };

  const renderRobotStep = () => {
    switch (state.currentStep) {
      case 2:
        return <RobotStep2Model data={state.robotStep2} onChange={updateRobotStep2} />;
      case 3:
        return <RobotStep3Bur data={state.robotStep3} onChange={updateRobotStep3} />;
      case 4:
        return <RobotStep4Options data={state.robotStep4} robotModelId={state.robotStep2.robotModel} onChange={updateRobotStep4} />;
      case 5:
        return <Step7Water data={state.step7} onChange={updateStep7} title="Шаг 5. Водоподготовка" />;
      case 6:
        return <Step9WashExtras data={state.step9} onChange={updateStep9} title="Шаг 6. Доп. оборудование на мойку" />;
      case 7:
        return (
          <Step10Final
            data={state.step10}
            posts={[]}
            wizardState={state}
            onChange={updateStep10}
            onEditPost={() => {}}
            onDuplicatePost={() => {}}
            onDeletePost={() => {}}
            title="Шаг 7. Финализация"
          />
        );
      default:
        return null;
    }
  };

  const renderStep = () => {
    if (state.currentStep === 1) {
      return <Step1Transport data={state.step1} onChange={updateStep1} />;
    }
    return isRobot ? renderRobotStep() : renderMsoStep();
  };

  const handleNext = () => {
    if (!isRobot && state.currentStep === 5) {
      saveCurrentPostToList();
      setStep(6);
    } else {
      setState((s) => ({ ...s, currentStep: Math.min(s.currentStep + 1, maxStep) }));
    }
  };

  // Water validation: for MSO on step 7, for Robot on step 5
  const waterStep = isRobot ? 5 : 7;
  const waterValid = state.currentStep !== waterStep
    || (state.step7.osmosOption !== '' && state.step7.arasModel !== '')
    || (state.step7.customWaterPrice > 0);
  const nextDisabled = state.currentStep === maxStep || !waterValid;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      <StepNavigation currentStep={state.currentStep} objectType={state.step1.objectType} onStepClick={setStep} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-36 lg:pb-8">
          {renderStep()}
        </div>

        <div className="shrink-0 p-3 lg:p-4 border-t border-border bg-surface flex justify-between fixed bottom-0 left-0 right-0 z-40 lg:static">
          <button
            onClick={() => setState((s) => ({ ...s, currentStep: Math.max(s.currentStep - 1, 1) }))}
            disabled={state.currentStep === 1}
            className={`px-5 lg:px-6 py-2.5 rounded font-medium text-sm transition-colors ${
              state.currentStep === 1
                ? 'bg-border/30 text-muted cursor-not-allowed'
                : 'bg-surface-hover text-foreground hover:bg-border'
            }`}
          >
            ← Назад
          </button>
          <button
            onClick={handleNext}
            disabled={nextDisabled}
            className={`px-5 lg:px-6 py-2.5 rounded font-medium text-sm transition-colors ${
              nextDisabled
                ? 'bg-border/30 text-muted cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover'
            }`}
          >
            Далее →
          </button>
        </div>
      </div>

      <CostPanel state={state} onUpdateStep10={updateStep10} />
    </div>
  );
}
