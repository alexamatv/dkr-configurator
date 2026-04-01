import type {
  Accessory,
  BumModel,
  PostFunction,
  OsmosOption,
  PostExtra,
  VacuumOption,
  WashExtra,
  ProfileConfig,
  DosatorChoice,
} from '@/types';

export const profiles: ProfileConfig[] = [
  {
    id: 'start',
    name: 'Старт',
    description: 'Рама из металла в порошковом окрасе',
    price: 320000,
    basePrice: 250000,
    defaultAvd: 'hawk_15_20',

    defaultTerminal: 'model_20',
    defaultPayments: ['bill_acceptor', 'coin_acceptor', 'loyalty_reader'],
    defaultAccessories: [
      'foam_gun',
      'water_gun',
      'ceiling_consoles',
      'mat_holders',
      'gun_holders',
      'hose_4m',
    ],
    includedComponents: [
      'Терминал БУМ №20 (до 5 кнопок)',
      'Купюроприемник + монетоприемник + карта лояльности',
      '2 дозатора Ulka',
      '2 поворотные консоли',
      'HAWK 15-20, мотор 5.5 кВт + bypass',
      '4 держателя для ковриков',
      '2 держателя для пистолетов',
      '2 облегченных РВД-шланга 4 м',
      'Рама из металла в порошковом окрасе',
      'Плата реле на 8 контактов',
      'Блок питания 12В',
      'Пускатель',
      'Клапан сброса воды по перегреву',
    ],
  },
  {
    id: 'standard',
    name: 'Стандарт',
    description: 'Вертикальная рама + клапаны НД',
    price: 375000,
    basePrice: 305000,
    defaultAvd: 'hawk_15_20',

    defaultTerminal: 'model_20',
    defaultPayments: ['bill_acceptor', 'coin_acceptor', 'loyalty_reader'],
    defaultAccessories: [
      'foam_gun',
      'water_gun',
      'ceiling_consoles',
      'mat_holders',
      'gun_holders',
      'hose_4m',
    ],
    includedComponents: [
      'Терминал БУМ №20 (до 5 кнопок)',
      'Купюроприемник + монетоприемник + карта лояльности',
      '2 дозатора SEKO',
      '2 поворотные консоли',
      'HAWK 15-20, мотор 5.5 кВт + bypass',
      '4 держателя для ковриков',
      '2 держателя для пистолетов',
      '2 облегченных РВД-шланга 4 м',
      'Вертикальная рама + клапаны НД',
      'Плата реле на 8 контактов',
      'Блок питания 12В',
      'Пускатель',
      'Клапан сброса воды по перегреву',
      'Электромагнитный клапан для входа воды',
      'Аварийный клапан сброса низкого давления',
    ],
  },
  {
    id: 'premium',
    name: 'Премиум',
    description: 'Полная комплектация, сенсорный терминал, эквайринг',
    price: 818000,
    basePrice: 800000,
    defaultAvd: 'hawk_25_200',

    defaultTerminal: 'model_13',
    defaultPayments: ['bill_acceptor', 'coin_acceptor', 'acquiring', 'loyalty_reader'],
    defaultAccessories: [
      'foam_gun',
      'water_gun',
      'ceiling_consoles',
      'mat_holders',
      'gun_holders',
      'hose_4m',
    ],
    includedComponents: [
      'Терминал БУМ №13 (сенсорный экран, до 10 кнопок)',
      'Купюроприемник ICT A7',
      'Монетоприемник VNTECVN-5',
      'Эквайринг (бесконтактная оплата)',
      'Считыватель карт лояльности',
      'Помпа HAWK 25-200 бар (15 л/мин, 5.5 кВт)',
      'Частотный преобразователь',
      'Система защиты двигателя by pass',
      'Система клапанов низкого давления',
      'Щит автоматики',
      'Система клапанов для осмоса',
      'Система дозации SEKO x2',
      'Консоли поворотные x2 (нерж. сталь)',
      'Пистолет ВД копье 600мм',
      'Пистолет пенный с пенонасадкой',
      'Держатели ковриков x4',
      'Пистолетодержатели x2',
      'Программы: Активная химия, Вода с пеной, Вода, Турбо вода, Пена, Воск, Осмос, Пауза, Вызов оператора',
    ],
  },
];

