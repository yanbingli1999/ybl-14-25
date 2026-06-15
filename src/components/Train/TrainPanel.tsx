import useGameStore from '@/store/useGameStore';
import CarriageCard from './CarriageCard';
import { getTrainLoadPercentage, getTotalLoad, getTotalCapacity, getCandyLoad } from '@/engine/loadingSystem';
import { getWarehouseUsed } from '@/engine/warehouseSystem';
import { Train as TrainIcon } from 'lucide-react';

export default function TrainPanel() {
  const { train, dispatchTrain, gamePhase, isAnimating, moves, useWarehouseForDispatch, warehouse, currentOrder } = useGameStore();

  const loadPercent = getTrainLoadPercentage(train);
  const totalLoad = getTotalLoad(train);
  const totalCapacity = getTotalCapacity(train);
  
  let canDispatch = totalLoad > 0 && gamePhase === 'playing' && !isAnimating;
  
  if (useWarehouseForDispatch && currentOrder && gamePhase === 'playing' && !isAnimating) {
    const warehouseUsed = getWarehouseUsed(warehouse);
    if (warehouseUsed > 0) {
      let hasUsefulWarehouseStock = false;
      for (const item of currentOrder.items) {
        const trainLoaded = getCandyLoad(train, item.candyType);
        if (trainLoaded < item.quantity) {
          const warehouseQty = warehouse.items
            .filter(w => w.candyType === item.candyType)
            .reduce((sum, w) => sum + w.quantity, 0);
          if (warehouseQty > 0) {
            hasUsefulWarehouseStock = true;
            break;
          }
        }
      }
      if (hasUsefulWarehouseStock || totalLoad > 0) {
        canDispatch = true;
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-lg border-2 border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <TrainIcon className="w-6 h-6 text-amber-700" />
        <h3 className="text-lg font-bold text-amber-900">{train.name}</h3>
        <span className="text-sm text-amber-600 ml-auto">
          {totalLoad}/{totalCapacity} ({Math.round(loadPercent)}%)
        </span>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {train.carriages.map((carriage) => (
            <CarriageCard key={carriage.id} carriage={carriage} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 rounded-full" />
      </div>

      <button
        onClick={dispatchTrain}
        disabled={!canDispatch}
        className={`w-full mt-4 py-3 px-6 rounded-xl font-bold text-white text-lg
          transition-all duration-200 transform
          ${canDispatch
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 cursor-not-allowed'
          }`}
      >
        🚂 发车！
      </button>

      {moves <= 0 && gamePhase === 'playing' && (
        <p className="text-center text-red-500 text-sm mt-2 font-medium">
          步数已用完，请发车结束本局
        </p>
      )}
    </div>
  );
}
