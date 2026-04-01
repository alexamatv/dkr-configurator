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
  RobotModel,
  RobotBurModel,
} from '@/types';

export const profiles: ProfileConfig[] = [
  {
    id: 'start',
    name: 'Старт',
    description: 'Рама из металла в порошковом окрасе',
    price: 320000,
    basePrice: 257900,
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
      'Купюроприемник ICT A7 + монетоприемник VNTECVN-5 + карта лояльности',
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
    basePrice: 312900,
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
      'Купюроприемник ICT A7 + монетоприемник VNTECVN-5 + карта лояльности',
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
    basePrice: 807900,
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
  { id: 'foam_gun', name: 'Пистолет пенный с пенонасадкой', price: 10500, selected: false },
  { id: 'water_gun', name: 'Пистолет ВД копье 600мм', price: 9500, selected: false },
  { id: 'ceiling_consoles', name: 'Консоль поворотная (нерж. сталь, 2 шт)', price: 22000, selected: false },
  { id: 'mat_holders', name: 'Держатели ковриков (нерж. сталь, 4 шт)', price: 1500, selected: false },
  { id: 'gun_holders', name: 'Пистолетодержатели (нерж. сталь, 2 шт)', price: 4600, selected: false },
  { id: 'hose_4m', name: 'РВД-шланги облегченные 4 м (2 шт)', price: 14000, selected: false, exclusiveGroup: 'hose' },
  { id: 'hose_5m', name: 'РВД-шланги облегченные 5 м (2 шт)', price: 14000, selected: false, exclusiveGroup: 'hose' },
];

export const bumModels: BumModel[] = [
  { id: 'model_20', name: 'БУМ №20', description: 'Входит в комплект (145 000 ₽)', maxButtons: 5, price: 0 },
  { id: 'model_3', name: 'БУМ №3', description: 'Базовый терминал (170 000 ₽)', maxButtons: 8, price: 25000 },
  { id: 'model_4', name: 'БУМ №4', description: 'Терминал (182 000 ₽)', maxButtons: 8, price: 37000 },
  { id: 'model_6', name: 'БУМ №6', description: 'Компактный терминал (192 000 ₽)', maxButtons: 8, price: 47000 },
  { id: 'model_7', name: 'БУМ №7', description: 'Терминал (352 000 ₽)', maxButtons: 12, price: 207000 },
  { id: 'model_11', name: 'БУМ №11', description: 'Терминал (182 000 ₽)', maxButtons: 8, price: 37000 },
  { id: 'model_12', name: 'БУМ №12', description: 'Терминал (215 000 ₽)', maxButtons: 10, price: 70000 },
  { id: 'model_13', name: 'БУМ №13', description: 'Сенсорный терминал (395 000 ₽)', maxButtons: 10, price: 250000 },
  { id: 'model_15_buttons', name: 'БУМ №15 (кнопки)', description: 'С кнопками, экран не сенсорный (330 000 ₽)', maxButtons: 12, price: 185000 },
  { id: 'model_15_screen', name: 'БУМ №15 (строчный экран)', description: 'Строчный экран (220 000 ₽)', maxButtons: 12, price: 75000 },
  { id: 'model_27', name: 'БУМ №27', description: 'Терминал (215 000 ₽)', maxButtons: 10, price: 70000 },
];

export const paymentSystemLabels: Record<string, string> = {
  bill_acceptor: 'Купюроприемник ICT A7',
  coin_acceptor: 'Монетоприемник VNTECVN-5',
  acquiring: 'Эквайринг (бесконтактная оплата)',
  loyalty_reader: 'Считыватель карт лояльности',
  qr_payment: 'Оплата QR кодом',
};

// Цена при ДОБАВЛЕНИИ. Базовые (входят в комплект) = 0, доп. опции = цена.
export const paymentSystemPrices: Record<string, number> = {
  bill_acceptor: 0,
  coin_acceptor: 0,
  loyalty_reader: 0,
  acquiring: 44000,
  qr_payment: 11000,
};

// Системы оплаты, входящие в базовую комплектацию.
// При снятии — вычитается removalDiscount из стоимости.
export const basePaymentSystems: string[] = ['bill_acceptor', 'coin_acceptor', 'loyalty_reader'];

export const paymentSystemRemovalDiscounts: Record<string, number> = {
  bill_acceptor: 28000,
  coin_acceptor: 6000,
  loyalty_reader: 6000,
};

// Полные цены систем оплаты (для справки в UI)
export const paymentSystemFullPrices: Record<string, number> = {
  bill_acceptor: 50000,
  coin_acceptor: 11000,
  loyalty_reader: 11000,
  acquiring: 44000,
  qr_payment: 11000,
};

// Вычисление стоимости систем оплаты: добавляет цену доп. опций, вычитает скидку за снятие базовых
export function calcPaymentCost(selectedSystems: string[]): number {
  const addCost = selectedSystems.reduce((sum, ps) => sum + (paymentSystemPrices[ps] ?? 0), 0);
  const removalDiscount = basePaymentSystems
    .filter((ps) => !selectedSystems.includes(ps))
    .reduce((sum, ps) => sum + (paymentSystemRemovalDiscounts[ps] ?? 0), 0);
  return addCost - removalDiscount;
}

// Типы кнопок (для будущего использования)
export const buttonTypes = [
  { id: 'mechanical_led', name: 'Механические антивандальные с LED подсветкой', price: 1100 },
  { id: 'piezo', name: 'Сенсорные пьезо кнопки', price: 2200 },
  { id: 'touch', name: 'Наши сенсорные кнопки', price: 3300 },
];

export const defaultBaseFunctions: PostFunction[] = [
  { id: 'water_foam', name: 'Вода с пеной', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'water', name: 'Вода', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'foam', name: 'Пена', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'wax', name: 'Воск', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
  { id: 'pause', name: 'Пауза', isBase: true, enabled: true, buttonPrice: 0, kitPrice: 0 },
];

export const defaultExtraFunctions: PostFunction[] = [
  { id: 'active_chem_seko', name: 'Активная химия (SEKO)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 38000 },
  { id: 'active_chem_ulka', name: 'Активная химия (ULKA)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 28000 },
  { id: 'osmos', name: 'Осмос', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 30000 },
  { id: 'air', name: 'Воздух', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 20000 },
  { id: 'vacuum', name: 'Пылесос (кнопка + силовая на БУМ)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 20000 },
  { id: 'warm_water', name: 'Тёплая вода', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 20000 },
  { id: 'turbo_water', name: 'Турбо вода', isBase: false, enabled: false, option: 'none', premiumOnly: true, buttonPrice: 0, kitPrice: 11000 },
  { id: 'turbo_dry', name: 'Турбосушка 3,3 кВт', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 160000 },
  { id: 'tire_black', name: 'Чернение резины', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 28000 },
  { id: 'call_operator', name: 'Вызов оператора', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 9000 },
  { id: 'degreaser_seko', name: 'Обезжиреватель (SEKO)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 38000 },
  { id: 'degreaser_ulka', name: 'Обезжиреватель (ULKA)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 28000 },
  { id: 'turbo_foam', name: 'Турбо пена / коллекторный подмес', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 132000 },
  { id: 'collector_chem', name: 'Коллекторная подача химии', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 99000 },
  { id: 'bottom_wash', name: 'Мойка днища', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 94000 },
  { id: 'foam_brush', name: 'Пена-Щетка', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 93000 },
  { id: 'tire_pump', name: 'Подкачка шин', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 20000 },
  { id: 'turbo_dry_dog', name: 'Турбосушка 3,3 кВт (собачья)', isBase: false, enabled: false, option: 'none', buttonPrice: 0, kitPrice: 100000 },
];

// Пылесосы на терминал — варианты оборудования (цена без функции 20 000 ₽)
export const vacuumTerminalOptions = [
  { id: 'vac_elsea_basket', name: 'Пылесос Elsea 3,3 кВт в корзине', price: 90000 },
  { id: 'vac_elsea_rolling', name: 'Пылесос Elsea 3,3 кВт перекатной', price: 65000 },
  { id: 'vac_china_basket', name: 'Пылесос китайский 3,3 кВт в корзине', price: 70000 },
  { id: 'vac_china_rolling', name: 'Пылесос китайский 3,3 кВт перекатной', price: 40000 },
  { id: 'vac_wall_seko', name: 'Пылесос на стену (Турбина Секо)', price: 120000 },
  { id: 'vac_1_1kw', name: 'Пылесос 1,1 кВт (нерж. корпус)', price: 121000 },
];

export const dosatorOptions: { id: DosatorChoice; name: string; price: number }[] = [
  { id: 'seko', name: 'SEKO', price: 8000 },
  { id: 'ulka', name: 'Ulka', price: 6000 },
  { id: 'injector', name: 'Инжектор', price: 12000 },
];

// АВД — базовый входит в комплект (0 ₽), остальные с доплатой
export const avdKits = [
  { id: 'hawk_15_20', name: 'HAWK 15-20, мотор 5.5 кВт + bypass (входит в комплект)', price: 0 },
  { id: 'pump_vd_no_frame', name: 'Помпа ВД (без рамы)', price: 65000 },
  { id: 'hawk_15_25', name: 'HAWK 15-25, 7.5 кВт', price: 15000 },
  { id: 'mazzoni_15_20', name: 'MAZZONI 15-20, 5.5 кВт', price: 30000 },
  { id: 'hawk_25_200', name: 'HAWK 25-200 бар (15 л/мин, 5.5 кВт)', price: 85000, premiumOnly: true },
  { id: 'hawk_nmt1520', name: 'HAWK NMT1520 (по запросу)', price: 0 },
  { id: 'hawk_nickel', name: 'HAWK никель (по запросу)', price: 0 },
  { id: 'mazoni_request', name: 'Mazoni (по запросу)', price: 0 },
];

export const osmosOptions: OsmosOption[] = [
  { id: 'osmos_250_std', capacity: '250', level: 'standard', name: '250 л/ч', price: 212000 },
  { id: 'osmos_250_prm', capacity: '250', level: 'premium', name: '250 л/ч Премиум', price: 253000 },
  { id: 'osmos_500_std', capacity: '500', level: 'standard', name: '500 л/ч', price: 253000 },
  { id: 'osmos_500_prm', capacity: '500', level: 'premium', name: '500 л/ч Премиум', price: 322000 },
  { id: 'osmos_1000_std', capacity: '1000', level: 'standard', name: '1000 л/ч', price: 385000 },
  { id: 'osmos_1000_prm', capacity: '1000', level: 'premium', name: '1000 л/ч Премиум', price: 572000 },
];

// Станция повышающая давление (для Step 7)
export const boosterPumpPrice = 53000;

export const arasModels = [
  { id: 'none', name: 'Нет' },
  { id: 'aros_4', name: 'АРОС 4', price: 121000 },
  { id: 'aros_6', name: 'АРОС 6', price: 143000 },
];

export const defaultPostExtras: PostExtra[] = [
  { id: 'valve_hd', name: 'Клапан ВД на пенный пистолет', selected: false, quantity: 0, price: 38000 },
  { id: 'freq_converter', name: 'Частотный преобразователь', selected: false, quantity: 0, price: 44000 },
  { id: 'traffic_light', name: 'Светофор', selected: false, quantity: 0, price: 13000 },
  { id: 'dry_run_sensor', name: 'Датчик сухого хода', selected: false, quantity: 0, price: 17000 },
  { id: 'emergency_valve_elec', name: 'Аварийный клапан электронный', selected: false, quantity: 0, price: 38000 },
  { id: 'valve_nd_start', name: 'Клапан НД для комплекта Старт', selected: false, quantity: 0, price: 17000 },
  { id: 'antifreeze_water', name: 'Система антизамерзания на воду (1 пистолет)', selected: false, quantity: 0, price: 22000 },
  { id: 'antifreeze_water_foam', name: 'Система антизамерзания на воду и пену', selected: false, quantity: 0, price: 66000 },
  { id: 'basket_console', name: 'Корзина + консоль', selected: false, quantity: 0, price: 38000 },
  { id: 'basket_console_hoist', name: 'Корзина + консоль + подвес (таль)', selected: false, quantity: 0, price: 50000 },
  { id: 'manometer', name: 'Манометр ВД 400 бар', selected: false, quantity: 0, price: 5000 },
  { id: 'valve_system', name: 'Система клапанов ВД', selected: false, quantity: 0, price: 15000 },
  { id: 'injectors_extra', name: 'Инжекторы (доп.)', selected: false, quantity: 0, price: 7000 },
];

export const vacuumOptions: VacuumOption[] = [
  { id: 'single', name: 'Пылесос 1-постовой', price: 235000 },
  { id: 'none', name: 'Нет', price: 0 },
];

export const defaultWashExtras: WashExtra[] = [
  { id: 'tank_1m3', name: 'Ёмкость накопительная (1 куб)', selected: false, quantity: 0, price: 50000 },
  { id: 'hose_reel', name: 'Катушка инерционная для шланга пылесоса', selected: false, quantity: 0, price: 17000 },
  { id: 'cloud_register', name: 'Облачная касса (1 год + ФН 15 мес)', selected: false, quantity: 0, price: 120700 },
  { id: 'cloud_register_renewal', name: 'Продление облачной кассы (год)', selected: false, quantity: 0, price: 33600 },
  { id: 'handwash_sink', name: 'Рукомойник', selected: false, quantity: 0, price: 50000 },
  { id: 'dry_fog', name: 'Сухой туман (3 аромата)', selected: false, quantity: 0, price: 250000 },
  { id: 'antifreeze_station', name: 'Установка розлива незамерзайки', selected: false, quantity: 0, price: 40000 },
  { id: 'plate_recognition', name: 'Система распознавания номеров', selected: false, quantity: 0, price: 80000 },
  { id: 'local_server', name: 'Локальный сервер', selected: false, quantity: 0, price: 60000 },
  { id: 'manual_wash', name: 'Ручная мойка (АВД)', selected: false, quantity: 0, price: 35000 },
  { id: 'mat_wash', name: 'Мойка ковриков', selected: false, quantity: 0, price: 25000 },
];

export const managers = [
  { id: 'manager_1', name: 'Иванов И.И.' },
  { id: 'manager_2', name: 'Петров П.П.' },
  { id: 'manager_3', name: 'Сидоров С.С.' },
];

export const dosatorTypes = ['SEKO', 'Ulka', 'Injector'] as const;

// ─── Роботизированная мойка Smartbot DKR 360 ───

export const robotModels: RobotModel[] = [
  {
    id: 'standard_360',
    name: '360 Standard',
    description: 'Базовая роботизированная мойка',
    price: 2600000,
    includedComponents: [
      'Вода ВД из руки',
      'Активная химия 1',
      'Пена веерная одноцветная (4 лейки)',
      'Осмос (подача из штанги шаттла)',
      'Воск',
      'Поворот руки к зеркалам',
      'Продувка магистралей воздухом',
      'Поворот руки при сушке',
      '1 УЗ датчик (длина)',
      'Сушка верхняя (4 вентилятора, 5.5 кВт)',
      'Помпа Pinfl DKR + электродвигатель 18.5 кВт',
      'Насос низкого давления для осмоса',
      'Комплект технического монтажа',
      'Компьютерный блок управления (15" тач экран)',
    ],
  },
  {
    id: 'premium_360',
    name: '360 Premium',
    description: 'Расширенная комплектация + мойка днища',
    price: 2900000,
    includedComponents: [
      'Всё из 360 Standard',
      'Активная химия 2',
      '3 УЗ датчика (ширина)',
      'Мойка днища (12 форсунок)',
      'Боковая предварительная мойка (10 форсунок)',
      'Подсветка RGB',
      'Электродвигатель 22 кВт (вместо 18.5)',
      'Контроль сухого хода помпы',
      'Комплект направляющих для заезда',
    ],
  },
  {
    id: 'cosmo_360',
    name: '360 Cosmo',
    description: 'Максимальная комплектация + мониторинг',
    price: 3100000,
    includedComponents: [
      'Всё из 360 Premium',
      'Пена веерная двухцветная (вместо одноцветной)',
      'Пена лава',
      'Датчик обрыва ремня (доп. безопасность)',
      'Мониторинг: вода ВД, осмос, качество очистки',
      'Мониторинг: соль, температура, моточасы помпы',
      'Мониторинг: расход химии',
    ],
  },
];

export const burModels: RobotBurModel[] = [
  { id: 'bur_2', name: 'БУР 2', description: 'Базовый блок управления', price: 400000 },
  { id: 'bur_4', name: 'БУР 4', description: 'Расширенный блок управления', price: 440000 },
  { id: 'bur_5', name: 'БУР 5', description: 'Топовый блок управления', price: 510000 },
];

// ─── Рамы (для будущего Step 5 / отдельной секции) ───
export const frameOptions = [
  { id: 'frame_mini', name: 'Рама Мини (Старт) Лежачая', price: 7000, note: 'Входит в Старт' },
  { id: 'frame_standard', name: 'Рама Стандарт', price: 17000, note: 'Входит в Стандарт' },
  { id: 'frame_top', name: 'Рама ТОП (Банан)', price: 88000, note: '' },
  { id: 'frame_truck', name: 'Грузовая консоль', price: 77000, note: '' },
];

// ─── Грузовые мойки ───

export const truckWashTypes = [
  {
    id: 'kompak',
    name: 'Портальная мойка КОМПАК (Istobal)',
    price: 9570000,
    currency: 'RUB' as const,
    features: [
      'Портальная мойка для грузовых ТС (до 13.5 м)',
      'Щеточная мойка с 2 вертикальными и 1 горизонтальной щёткой',
      'Система предварительной мойки высокого давления',
      'Система нанесения шампуня',
      'Система финальной сушки',
      'Система рекуперации воды (70%)',
      'Управление через панель оператора с сенсорным экраном',
      '4 программы мойки (легковой, грузовой, автобус, шасси)',
      'Система определения контуров ТС',
      'Рама и конструкция из оцинкованной стали',
      'Электрическое подключение 380В / 50 Гц',
      'Потребляемая мощность до 30 кВт',
      'Давление воды 60–80 бар',
      'Расход воды 200–400 л/мин',
      'Габариты проёма: ширина 3.5 м, высота 4.5 м',
      'Длина рельсового пути: 15–20 м (по ТЗ)',
      'Скорость мойки: 4–6 мин (легковой), 8–12 мин (грузовой)',
      'Вес портала: ~3500 кг',
      'Подготовка фундамента и рельсов (в стоимость монтажа)',
      'Гарантия 1 год',
      'Сервисное обслуживание DKR Group',
    ],
  },
  {
    id: 'smartbot_track',
    name: 'SmartBot Track (проездная)',
    price: 100950,
    currency: 'USD' as const,
    features: [
      'Роботизированная проездная мойка для грузовых ТС',
      'Бесконтактная мойка высоким давлением',
      'Система нанесения активной химии',
      'Финальный ополаск осмосом',
      'Сушка воздухом',
      'Автоматическое определение габаритов ТС',
      'Управление через облачную платформу',
      'Пропускная способность до 15 ТС/час',
      'Потребляемая мощность до 45 кВт',
    ],
  },
];

export const kompakOptions = [
  { id: 'active_chem', name: 'Система нанесения активной химии', price: 1755000 },
  { id: 'lower_hd', name: 'Нижний контур высокого давления', price: 740000 },
  { id: 'underbody', name: 'Мойка днища ВД', price: 720000 },
  { id: 'hd_block', name: 'Блок высокого давления 16.5 кВт', price: 1820000 },
];

export const truckManualPostEquipment = [
  { id: 'avd', name: 'АВД 250 бар, 7.5 кВт (комплект)', price: 125000 },
  { id: 'cable_hanger', name: 'Кабельный подвес 24м', price: 135000 },
];

export const truckManualPostMontage = 200000;

export const kompakMontagePrice = 1080000;

export const truckWaterSystems = [
  { id: 'none', name: 'Не нужно', price: 0 },
  { id: 'cyclone7', name: 'Циклон 7 (7 м³/час)', price: 5250000 },
  { id: 'aros5', name: 'АРОС 5 (5 м³/час)', price: 180000 },
  { id: 'custom', name: 'Своя стоимость', price: 0 },
];

// ─── Другое оборудование (справочные данные) ───
export const otherEquipment = [
  { id: 'valves_nd', name: 'Система клапанов НД', price: 17000 },
  { id: 'freq_conv_standalone', name: 'Частотный преобразователь', price: 44000 },
  { id: 'dry_run_standalone', name: 'Датчик сухого хода', price: 17000 },
  { id: 'emerg_valve_mech', name: 'Аварийный клапан сброса механический', price: 11000 },
  { id: 'emerg_valve_elec', name: 'Аварийный клапан сброса электронный', price: 38000 },
  { id: 'antifreeze_water_standalone', name: 'Система антизамерзания на воду', price: 22000 },
  { id: 'antifreeze_foam_standalone', name: 'Система антизамерзания на воду и пену', price: 66000 },
];
