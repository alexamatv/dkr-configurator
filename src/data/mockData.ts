import type {
  Accessory,
  BumModel,
  PostFunction,
  OsmosOption,
  PostExtra,
  VacuumOption,
  WashExtra,
  Dosator,
} from '@/types';

export const profiles = [
  {
    id: 'start',
    name: 'Старт',
    description: 'Горизонтальная рама',
    price: 150000,
    defaultAvd: 'hawk_15_20',
    defaultDosators: [
      { id: '1', type: 'SEKO' as const, quantity: 2 },
    ],
  },
  {
    id: 'standard',
    name: 'Стандарт',
    description: 'Вертикальная рама + клапаны НД',
    price: 250000,
    defaultAvd: 'hawk_15_25',
    defaultDosators: [
      { id: '1', type: 'SEKO' as const, quantity: 2 },
      { id: '2', type: 'Ulka' as const, quantity: 1 },
    ],
  },
  {
    id: 'premium',
    name: 'Премиум',
    description: 'Вертикальная нержавеющая рама',
    price: 400000,
    defaultAvd: 'mazzoni_15_20',
    defaultDosators: [
      { id: '1', type: 'SEKO' as const, quantity: 3 },
      { id: '2', type: 'Ulka' as const, quantity: 2 },
    ],
  },
];

export const defaultAccessories: Accessory[] = [
  { id: 'foam_gun', name: 'Пистолет пенный', price: 5000, selected: false },
  { id: 'water_gun', name: 'Пистолет водяной', price: 4500, selected: false },
  { id: 'ceiling_consoles', name: 'Потолочные консоли', price: 8000, selected: false },
  { id: 'mat_holder', name: 'Держатель для ковриков', price: 3000, selected: false },
  { id: 'gun_holder', name: 'Держатель для пистолетов', price: 2500, selected: false },
  { id: 'hose_4m', name: 'РВД-шланги 4м', price: 6000, selected: false },
  { id: 'hose_5m', name: 'РВД-шланги 5м', price: 7500, selected: false },
];

export const bumModels: BumModel[] = [
  { id: 'model_6', name: 'Модель №6', description: 'Компактный терминал', maxButtons: 8, price: 45000 },
  { id: 'model_13', name: 'Модель №13', description: 'Стандартный терминал', maxButtons: 10, price: 55000 },
  { id: 'model_15', name: 'Модель №15', description: 'Расширенный терминал', maxButtons: 12, price: 65000 },
  { id: 'model_3', name: 'Модель №3', description: 'Базовый терминал', maxButtons: 8, price: 40000 },
];

export const paymentSystemLabels: Record<string, string> = {
  bill_acceptor: 'Купюроприемник',
  coin_acceptor: 'Монетоприемник',
  acquiring: 'Эквайринг',
  loyalty_reader: 'Считыватель лояльности',
};

export const paymentSystemPrices: Record<string, number> = {
  bill_acceptor: 25000,
  coin_acceptor: 15000,
  acquiring: 20000,
  loyalty_reader: 10000,
};

