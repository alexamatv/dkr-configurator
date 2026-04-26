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
  TruckStep2Data,
  TruckBurData,
  TruckStep3Data,
  TruckStep4Data,
  TruckStep5Data,
} from '@/types';
import {
  defaultVacuumSubOptions,
  defaultDispenserSubOptions,
  defaultFoggerSubOptions,
  robotExtraEquipment,
} from '@/data/mockData';
import { useData, type DataContextValue } from '@/context/DataContext';
import { HintsProvider } from '@/context/HintsContext';
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
import { TruckStep2Type } from './steps/TruckStep2Type';
import { TruckStep3Bur } from './steps/TruckStep3Bur';
import { TruckStep3Options } from './steps/TruckStep3Options';
import { TruckStep4ManualPost } from './steps/TruckStep4ManualPost';
import { TruckStep5Water } from './steps/TruckStep5Water';

// Функции, которые входят в комплект Премиум (становятся isBase + enabled)
const premiumIncludedFunctions = [
  'osmos', 'turbo_water', 'active_chem_seko', 'call_operator',
];

function applyProfileDefaults(data: DataContextValue, profileId: string) {
  const profile = data.profiles.find((p) => p.id === profileId);
  if (!profile) return null;
  const isPremium = profileId === 'premium';

  const step4Functions = [
    ...data.defaultBaseFunctions.map((f) => ({ ...f })),
    ...data.defaultExtraFunctions.map((f) => {
      if (isPremium && premiumIncludedFunctions.includes(f.id)) {
        return { ...f, isBase: true, enabled: true, option: undefined };
      }
      return { ...f };
    }),
  ];

  return {
    step2: {
      profile: profileId as WizardState['step2']['profile'],
      accessories: data.defaultAccessories.map((a) => ({
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

function createInitialState(data: DataContextValue): WizardState {
  const defaults = applyProfileDefaults(data, 'standard')!;
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
      boosterPump: false,
      softeningAll: false,
      softeningAllPrice: 0,
      softeningOsmos: false,
      softeningOsmosPrice: 0,
    },
    step8: {
      extras: data.defaultPostExtras.map((e) => ({ ...e })),
    },
    step9: {
      vacuumOption: 'none',
      vacuumQuantity: 0,
      vacuumSubOptions: defaultVacuumSubOptions.map((o) => ({ ...o })),
      dispenserSubOptions: defaultDispenserSubOptions.map((o) => ({ ...o })),
      foggerSubOptions: defaultFoggerSubOptions.map((o) => ({ ...o })),
      extras: data.defaultWashExtras.map((e) => ({ ...e })),
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
      robotMontage: false,
      language: 'ru',
    },
    // Robot
    robotStep2: { robotModel: '' },
    robotStep3: { burModel: '' },
    robotStep4: { sideBlowerEnabled: false, sideBlowerPrice: 0, guidesEnabled: false, guidesPrice: 0, extras: robotExtraEquipment.map((e) => ({ id: e.id, selected: false })) },
    // Truck
    truckStep2: { selectedType: '' },
    truckBur: { burModel: 'bur_2' },
    truckStep3: { selectedOptions: [], customOptionsPrice: 0 },
    truckStep4: { manualPostEnabled: false, avdCount: 0, hangerCount: 0 },
    truckStep5: { selectedWater: '', customWaterPrice: 0 },
  };
}

export function Wizard() {
  const data = useData();
  const [state, setState] = useState<WizardState>(() => createInitialState(data));

  const isRobot = state.step1.objectType === 'robotic';
  const isTruck = state.step1.objectType === 'truck';
  const maxStep = isTruck ? 7 : isRobot ? 7 : 10;

  const setStep = (step: number) => setState((s) => ({ ...s, currentStep: Math.min(step, maxStep) }));

  const updateStep1 = useCallback((data: Step1Data) => {
    setState((s) => {
      // Reset step to 1 when switching objectType to avoid being on an invalid step
      const switched = data.objectType !== s.step1.objectType;
      return { ...s, step1: data, ...(switched ? { currentStep: 1 } : {}) };
    });
  }, []);
  const updateStep2 = useCallback((newData: Step2Data) => {
    setState((s) => {
      if (newData.profile !== s.step2.profile) {
        const defaults = applyProfileDefaults(data, newData.profile);
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
      return { ...s, step2: newData };
    });
  }, [data]);
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

  // Truck updaters
  const updateTruckStep2 = useCallback((data: TruckStep2Data) => setState((s) => ({ ...s, truckStep2: data })), []);
  const updateTruckBur = useCallback((data: TruckBurData) => setState((s) => ({ ...s, truckBur: data })), []);
  const updateTruckStep3 = useCallback((data: TruckStep3Data) => setState((s) => ({ ...s, truckStep3: data })), []);
  const updateTruckStep4 = useCallback((data: TruckStep4Data) => setState((s) => ({ ...s, truckStep4: data })), []);
  const updateTruckStep5 = useCallback((data: TruckStep5Data) => setState((s) => ({ ...s, truckStep5: data })), []);

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
    const defaults = applyProfileDefaults(data, 'standard')!;
    setState((s) => ({
      ...s,
      currentStep: 1,
      currentPostIndex: -1,
      step2: defaults.step2,
      step3: defaults.step3,
      step4: defaults.step4,
      step5: defaults.step5,
    }));
  }, [saveCurrentPostToList, data]);

  const handleFinishPosts = useCallback(() => {
    setStep(7);
  }, []);

  // ─── Step rendering ───
  const renderMsoStep = () => {
    switch (state.currentStep) {
      case 2:
        return <Step2BaseConfig data={state.step2} onChange={updateStep2} />;
      case 3:
        return <Step3Terminals data={state.step3} onChange={updateStep3} profile={state.step2.profile} />;
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

  const renderTruckStep = () => {
    switch (state.currentStep) {
      case 2:
        return <TruckStep2Type data={state.truckStep2} onChange={updateTruckStep2} />;
      case 3:
        return <TruckStep3Bur data={state.truckBur} onChange={updateTruckBur} />;
      case 4:
        return <TruckStep3Options data={state.truckStep3} selectedType={state.truckStep2.selectedType} onChange={updateTruckStep3} />;
      case 5:
        return <TruckStep4ManualPost data={state.truckStep4} onChange={updateTruckStep4} />;
      case 6:
        return <TruckStep5Water data={state.truckStep5} onChange={updateTruckStep5} />;
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
    return isTruck ? renderTruckStep() : isRobot ? renderRobotStep() : renderMsoStep();
  };

  const handleNext = () => {
    if (!isRobot && !isTruck && state.currentStep === 5) {
      saveCurrentPostToList();
      setStep(6);
    } else {
      setState((s) => ({ ...s, currentStep: Math.min(s.currentStep + 1, maxStep) }));
    }
  };

  // Water validation: for MSO on step 7, for Robot on step 5, for Truck on step 5
  const waterValid = (() => {
    if (isTruck && state.currentStep === 6) {
      return state.truckStep5.selectedWater !== '';
    }
    const waterStep = isRobot ? 5 : 7;
    if (state.currentStep !== waterStep) return true;
    return (state.step7.osmosOption !== '' && state.step7.arasModel !== '') || (state.step7.customWaterPrice > 0);
  })();
  const nextDisabled = state.currentStep === maxStep || !waterValid;

  return (
    <HintsProvider>
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      <StepNavigation currentStep={state.currentStep} objectType={state.step1.objectType} onStepClick={setStep} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-36 lg:pb-8">
          <div className="max-w-[900px]">
            {renderStep()}
          </div>
        </div>

        <div className="shrink-0 p-3 lg:p-4 border-t border-border bg-surface flex justify-between fixed bottom-0 left-0 right-0 z-40 lg:static">
          <button
            onClick={() => setState((s) => ({ ...s, currentStep: Math.max(s.currentStep - 1, 1) }))}
            disabled={state.currentStep === 1}
            className={`w-[160px] h-11 rounded-lg font-medium text-sm transition-colors ${
              state.currentStep === 1
                ? 'border border-border/30 text-muted cursor-not-allowed'
                : 'border border-border text-foreground hover:bg-surface-hover'
            }`}
          >
            ← Назад
          </button>
          <button
            onClick={handleNext}
            disabled={nextDisabled}
            className={`w-[160px] h-11 rounded-lg font-medium text-sm transition-colors ${
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
    </HintsProvider>
  );
}
