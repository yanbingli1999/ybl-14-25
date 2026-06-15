import { Warehouse, WarehouseItem, CandyType, WarehouseLevel, BASIC_CANDY_TYPES } from '@/types';
import { WAREHOUSE_LEVELS, WAREHOUSE_CONFIG } from '@/data/config';

export function createInitialWarehouse(): Warehouse {
  return {
    level: 1,
    items: [],
    lastRentCollectedAt: Date.now(),
    lastDecayAt: Date.now(),
  };
}

export function validateWarehouse(warehouse: Warehouse): Warehouse {
  let cleaned = { ...warehouse };

  if (!cleaned.level || typeof cleaned.level !== 'number' || cleaned.level < 1) {
    cleaned.level = 1;
  }
  if (cleaned.level > WAREHOUSE_LEVELS.length) {
    cleaned.level = WAREHOUSE_LEVELS.length;
  }

  if (!Array.isArray(cleaned.items)) {
    cleaned.items = [];
  }

  cleaned.items = cleaned.items
    .filter(item => 
      item && 
      typeof item.candyType === 'string' && 
      BASIC_CANDY_TYPES.includes(item.candyType as CandyType) &&
      typeof item.quantity === 'number' && 
      item.quantity > 0 &&
      Number.isInteger(item.quantity) &&
      typeof item.storedAt === 'number' &&
      item.storedAt > 0
    )
    .map(item => ({
      ...item,
      quantity: Math.floor(Math.max(0, item.quantity)),
    }))
    .filter(item => item.quantity > 0);

  const capacity = getWarehouseCapacity(cleaned);
  let totalUsed = 0;
  const validItems: WarehouseItem[] = [];
  
  for (const item of cleaned.items) {
    if (totalUsed + item.quantity <= capacity) {
      validItems.push(item);
      totalUsed += item.quantity;
    } else {
      const remaining = capacity - totalUsed;
      if (remaining > 0) {
        validItems.push({ ...item, quantity: remaining });
        totalUsed += remaining;
      }
      break;
    }
  }
  cleaned.items = validItems;

  if (!cleaned.lastRentCollectedAt || typeof cleaned.lastRentCollectedAt !== 'number') {
    cleaned.lastRentCollectedAt = Date.now();
  }
  if (!cleaned.lastDecayAt || typeof cleaned.lastDecayAt !== 'number') {
    cleaned.lastDecayAt = Date.now();
  }

  return cleaned;
}

export function getWarehouseLevel(level: number): WarehouseLevel {
  return WAREHOUSE_LEVELS.find(l => l.level === level) || WAREHOUSE_LEVELS[0];
}

export function getWarehouseCapacity(warehouse: Warehouse): number {
  const level = getWarehouseLevel(warehouse.level);
  return level.capacity;
}

