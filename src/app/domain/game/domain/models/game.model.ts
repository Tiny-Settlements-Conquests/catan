import { BuildCostManager } from "../../../buildings/domain/classes/build-cost-manager";
import { BuildingBuildManager } from "../../../buildings/domain/classes/building-build-manager";
import { RoadBuildManager } from "../../../buildings/domain/classes/road-build-manager";
import { DiceRoller } from "../../../dice/domain/classes/dice-roller";
import { ResourceInventory } from "../../../inventory/domain/classes/resource-inventory";
import { Playground } from "../../../playground/domain/classes/playground";
import { ResourceDistributor } from "../../../resources/domain/classes/resources/resource-distributor";
import { RobberManager } from "../../../robber/domain/classes/robber-manager";
import { Round } from "../../../round/domain/classes/round";
import { TradeManager } from "../../../trade/domain/classes/trade-manager";

export interface GameConfig {
    resourceMultiplier: number,
    maxTownsPerPlayer: number,
    maxCitiesPerPlayer: number,
    maxRoadsPerPlayer: number,
    winPoints: number,
    maxRoundTimer: number,
    maxRollTimer: number,
  }
  
export interface GameDependencies {
    playground: Playground,
    round: Round,
    bank: ResourceInventory,
    roadBuildManager: RoadBuildManager,
    buildingBuildManager: BuildingBuildManager,
    buildCostManager: BuildCostManager,
    diceRoller: DiceRoller,
    resourceDistributor: ResourceDistributor,
    robberManager: RobberManager,
    tradeManager: TradeManager
  }