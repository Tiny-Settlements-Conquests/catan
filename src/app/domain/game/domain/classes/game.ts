import { BehaviorSubject, Subject, combineLatest, map, merge, race, share, switchMap, take, takeUntil, tap, timer } from "rxjs";
import { BuildCostManager } from "../../../buildings/domain/classes/build-cost-manager";
import { BuildingBuildManager } from "../../../buildings/domain/classes/building-build-manager";
import { RoadBuildManager } from "../../../buildings/domain/classes/road-build-manager";
import { rollDices } from "../../../dice/domain/functions/roll-dice.function";
import { GraphNode } from "../../../graph/domain/classes/graph-node";
import { ResourceInventory } from "../../../inventory/domain/classes/resource-inventory";
import { Playground } from "../../../playground/domain/classes/playground";
import { Round } from "../../../round/domain/classes/round";
import { defaultOrderStrategy } from "../../../round/domain/strategies/default-round-order.strategy";
import { GameMode } from "../models/game-mode.model";
import { GameDependencies, GameConfig } from "../models/game.model";
import { Building, BuildingType, PathBuilding, PathType } from "../../../buildings/domain/models/building.model";
import { DiceRoller } from "../../../dice/domain/classes/dice-roller";
import { ResourceDistributor } from "../../../resources/domain/classes/resources/resource-distributor";
import { Field } from "../../../playground/domain/classes/field";
import { RobberManager } from "../../../robber/domain/classes/robber-manager";
import { Player } from "../../../player/domain/classes/player";
import { TradeManager } from "../../../trade/domain/classes/trade-manager";


export class Game {
  public readonly playground: Playground;
  private readonly _round: Round;
  private readonly _roadBuildManager: RoadBuildManager;
  private readonly _buildingBuildManager: BuildingBuildManager;
  private readonly _bank: ResourceInventory;
  private readonly _costManager: BuildCostManager;
  private readonly _diceRoller: DiceRoller;
  private readonly _resourceDistributor: ResourceDistributor;
  private readonly _robberManager: RobberManager;
  private readonly _tradeManager: TradeManager;

  private _mode: GameMode = 'city';
  
  private readonly _buildingSignal = new Subject<PathBuilding | Building>();

  private readonly _state = new BehaviorSubject<'roll' | 'round'>('roll');
  private readonly _nextRoundSignal = new Subject();
  private readonly _pauseSignal = new Subject();
  private readonly _endSignal = new Subject();

  constructor(
    dependencies: GameDependencies,
    private readonly gameConfig: GameConfig = {
      maxCitiesPerPlayer: 5,
      maxRoadsPerPlayer: 15,
      maxRollTimer: 5_000,
      maxRoundTimer: 1_000_000,
      maxTownsPerPlayer: 5,
      winPoints: 10,
      resourceMultiplier: 1
    },
  ) { 
    this.playground = dependencies.playground;
    this._round = dependencies.round;
    this._bank = dependencies.bank;
    this._buildingBuildManager = dependencies.buildingBuildManager;
    this._roadBuildManager = dependencies.roadBuildManager;
    this._costManager = dependencies.buildCostManager;
    this._diceRoller = dependencies.diceRoller;
    this._resourceDistributor = dependencies.resourceDistributor;
    this._robberManager = dependencies.robberManager;
    this._tradeManager = dependencies.tradeManager;
    this.startGame();
  }

  private startGame() {
    this.startRoundTimers();
    const defaultOrder = defaultOrderStrategy(this._round);
    
    this._nextRoundSignal.pipe(
      takeUntil(this._endSignal)
    ).subscribe(() => {
      console.log("NEXT ROUND");
      defaultOrder.nextRound();
      this.startRoundTimers();
    })
  
  }

  public pause() {
    this._pauseSignal.next(true);
  }

  private resume() {
  }

  public get roadBuildManager() {
    return this._roadBuildManager;
  }

  public get costManager() {
    return this._costManager;
  }

  private startRoundTimers() {
    this._diceRoller.resetRoll()
    this.startRollTimer().pipe(
      takeUntil(this._pauseSignal),
      switchMap(() => {
        console.log('roll timer abgelaufen');
        return this.startRoundTimer()
      }),
      takeUntil(this._pauseSignal),
    ).subscribe(() => {
      this._nextRoundSignal.next(true);
      console.log("runde zu ende...")
    })
  }