export function getWarehouseUsed(warehouse: Warehouse): number {
  return warehouse.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getWarehouseAvailable(warehouse: Warehouse): number {
  return getWarehouseCapacity(warehouse) - getWarehouseUsed(warehouse);
}

export function getCandyQuantity(warehouse: Warehouse, candyType: CandyType): number {
  return warehouse.items
    .filter(item => item.candyType === candyType)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function storeCandies(
  warehouse: Warehouse,
  candyType: CandyType,
  quantity: number
): { warehouse: Warehouse; stored: number; rejected: number } {
  if (!BASIC_CANDY_TYPES.includes(candyType)) {
    return { warehouse: { ...warehouse }, stored: 0, rejected: quantity };
  }

  const safeQuantity = Math.floor(Math.max(0, quantity));
  if (safeQuantity <= 0) {
    return { warehouse: { ...warehouse }, stored: 0, rejected: 0 };
  }

  const available = getWarehouseAvailable(warehouse);
  const toStore = Math.min(safeQuantity, available);
  const rejected = safeQuantity - toStore;

  if (toStore <= 0) {
    return { warehouse: { ...warehouse }, stored: 0, rejected: safeQuantity };
  }

  const newItem: WarehouseItem = {
    candyType,
    quantity: toStore,
    storedAt: Date.now(),
  };

  const newItems = [...warehouse.items, newItem];

  return {
    warehouse: {
      ...warehouse,
      items: newItems,
    },
    stored: toStore,
    rejected,
  };
}

export function storeMultipleCandies(
  warehouse: Warehouse,
  candyCounts: Record<CandyType, number>
): { warehouse: Warehouse; stored: Record<CandyType, number>; rejected: Record<CandyType, number> } {
  let currentWarehouse = { ...warehouse };
  const stored: Record<string, number> = {};
  const rejected: Record<string, number> = {};

  for (const candyType of Object.keys(candyCounts) as CandyType[]) {
    const quantity = candyCounts[candyType];
    const result = storeCandies(currentWarehouse, candyType, quantity);
    currentWarehouse = result.warehouse;
    stored[candyType] = result.stored;
    rejected[candyType] = result.rejected;
  }

  return {
    warehouse: currentWarehouse,
    stored: stored as Record<CandyType, number>,
    rejected: rejected as Record<CandyType, number>,
  };
}

export function retrieveCandies(
  warehouse: Warehouse,
  candyType: CandyType,
  quantity: number
): { warehouse: Warehouse; retrieved: number } {
  let remaining = quantity;
  const newItems: WarehouseItem[] = [];

  const sortedItems = [...warehouse.items]
    .filter(item => item.candyType === candyType)
    .sort((a, b) => a.storedAt - b.storedAt);

  const otherItems = warehouse.items.filter(item => item.candyType !== candyType);

  for (const item of sortedItems) {
    if (remaining <= 0) {
      newItems.push(item);
      continue;
    }

    if (item.quantity <= remaining) {
      remaining -= item.quantity;
    } else {
      newItems.push({
        ...item,
        quantity: item.quantity - remaining,
      });
      remaining = 0;
    }
  }

  return {
    warehouse: {
      ...warehouse,
      items: [...otherItems, ...newItems],
    },
    retrieved: quantity - remaining,
  };
}

export function calculateDecay(warehouse: Warehouse, now: number = Date.now()): {
  warehouse: Warehouse;
  decayed: Record<CandyType, number>;
  totalDecayed: number;
} {
  const level = getWarehouseLevel(warehouse.level);
  const timeDiff = now - warehouse.lastDecayAt;
  const hoursPassed = timeDiff / (1000 * 60 * 60);
  const intervals = Math.floor(hoursPassed / WAREHOUSE_CONFIG.DECAY_INTERVAL_HOURS);

  if (intervals <= 0) {
    return { warehouse: { ...warehouse }, decayed: {} as Record<CandyType, number>, totalDecayed: 0 };
  }

  const decayRate = WAREHOUSE_CONFIG.DECAY_BASE_RATE * (1 - level.pestResistance);
  const decayed: Record<string, number> = {};
  let totalDecayed = 0;

  const newItems = warehouse.items.map(item => {
    const ageHours = (now - item.storedAt) / (1000 * 60 * 60);
    const ageIntervals = Math.floor(ageHours / WAREHOUSE_CONFIG.DECAY_INTERVAL_HOURS);
    const applicableIntervals = Math.min(intervals, ageIntervals);

    if (applicableIntervals <= 0) return item;

    const decayMultiplier = Math.pow(1 - decayRate, applicableIntervals);
    const newQuantity = Math.floor(item.quantity * decayMultiplier);
    const itemDecayed = item.quantity - newQuantity;

    if (itemDecayed > 0) {
      decayed[item.candyType] = (decayed[item.candyType] || 0) + itemDecayed;
      totalDecayed += itemDecayed;
    }

    return {
      ...item,
      quantity: newQuantity,
    };
  }).filter(item => item.quantity > 0);

  const maxAgeMs = WAREHOUSE_CONFIG.MAX_STORAGE_DAYS * 24 * 60 * 60 * 1000;
  const finalItems = newItems.filter(item => now - item.storedAt < maxAgeMs);

  for (const item of newItems) {
    if (now - item.storedAt >= maxAgeMs) {
      decayed[item.candyType] = (decayed[item.candyType] || 0) + item.quantity;
      totalDecayed += item.quantity;
    }
  }

  return {
    warehouse: {
      ...warehouse,
      items: finalItems,
      lastDecayAt: now,
    },
    decayed: decayed as Record<CandyType, number>,
    totalDecayed,
  };
}

export function calculateRent(warehouse: Warehouse, now: number = Date.now()): {
  warehouse: Warehouse;
  rentDue: number;
  daysPassed: number;
} {
  const level = getWarehouseLevel(warehouse.level);
  const timeDiff = now - warehouse.lastRentCollectedAt;
  const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (daysPassed <= 0) {
    return { warehouse: { ...warehouse }, rentDue: 0, daysPassed: 0 };
  }

  const rentDue = level.dailyRent * daysPassed;

  return {
    warehouse: {
      ...warehouse,
      lastRentCollectedAt: warehouse.lastRentCollectedAt + daysPassed * 24 * 60 * 60 * 1000,
    },
    rentDue,
    daysPassed,
  };
}

export function upgradeWarehouse(warehouse: Warehouse, coins: number): {
  warehouse: Warehouse;
  success: boolean;
  cost: number;
  newLevel: WarehouseLevel | null;
} {
  const nextLevelData = WAREHOUSE_LEVELS.find(l => l.level === warehouse.level + 1);

  if (!nextLevelData) {
    return { warehouse: { ...warehouse }, success: false, cost: 0, newLevel: null };
  }

  if (coins < nextLevelData.upgradeCost) {
    return { warehouse: { ...warehouse }, success: false, cost: nextLevelData.upgradeCost, newLevel: null };
  }

  return {
    warehouse: {
      ...warehouse,
      level: nextLevelData.level,
    },
    success: true,
    cost: nextLevelData.upgradeCost,
    newLevel: nextLevelData,
  };
}

export function canUpgradeWarehouse(warehouse: Warehouse): boolean {
  return warehouse.level < WAREHOUSE_LEVELS.length;
}

export function getNextWarehouseLevel(warehouse: Warehouse): WarehouseLevel | null {
  return WAREHOUSE_LEVELS.find(l => l.level === warehouse.level + 1) || null;
}

export function processWarehouseTick(warehouse: Warehouse, coins: number, now: number = Date.now()): {
  warehouse: Warehouse;
  rentDue: number;
  decayed: Record<CandyType, number>;
  totalDecayed: number;
} {
  const decayResult = calculateDecay(warehouse, now);
  const rentResult = calculateRent(decayResult.warehouse, now);

  return {
    warehouse: rentResult.warehouse,
    rentDue: rentResult.rentDue,
    decayed: decayResult.decayed,
    totalDecayed: decayResult.totalDecayed,
  };
}

export function mergeSameTypeItems(warehouse: Warehouse): Warehouse {
  const merged: Record<string, { candyType: CandyType; totalQuantity: number; oldestTime: number }> = {};

  for (const item of warehouse.items) {
    if (!merged[item.candyType]) {
      merged[item.candyType] = {
        candyType: item.candyType,
        totalQuantity: 0,
        oldestTime: item.storedAt,
      };
    }
    merged[item.candyType].totalQuantity += item.quantity;
    merged[item.candyType].oldestTime = Math.min(merged[item.candyType].oldestTime, item.storedAt);
  }

  return {
    ...warehouse,
    items: Object.values(merged).map(m => ({
      candyType: m.candyType,
      quantity: m.totalQuantity,
      storedAt: m.oldestTime,
    })),
  };
}
