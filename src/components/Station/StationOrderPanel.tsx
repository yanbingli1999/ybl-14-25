import useGameStore from '@/store/useGameStore';
import { CANDY_CONFIG, STATIONS } from '@/data/config';
import { getCandyLoad } from '@/engine/loadingSystem';
import { MapPin, Flame, Coins, AlertTriangle, Package } from 'lucide-react';
import { CandyType } from '@/types';

export default function StationOrderPanel() {
  const { currentOrder, train, currentStationId, profile, changeStation, useWarehouseForDispatch, warehouse } = useGameStore();

  if (!currentOrder) return null;

  const station = STATIONS.find(s => s.id === currentStationId);
  const availableStations = STATIONS.filter(
    s => s.reputationRequired <= profile.reputation
  );

  const getWarehouseQuantity = (candyType: CandyType): number => {
    return warehouse.items
      .filter(item => item.candyType === candyType)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div
      className="rounded-2xl p-4 shadow-lg border-2"
      style={{
        background: `linear-gradient(135deg, ${station?.themeColor}15, ${station?.themeColor}05)`,
        borderColor: station?.themeColor + '40',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5" style={{ color: station?.themeColor }} />
        <h3 className="text-lg font-bold text-gray-800">{station?.name}</h3>
        {currentOrder.isUrgent && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            <Flame className="w-3 h-3" />
            急单
          </span>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">订单需求</h4>
        <div className="space-y-2">
          {currentOrder.items.map((item, index) => {
            const config = CANDY_CONFIG[item.candyType];
            const trainLoaded = getCandyLoad(train, item.candyType);
            const warehouseQty = useWarehouseForDispatch ? getWarehouseQuantity(item.candyType) : 0;
            const availableFromWarehouse = Math.min(warehouseQty, item.quantity - trainLoaded);
            const totalAvailable = trainLoaded + (availableFromWarehouse > 0 ? availableFromWarehouse : 0);
            const displayLoaded = useWarehouseForDispatch ? totalAvailable : trainLoaded;
            const progress = Math.min((displayLoaded / item.quantity) * 100, 100);
            const isComplete = displayLoaded >= item.quantity;
            const trainProgress = Math.min((trainLoaded / item.quantity) * 100, 100);

            return (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xl">{config.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{config.name}</span>
                    <span className={isComplete ? 'text-green-600 font-bold' : 'text-gray-500'}>
                      {displayLoaded}/{item.quantity}
                      {useWarehouseForDispatch && warehouseQty > 0 && (
                        <span className="text-purple-500 text-xs ml-1">
                          (+{availableFromWarehouse > 0 ? availableFromWarehouse : 0} 仓库)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${trainProgress}%`,
                        backgroundColor: config.color,
                      }}
                    />
                    {useWarehouseForDispatch && availableFromWarehouse > 0 && (
                      <div
                        className="h-full absolute top-0 rounded-r transition-all duration-500"
                        style={{
                          left: `${trainProgress}%`,
                          width: `${Math.min((availableFromWarehouse / item.quantity) * 100, 100 - trainProgress)}%`,
                          backgroundColor: '#9B59B6',
                          opacity: 0.6,
                        }}
                      />
                    )}
                  </div>
                </div>
                {isComplete && <span className="text-green-500">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {useWarehouseForDispatch && (
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg text-xs text-purple-700 mb-3">
          <Package className="w-4 h-4" />
          <span>已启用仓库补货，紫色部分为仓库可用量</span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-yellow-600">
          <Coins className="w-4 h-4" />
          <span className="font-bold">
            +{currentOrder.reward}
            {currentOrder.isUrgent && (
              <span className="text-red-500 ml-1">(+{currentOrder.urgentBonus} 加急)</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span>罚金 -{currentOrder.penalty}</span>
        </div>
      </div>

      {availableStations.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">切换车站</h4>
          <div className="flex gap-2 flex-wrap">
            {availableStations.map(s => (
              <button
                key={s.id}
                onClick={() => changeStation(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${s.id === currentStationId
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                style={
                  s.id === currentStationId
                    ? { backgroundColor: s.themeColor }
                    : {}
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
