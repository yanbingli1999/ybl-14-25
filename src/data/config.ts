import { CandyType, Station, Train, BOARD_SIZE } from '@/types';

export const CANDY_CONFIG: Record<CandyType, { name: string; color: string; points: number; emoji: string }> = {
  strawberry: { name: '草莓糖', color: '#FF6B9D', points: 10, emoji: '🍓' },
  lemon: { name: '柠檬糖', color: '#FFD93D', points: 10, emoji: '🍋' },
  mint: { name: '薄荷糖', color: '#6BCB77', points: 10, emoji: '🍀' },
  blueberry: { name: '蓝莓糖', color: '#4D96FF', points: 10, emoji: '🫐' },
  grape: { name: '葡萄糖', color: '#9B59B6', points: 10, emoji: '🍇' },
  rainbow: { name: '彩虹糖', color: 'linear-gradient(135deg, #FF6B9D, #FFD93D, #6BCB77, #4D96FF, #9B59B6)', points: 50, emoji: '🌈' },
  bomb: { name: '炸弹糖', color: '#FF4757', points: 30, emoji: '💣' },
};

export const STATIONS: Station[] = [
  {
    id: 'candy-town',
    name: '糖果小镇',
    reputationRequired: 0,
    themeColor: '#FF6B9D',
    description: '甜蜜的起点，适合新手列车长',
  },
  {
    id: 'lemon-estate',
    name: '柠檬庄园',
    reputationRequired: 100,
    themeColor: '#FFD93D',
    description: '酸爽的柠檬订单，需要更多技巧',
  },
  {
    id: 'mint-forest',
    name: '薄荷森林',
    reputationRequired: 300,
    themeColor: '#6BCB77',
    description: '急单频发的森林车站',
  },
  {
    id: 'blueberry-port',
    name: '蓝莓港口',
    reputationRequired: 600,
    themeColor: '#4D96FF',
    description: '大额订单的港口贸易站',
  },
  {
    id: 'grape-castle',
    name: '葡萄城堡',
    reputationRequired: 1000,
    themeColor: '#9B59B6',
    description: '皇家级别的复杂订单',
  },
];

export const INITIAL_TRAIN: Train = {
  id: 'candy-express',
  name: '糖果快车',
  carriages: [
    { id: 'car-1', candyType: 'strawberry', capacity: 20, currentLoad: 0 },
    { id: 'car-2', candyType: 'lemon', capacity: 20, currentLoad: 0 },
    { id: 'car-3', candyType: 'mint', capacity: 20, currentLoad: 0 },
    { id: 'car-4', candyType: 'blueberry', capacity: 20, currentLoad: 0 },
    { id: 'car-5', candyType: 'grape', capacity: 20, currentLoad: 0 },
  ],
};

export const WAREHOUSE_LEVELS = [
  {
    level: 1,
    name: '简易仓库',
    capacity: 50,
    dailyRent: 5,
    pestResistance: 0.2,
    upgradeCost: 0,
    description: '最基础的仓库，防虫效果差',
  },
  {
    level: 2,
    name: '标准仓库',
    capacity: 100,
    dailyRent: 15,
    pestResistance: 0.4,
    upgradeCost: 200,
    description: '中等容量，防虫效果一般',
  },
  {
    level: 3,
    name: '高级仓库',
    capacity: 200,
    dailyRent: 30,
    pestResistance: 0.6,
    upgradeCost: 500,
    description: '大容量，防虫效果良好',
  },
  {
    level: 4,
    name: '冷藏仓库',
    capacity: 350,
    dailyRent: 60,
    pestResistance: 0.8,
    upgradeCost: 1000,
    description: '超大容量，防虫效果优秀',
  },
  {
    level: 5,
    name: '皇家仓库',
    capacity: 500,
    dailyRent: 100,
    pestResistance: 0.95,
    upgradeCost: 2000,
    description: '顶级仓库，几乎不会变质',
  },
];

export const WAREHOUSE_CONFIG = {
  DECAY_INTERVAL_HOURS: 24,
  DECAY_BASE_RATE: 0.1,
  MAX_STORAGE_DAYS: 7,
  AUTO_STORE_OVERFLOW: true,
};

export const GAME_CONFIG = {
  BOARD_SIZE,
  INITIAL_MOVES: 30,
  COMBO_BONUS_MULTIPLIER: 0.5,
  MATCH_MIN: 3,
  FOUR_MATCH_SPECIAL: 'bomb' as const,
  FIVE_MATCH_SPECIAL: 'rainbow' as const,
  DISPATCH_BASE_REWARD: 50,
  MISMATCH_PENALTY_RATE: 0.3,
  URGENT_BONUS_RATE: 0.5,
  REPUTATION_PER_SUCCESS: 10,
  REPUTATION_PER_FAIL: -5,
  LOAD_PER_MATCH: 1,
};
