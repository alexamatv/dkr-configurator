export type VehicleType = 'passenger' | 'truck';
export type ObjectType = 'self_service' | 'robotic';
export type ProfileType = 'start' | 'standard' | 'premium';

export interface Accessory {
  id: string;
  name: string;
  price: number;
  selected: boolean;
  exclusiveGroup?: string;
  customPrice?: number;
}

export interface BumModel {
  id: string;
  name: string;
  description: string;
  maxButtons: number;
  price: number;
}

export interface ProfileConfig {
  id: ProfileType;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  defaultAvd: string;
  defaultTerminal: string;
  defaultPayments: PaymentSystem[];
  defaultAccessories: string[];
  includedComponents: string[];
}

export type PaymentSystem = 'bill_acceptor' | 'coin_acceptor' | 'acquiring' | 'loyalty_reader';

export type FunctionOption = 'none' | 'button_only' | 'button_and_kit';
export type VacuumType = 'in_post' | 'wall_mounted';

export type DosatorChoice = 'seko' | 'ulka' | 'injector';

export interface PostFunction {
  id: string;
  name: string;
  isBase: boolean;
  enabled: boolean;
  option?: FunctionOption;
  vacuumType?: VacuumType;
  requiresDosator?: boolean;
  selectedDosator?: DosatorChoice;
  premiumOnly?: boolean;
  buttonPrice: number;
  kitPrice: number;
}

export interface Dosator {
  id: string;
  type: 'SEKO' | 'Ulka' | 'Injector';
  quantity: number;
}

export interface PostConfig {
  id: string;
  vehicleType: VehicleType;
  objectType: ObjectType;
  profile: ProfileType;
  accessories: Accessory[];
  bumModel: string;
  paymentSystems: PaymentSystem[];
  customDesign: boolean;
  functions: PostFunction[];
  avdSelections: AvdSelection[];
  customName?: string;
}

export type OsmosCapacity = '250' | '500' | '1000' | '2000';
export type OsmosLevel = 'standard' | 'premium';

export interface OsmosOption {
  id: string;
  capacity: OsmosCapacity;
  level: OsmosLevel;
  name: string;
  price: number;
}

export interface PostExtra {
  id: string;
  name: string;
  selected: boolean;
  quantity: number;
  price: number;
}

export interface VacuumOption {
  id: string;
  name: string;
  price: number;
}

export interface WashExtra {
  id: string;
  name: string;
  selected: boolean;
  quantity: number;
  price: number;
}

export type MontageType = 'none' | 'commissioning' | 'full';
export type Language = 'ru' | 'en';
export type Currency = 'RUB' | 'USD' | 'EUR';

export interface Step1Data {
  vehicleType: VehicleType;
  objectType: ObjectType;
  clientSearch: string;
  manager: string;
}

export interface Step2Data {
  profile: ProfileType;
  accessories: Accessory[];
}

export interface Step3Data {
  bumModel: string;
  paymentSystems: PaymentSystem[];
  customDesign: boolean;
}

export interface Step4Data {
  functions: PostFunction[];
}

export interface AvdSelection {
  id: string;
  avdId: string;
  isDefault: boolean;
}

export interface Step5Data {
  avdSelections: AvdSelection[];
  customPumpPrice?: number;
}

export interface Step7Data {
  osmosOption: string;
  arasModel: string;
  customWaterPrice: number;
}

export interface Step8Data {
  extras: PostExtra[];
  secondPumpEnabled?: boolean;
}

export interface Step9Data {
  vacuumOption: string;
  vacuumQuantity: number;
  extras: WashExtra[];
  pipelinesAirPrice?: number;
  pipelinesWaterPrice?: number;
  pipelinesChemPrice?: number;
}

export interface Step10Data {
  deliveryConditions: string;
  paymentConditions: string;
  region: string;
  currency: Currency;
  discount: number;
  vatEnabled: boolean;
  vat: number;
  montage: MontageType;
  montageExtra: number;
  language: Language;
}

// ─── Robot types ───

export interface RobotModel {
  id: string;
  name: string;
  description: string;
  price: number;
  includedComponents: string[];
}

export interface RobotBurModel {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface RobotOption {
  id: string;
  name: string;
  enabled: boolean;
  price: number;
  includedIn?: string[]; // robot model ids where this is included (price=0)
}

export interface RobotStep2Data {
  robotModel: string;
}

export interface RobotStep3Data {
  burModel: string;
}

export interface RobotStep4Data {
  sideBlowerEnabled: boolean;
  sideBlowerPrice: number;
  guidesEnabled: boolean;
  guidesPrice: number;
}

// ─── Wizard state ───

export interface WizardState {
  currentStep: number;
  step1: Step1Data;
  // MSO branch
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  posts: PostConfig[];
  currentPostIndex: number;
  step7: Step7Data;
  step8: Step8Data;
  step9: Step9Data;
  step10: Step10Data;
  // Robot branch
  robotStep2: RobotStep2Data;
  robotStep3: RobotStep3Data;
  robotStep4: RobotStep4Data;
}