  /**
   * @returns sobald der timer abgelaufen oder der nutzer die roll funktion ausgeführt hat
   */
  private startRollTimer() {
    this._state.next('roll');
    return race(
      timer(this.gameConfig.maxRollTimer).pipe(
        takeUntil(this._nextRoundSignal),
        tap(() => {
          this.rollDice();
        })
      ),
      this._diceRoller.selectRolledDice()
    ).pipe(
      takeUntil(this._nextRoundSignal)
    )
  }

  private startRoundTimer() {
    this._state.next('round');
    return race(
      timer(this.gameConfig.maxRoundTimer).pipe(
        takeUntil(this._nextRoundSignal),
      ),
    ).pipe(
      takeUntil(this._nextRoundSignal)
    )
  }

  public selectActiveRoundPlayer() {
    return this._round.selectActivePlayer();
  }

  public selectRound() {
    return this._round.selectRound()
  }

  public selectCurrentTimer() {
    return combineLatest({
      player: this.selectActiveRoundPlayer(),
      typ: this._state,
    }).pipe(
      map(({ typ }) => {
        if (typ === 'roll') {
          return this.gameConfig.maxRollTimer;
        }
        return this.gameConfig.maxRoundTimer;
      })
    )
  }

  public getBuildCosts() {
    return this._costManager.buildingCosts
  }

  public set mode(mode: GameMode ) {
    this._mode = mode;
  }

  public get round() {
    return this._round;
  }

  public selectPlayers() {
    return combineLatest(
      this._round.players.map((p) => p.selectChanges())
    )
  }

  public selectBankInventory() {
    return this._bank.selectInventory();
  }

  public selectBankInventoryUpdate() {
    return this._bank.selectInventoryUpdate();
  }

  public selectBuildingUpdate() {
    return this._buildingSignal;
  }

  public selectUserInventoryUpdate() {
    return merge(
      ...this._round.players.map((p) => p.resourceInventory.selectInventoryUpdate().pipe(
          map((update) => ({...update, player: p }))
      )))
  }

  public selectPlayersWinningPoints()  {
    return merge(
      ...this._round.players.map((p) => p.winningPointsInventory.selectInventoryUpdate().pipe(
          map((update) => ({...update, player: p }))
      )))
  }

  public selectRolledDice() {
    return this._diceRoller.selectRolledDice().pipe(
      map((dices) => ({dices, player: this._round.activePlayer}))
    );
  }

  public nextRound() {
    console.log("next ROUND")
    this._nextRoundSignal.next(true);
    
  }

  public rollDice() {
    if(this._diceRoller.hasRolledThisRound) throw new Error();
    const rolledDices = this._diceRoller.rollDices();
    this._resourceDistributor.distributeResources(rolledDices.sum);
  }

  public tryBuildBuildingOnGraphNode(node: GraphNode) {
    if(this._mode === 'spectate') return;
    const player = this._round.activePlayer;
    if(!player) return;

    try {
      if(this._mode === 'road') {
        this._roadBuildManager.tryBuildRoad(player, node);

      } else if(this._mode === 'city') {
        this._buildingBuildManager.buildBuilding(player, BuildingType.CITY, node);
        player.winningPointsInventory.addToInventory('points', 1)
        this._buildingSignal.next({
          type: BuildingType.CITY,
          graphNode: node,
          owner: player,
          winningPoints: 2
        })
      } else if(this._mode === 'town') {
        this._buildingBuildManager.buildBuilding(player, BuildingType.TOWN, node);
        player.winningPointsInventory.addToInventory('points', 1)
        this._buildingSignal.next({
          type: BuildingType.TOWN,
          graphNode: node,
          owner: player,
          winningPoints: 1
        })
        
      }
      console.log("YYYYY");

    } catch(e) {
      console.log("ERROR",e)
    }
  }

  public tryBuildRoadBetweenGraphNodes(nodeA: GraphNode, nodeB: GraphNode) {
    const player = this._round.activePlayer;
    if(!player) return;
    this._roadBuildManager.tryBuildRoadBetween(player, nodeA, nodeB);
    this._buildingSignal.next({
      type: PathType.ROAD,
      graphNodeA: nodeA,
      graphNodeB: nodeB,
      owner: player
    })

  }

  robTest(player: Player, field: Field) {
    try {
      this._robberManager.playerRobsAtPosition(player,field);

    } catch(e) {
      console.error(e);
    }
  }

  tradeTest() {
    return this._tradeManager
  }

}