export const defaultBaseFunctions: PostFunction[] = [
  { id: 'shampoo', name: 'Шампунь', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'water', name: 'Вода', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'foam', name: 'Пена', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'wax', name: 'Воск', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'pause', name: 'Пауза', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
];

export const defaultExtraFunctions: PostFunction[] = [
  { id: 'osmos', name: 'Осмос', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 15000 },
  { id: 'vacuum', name: 'Пылесос', isBase: false, enabled: false, option: 'none', vacuumType: 'in_post', buttonPrice: 2000, kitPrice: 25000 },
  { id: 'air', name: 'Воздух', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 12000 },
  { id: 'turbo_dry', name: 'Турбосушка', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 35000 },
  { id: 'tire_black', name: 'Чернение резины', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 10000 },
  { id: 'warm_water', name: 'Тёплая вода', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 20000 },
  { id: 'anti_bug', name: 'Антимошка', isBase: false, enabled: false, option: 'none', buttonPrice: 2000, kitPrice: 8000 },
];

export const avdKits = [
  { id: 'hawk_15_20', name: 'HAWK 15-20, 5.5 кВт', price: 80000 },
  { id: 'hawk_15_25', name: 'HAWK 15-25, 7.5 кВт', price: 95000 },
  { id: 'mazzoni_15_20', name: 'MAZZONI 15-20, 5.5 кВт', price: 110000 },
];

export const osmosOptions: OsmosOption[] = [
  { id: 'osmos_250_std', capacity: '250', level: 'standard', name: '250 л/ч Стандарт', price: 50000 },
  { id: 'osmos_250_prm', capacity: '250', level: 'premium', name: '250 л/ч Премиум', price: 75000 },
  { id: 'osmos_500_std', capacity: '500', level: 'standard', name: '500 л/ч Стандарт', price: 80000 },
  { id: 'osmos_500_prm', capacity: '500', level: 'premium', name: '500 л/ч Премиум', price: 110000 },
  { id: 'osmos_1000_std', capacity: '1000', level: 'standard', name: '1000 л/ч Стандарт', price: 120000 },
  { id: 'osmos_1000_prm', capacity: '1000', level: 'premium', name: '1000 л/ч Премиум', price: 160000 },
  { id: 'osmos_2000_std', capacity: '2000', level: 'standard', name: '2000 л/ч Стандарт', price: 200000 },
  { id: 'osmos_2000_prm', capacity: '2000', level: 'premium', name: '2000 л/ч Премиум', price: 280000 },
];

export const arasModels = [
  { id: 'none', name: 'Нет' },
  { id: 'aras_1', name: 'ARAS-1', price: 30000 },
  { id: 'aras_2', name: 'ARAS-2', price: 45000 },
  { id: 'aras_3', name: 'ARAS-3', price: 60000 },
  { id: 'aras_4', name: 'ARAS-4', price: 80000 },
  { id: 'aras_5', name: 'ARAS-5', price: 100000 },
];

export const defaultPostExtras: PostExtra[] = [
  { id: 'manometer', name: 'Манометр ВД 400 бар', selected: false, quantity: 0, price: 5000 },
  { id: 'valve_hd', name: 'Клапан ВД 400 бар', selected: false, quantity: 0, price: 8000 },
  { id: 'winter_kit', name: 'Зимний комплект', selected: false, quantity: 0, price: 35000 },
  { id: 'freq_converter', name: 'Частотный преобразователь', selected: false, quantity: 0, price: 25000 },
  { id: 'valve_system', name: 'Система клапанов ВД', selected: false, quantity: 0, price: 15000 },
  { id: 'bottom_wash', name: 'Мойка днища', selected: false, quantity: 0, price: 20000 },
  { id: 'traffic_light', name: 'Светофор', selected: false, quantity: 0, price: 12000 },
  { id: 'injectors_extra', name: 'Инжекторы (доп.)', selected: false, quantity: 0, price: 7000 },
];

export const vacuumOptions: VacuumOption[] = [
  { id: 'single_standard', name: 'Однопостовой стандарт', price: 45000 },
  { id: 'single_premium', name: 'Однопостовой премиум', price: 65000 },
  { id: 'dual_top', name: 'Двухпостовой топ', price: 95000 },
  { id: 'none', name: 'Нет', price: 0 },
];

export const defaultWashExtras: WashExtra[] = [
  { id: 'antifreeze_station', name: 'Установка розлива незамерзайки', selected: false, quantity: 0, price: 40000 },
  { id: 'pressure_station', name: 'Станция повышающего давления', selected: false, quantity: 0, price: 55000 },
  { id: 'plate_recognition', name: 'Система распознавания номеров', selected: false, quantity: 0, price: 80000 },
  { id: 'local_server', name: 'Локальный сервер', selected: false, quantity: 0, price: 60000 },
  { id: 'manual_wash', name: 'Ручная мойка (АВД)', selected: false, quantity: 0, price: 35000 },
  { id: 'mat_wash', name: 'Мойка ковриков', selected: false, quantity: 0, price: 25000 },
  { id: 'online_cash', name: 'Онлайн-касса с ФМ', selected: false, quantity: 0, price: 45000 },
];

export const managers = [
  { id: 'manager_1', name: 'Иванов И.И.' },
  { id: 'manager_2', name: 'Петров П.П.' },
  { id: 'manager_3', name: 'Сидоров С.С.' },
];

export const regions = [
  { id: 'moscow', name: 'Москва' },
  { id: 'spb', name: 'Санкт-Петербург' },
  { id: 'regions', name: 'Регионы' },
];

export const dosatorTypes = ['SEKO', 'Ulka', 'Injector'] as const;
