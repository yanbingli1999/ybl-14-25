import { useState } from 'react';
import useGameStore from '@/store/useGameStore';
import { CANDY_CONFIG } from '@/data/config';
import { getWarehouseLevel, getWarehouseUsed, getWarehouseCapacity, canUpgradeWarehouse, getNextWarehouseLevel } from '@/engine/warehouseSystem';
import { BASIC_CANDY_TYPES, CandyType } from '@/types';
import { Warehouse as WarehouseIcon, Coins, Shield, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

export default function WarehousePanel() {
  const {
    warehouse,
    profile,
    upgradeWarehouse,
    useWarehouseForDispatch,
    setUseWarehouseForDispatch,
    moveFromWarehouseToTrain,
    train,
    gamePhase,
  } = useGameStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const levelInfo = getWarehouseLevel(warehouse.level);
  const used = getWarehouseUsed(warehouse);
  const capacity = getWarehouseCapacity(warehouse);
  const usagePercent = capacity > 0 ? (used / capacity) * 100 : 0;
  const canUpgrade = canUpgradeWarehouse(warehouse);
  const nextLevel = getNextWarehouseLevel(warehouse);
  const canAffordUpgrade = nextLevel ? profile.coins >= nextLevel.upgradeCost : false;

  const candyQuantities: Record<CandyType, number> = {} as Record<CandyType, number>;
  for (const type of BASIC_CANDY_TYPES) {
    candyQuantities[type] = warehouse.items
      .filter(item => item.candyType === type)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  const hasCandies = Object.values(candyQuantities).some(v => v > 0);

  const handleUpgrade = () => {
    const success = upgradeWarehouse();
    if (success) {
      setUpgradeMessage('升级成功！');
      setTimeout(() => setUpgradeMessage(''), 2000);
    } else {
      setUpgradeMessage('金币不足！');
      setTimeout(() => setUpgradeMessage(''), 2000);
    }
  };

  const handleMoveToTrain = (candyType: CandyType) => {
    const carriage = train.carriages.find(c => c.candyType === candyType);
    if (!carriage) return;
    
    const space = carriage.capacity - carriage.currentLoad;
    if (space <= 0) return;
    
    const available = candyQuantities[candyType];
    const toMove = Math.min(available, space, 5);
    moveFromWarehouseToTrain(candyType, toMove);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 shadow-lg border-2 border-purple-200">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <WarehouseIcon className="w-6 h-6 text-purple-700" />
        <h3 className="text-lg font-bold text-purple-900">{levelInfo.name}</h3>
        <span className="text-sm text-purple-600 ml-auto">
          {used}/{capacity}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-purple-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-500" />
        )}
      </div>

      <div className="h-2 bg-purple-200 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-purple-700">
              <Coins className="w-4 h-4" />
              <span>日租金: {levelInfo.dailyRent}</span>
            </div>
            <div className="flex items-center gap-1 text-green-700">
              <Shield className="w-4 h-4" />
              <span>防虫: {Math.round(levelInfo.pestResistance * 100)}%</span>
            </div>
          </div>

          <p className="text-xs text-purple-500">{levelInfo.description}</p>

          {hasCandies ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-800">库存糖果</h4>
              <div className="grid grid-cols-5 gap-1">
                {BASIC_CANDY_TYPES.map(type => {
                  const config = CANDY_CONFIG[type];
                  const quantity = candyQuantities[type];
                  const carriage = train.carriages.find(c => c.candyType === type);
                  const hasSpace = carriage ? carriage.currentLoad < carriage.capacity : false;
                  const canMove = quantity > 0 && hasSpace && gamePhase === 'playing';

                  return (
                    <button
                      key={type}
                      onClick={() => canMove && handleMoveToTrain(type)}
                      disabled={!canMove}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all
                        ${canMove
                          ? 'bg-white hover:bg-purple-100 cursor-pointer shadow-sm hover:shadow'
                          : 'bg-white/50 cursor-not-allowed opacity-60'
                        }`}
                      title={canMove ? '点击移到火车 (每次5个)' : quantity > 0 ? '车厢已满' : '无库存'}
                    >
                      <span className="text-xl">{config.emoji}</span>
                      <span className="text-xs font-bold text-gray-700">{quantity}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-purple-400 text-center">
                点击糖果可移到火车 (每次5个)
              </p>
            </div>
          ) : (
            <p className="text-sm text-purple-400 text-center py-2">仓库暂无库存</p>
          )}

          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={useWarehouseForDispatch}
                onChange={(e) => setUseWarehouseForDispatch(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-purple-800">发车时自动从仓库补货</span>
            </label>
          </div>

          {canUpgrade && nextLevel && (
            <div className="pt-3 border-t border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-purple-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">升级到 {nextLevel.name}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-bold">{nextLevel.upgradeCost}</span>
                </div>
              </div>
              
              <div className="text-xs text-purple-500 mb-2">
                容量: {levelInfo.capacity} → {nextLevel.capacity} | 
                防虫: {Math.round(levelInfo.pestResistance * 100)}% → {Math.round(nextLevel.pestResistance * 100)}%
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={!canAffordUpgrade}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all
                  ${canAffordUpgrade
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {upgradeMessage || (canAffordUpgrade ? '升级仓库' : '金币不足')}
              </button>
            </div>
          )}

          {!canUpgrade && (
            <div className="pt-3 border-t border-purple-200 text-center">
              <p className="text-sm text-purple-500">已达最高等级 🏆</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