// Аксессуары с реальными ценами. Шланги 4м/5м — взаимоисключающие (exclusiveGroup: 'hose').
export const defaultAccessories: Accessory[] = [
  { id: 'foam_gun', name: 'Пистолет пенный', price: 12000, selected: false },
  { id: 'water_gun', name: 'Пистолет водяной', price: 12000, selected: false },
  { id: 'ceiling_consoles', name: 'Поворотные консоли (2 шт)', price: 18000, selected: false },
  { id: 'mat_holders', name: 'Держатели для ковриков (4 шт)', price: 8000, selected: false },
  { id: 'gun_holders', name: 'Держатели для пистолетов (2 шт)', price: 6000, selected: false },
  { id: 'hose_4m', name: 'РВД-шланги облегченные 4 м (2 шт)', price: 14000, selected: false, exclusiveGroup: 'hose' },
  { id: 'hose_5m', name: 'РВД-шланги облегченные 5 м (2 шт)', price: 14000, selected: false, exclusiveGroup: 'hose' },
];

export const bumModels: BumModel[] = [
  { id: 'model_20', name: 'БУМ №20', description: 'Входит в комплект', maxButtons: 5, price: 0 },
  { id: 'model_6', name: 'БУМ №6', description: 'Компактный терминал', maxButtons: 8, price: 45000 },
  { id: 'model_13', name: 'БУМ №13', description: 'Стандартный терминал', maxButtons: 10, price: 55000 },
  { id: 'model_15', name: 'БУМ №15', description: 'Расширенный терминал', maxButtons: 12, price: 65000 },
  { id: 'model_3', name: 'БУМ №3', description: 'Базовый терминал', maxButtons: 8, price: 40000 },
];

export const paymentSystemLabels: Record<string, string> = {
  bill_acceptor: 'Купюроприемник',
  coin_acceptor: 'Монетоприемник',
  acquiring: 'Эквайринг',
  loyalty_reader: 'Считыватель карт лояльности',
};

// Системы оплаты, входящие в комплект — 0 ₽, доп. — с ценой
export const paymentSystemPrices: Record<string, number> = {
  bill_acceptor: 0,
  coin_acceptor: 0,
  acquiring: 40000,
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
  { id: 'osmos', name: 'Осмос', isBase: false, enabled: false, option: 'none', buttonPrice: 5000, kitPrice: 25000 },
  { id: 'vacuum', name: 'Пылесос', isBase: false, enabled: false, option: 'none', vacuumType: 'in_post', buttonPrice: 5000, kitPrice: 30000 },
  { id: 'air', name: 'Воздух', isBase: false, enabled: false, option: 'none', buttonPrice: 5000, kitPrice: 20000 },
  { id: 'turbo_dry', name: 'Турбосушка', isBase: false, enabled: false, option: 'none', buttonPrice: 5000, kitPrice: 35000 },
  { id: 'turbo_water', name: 'Турбо вода', isBase: false, enabled: false, option: 'none', premiumOnly: true, buttonPrice: 5000, kitPrice: 20000 },
  { id: 'tire_black', name: 'Чернение резины', isBase: false, enabled: false, option: 'none', buttonPrice: 5000, kitPrice: 15000 },
  { id: 'warm_water', name: 'Тёплая вода', isBase: false, enabled: false, option: 'none', buttonPrice: 5000, kitPrice: 20000 },
  { id: 'anti_bug', name: 'Антимошка', isBase: false, enabled: false, option: 'none', requiresDosator: true, selectedDosator: 'seko', buttonPrice: 5000, kitPrice: 15000 },
  { id: 'active_chem', name: 'Активная химия', isBase: false, enabled: false, option: 'none', requiresDosator: true, selectedDosator: 'seko', buttonPrice: 5000, kitPrice: 18000 },
  { id: 'call_operator', name: 'Вызов оператора', isBase: false, enabled: false, option: 'none', buttonPrice: 3000, kitPrice: 10000 },
  { id: 'open_gates', name: 'Открытие ворот', isBase: false, enabled: false, option: 'none', buttonPrice: 3000, kitPrice: 12000 },
];

export const dosatorOptions: { id: DosatorChoice; name: string; price: number }[] = [
  { id: 'seko', name: 'SEKO', price: 8000 },
  { id: 'ulka', name: 'Ulka', price: 6000 },
  { id: 'injector', name: 'Инжектор', price: 12000 },
];

// АВД — базовый входит в комплект (0 ₽), остальные с доплатой
export const avdKits = [
  { id: 'hawk_15_20', name: 'HAWK 15-20, мотор 5.5 кВт + bypass (входит в комплект)', price: 0 },
  { id: 'hawk_15_25', name: 'HAWK 15-25, 7.5 кВт', price: 15000 },
  { id: 'mazzoni_15_20', name: 'MAZZONI 15-20, 5.5 кВт', price: 30000 },
  { id: 'hawk_25_200', name: 'HAWK 25-200 бар (15 л/мин, 5.5 кВт)', price: 85000, premiumOnly: true },
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

export const dosatorTypes = ['SEKO', 'Ulka', 'Injector'] as const;
