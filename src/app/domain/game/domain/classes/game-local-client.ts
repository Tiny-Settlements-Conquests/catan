import { ComponentRef, DestroyRef, ViewContainerRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { dispatch } from '@ngneat/effects';
import { Subject, delay, filter, map, switchMap, take, takeUntil } from "rxjs";
import { ActionHistoryActions } from "../../../action-history/domain/state/action-history.actions";
import { ActionHistoryRepository } from "../../../action-history/domain/state/action-history.repository";
import { BankRepository } from "../../../bank/domain/state/bank.repository";
import { BuildCostManager } from "../../../buildings/domain/classes/build-cost-manager";
import { BuildingBuildManager } from "../../../buildings/domain/classes/building-build-manager";
import { RoadBuildManager } from "../../../buildings/domain/classes/road-build-manager";
import { GraphBuildingNode } from "../../../buildings/domain/graph/graph-building-node";
import { BuildingType } from "../../../buildings/domain/models/building.model";
import { DiceRepository } from "../../../dice/domain/state/dice.repository";
import { DiceOverlayComponent } from "../../../dice/ui/dice-overlay/dice-overlay.component";
import { Graph } from "../../../graph/domain/classes/graph";
import { ResourceInventory } from "../../../inventory/domain/classes/resource-inventory";
import { WinningpointsInventory } from "../../../inventory/domain/classes/winningpoints-inventory";
import { InventoryRepository } from "../../../inventory/domain/state/inventory.repository";
import { Player } from "../../../player/domain/classes/player";
import { Playground } from "../../../playground/domain/classes/playground";
import { PlaygroundGenerator } from "../../../playground/domain/generators/playground-generator";
import { PlaygroundGraphGenerator } from "../../../playground/domain/generators/playground-graph-generator";
import { PlaygroundGridGenerator } from "../../../playground/domain/generators/playground-grid-generator";
import { ResourceGenerator } from "../../../resources/domain/classes/generators/resource-generator";
import { resourceTypeToResourceCard, resourcesToResourceCards } from "../../../resources/domain/function/resource-type.function";
import { Round } from "../../../round/domain/classes/round";
import { RoundPlayer } from "../../../round/domain/models/round-player.model";
import { RoundCountdownActions } from "../../../round/domain/state/countdown/round-countdown.actions";
import { RoundPlayerRepository } from "../../../round/domain/state/round-players.repository";
import { UserRepository } from "../../../user/domain/state/user.repository";
import { GameModeRepository } from "../state/game-mode.repository";
import { Game } from "./game";
import { BuildingFactory } from "../../../buildings/domain/factories/building.factory";
import { DiceRoller } from "../../../dice/domain/classes/dice-roller";
import { ResourceDistributor } from "../../../resources/domain/classes/resources/resource-distributor";
import { RobberManager } from "../../../robber/domain/classes/robber-manager";
import { TradeManager } from "../../../trade/domain/classes/trade-manager";

export class GameLocalClient {
  private _game: Game

  public get game() {
    return this._game;
  }

  private _diceRef: undefined | ComponentRef<DiceOverlayComponent> = undefined;
  private _diceOverlayOpen = new Subject();

  constructor(
    private _gameComponentRef: ViewContainerRef,
    private _bankRepository: BankRepository,
    private _inventoryRepository: InventoryRepository,
    private _roundPlayerRepository: RoundPlayerRepository,
    private _userRepository: UserRepository,
    private _gameModeRepository: GameModeRepository,
    private _diceRepository: DiceRepository,
    private _actionHistoryRepository: ActionHistoryRepository,
    private _destroyRef: DestroyRef,
  ) { 
    this._game = this.generateGame();
    // this.syncStates();
    // this.simulateGame();
    this._userRepository.selectUser().pipe(
      map((me) => {
        if(me) {
          const player = this.game.round.getPlayerById(me.id)
          if(player) {
            this._inventoryRepository.setResources(player.resourceInventory.resources)
          }
        }
        return this.game?.round.players.find((u) => u.id === me?.id)
      }),
      switchMap((me) => {
        return this.game.selectUserInventoryUpdate().pipe(
          filter(({player}) => player.id === me?.id)
        );
      })
    ).subscribe(({newAmount, type}) => {
      this._inventoryRepository.updateResourceAmount(type, newAmount);
    })
  }

  private simulateGame() {

    this.game.selectRound().pipe(
    ).subscribe((d) => {
      console.log("ROUND UPDATE");
      this._diceRepository.resetDices();
      this._diceRef?.destroy();
      this.openDiceOverlay()
    })

    this.game.selectRolledDice().pipe(
    ).subscribe(({dices, player}) => {
      if(!player) return;
      dispatch(
        ActionHistoryActions.addAction({
          typ: 'dice',
          id: Math.random().toString(),
          player,
          dice: dices
        })
      )
      this._diceRepository.setDices(dices);
      this.rollDice(dices);
    })

    this.game.selectUserInventoryUpdate().pipe(
    ).subscribe((inventory) => {
      console.log(inventory)
      //todo replace by ngneat action
      if(inventory.oldAmount < inventory.newAmount) { // old amount darf nicht größer als der neue sein, sonst wurde etwas abgezogen
        dispatch(
          ActionHistoryActions.addAction({
            typ: 'resource',
            id: Math.random().toString(),
            player: inventory.player,
            receivedResources: [resourceTypeToResourceCard(inventory.type)],
          })
        )
      }
    })

    

    // for(let i = 0; i < 1; i++) {
    //   this.game.nextRound();
    // }
    // this.game.startGame();
  }

  private syncStates() {
    this.game.selectCurrentTimer().subscribe((data) => {
      dispatch(RoundCountdownActions.setRoundCountdown({
        countdown: data,
      }))
      console.log(data);
    })

    this.game.selectBuildingUpdate().subscribe((data) => {
      console.log("YOW")
      dispatch(
        ActionHistoryActions.addAction({
          typ: 'build',
          id: Math.random().toString(),
          player: data.owner,
          building: data.type,
        })
      )
    })

    this.game.selectBankInventoryUpdate().subscribe(inventory => {
      this._bankRepository.updateResourceAmount(inventory.type, inventory.amount);
    });

    this._userRepository.selectUser().pipe(
      map((me) => {
        if(me) {
          const player = this.game.round.getPlayerById(me.id)
          if(player) {
            this._inventoryRepository.setResources(player.resourceInventory.resources)
          }
        }
        return this.game?.round.players.find((u) => u.id === me?.id)
      }),
      switchMap((me) => {
        return this.game.selectUserInventoryUpdate().pipe(
          filter(({player}) => player.id === me?.id)
        );
      })
    ).subscribe(({newAmount, type}) => {
      this._inventoryRepository.updateResourceAmount(type, newAmount);
    })

    this._game.selectPlayers().subscribe(roundPlayers => {
      //todo build a mapper
      const roundplayers = roundPlayers.map((p): RoundPlayer => ({
        color: p.color,
        id: p.id,
        isBot: p.roundPlayer.isBot,
        name: p.name,
        profileUrl: p.profileUrl,
        researchCardCount: p.researchCardCount,
        winningPoints: p.winningPointsAmount,
        resourceCardCount: p.resourceCardCount
      }))
      this._roundPlayerRepository.setRoundPlayers(roundplayers);
    });

    this.game.round.selectActivePlayer().subscribe((player) => {
      this._gameModeRepository.updateMode('spectate');
      if(player) {
        this._roundPlayerRepository.updateActiveRoundPlayer(player.id)
      }
    })

	this._gameModeRepository.selectMode().pipe(
		takeUntilDestroyed(this._destroyRef)
	).subscribe((mode) => {
		if(this.game === undefined) return;

		this.game.mode = mode;
	})
}

  private generateGame(): Game {
    const players = this.generatePlayers();
    const round = this.generateRound(players);
	  this._userRepository.setUser(round.players[0]);

    const playground = this.generatePlayground();
    const buildingGraph = playground.buildingGraph;
    const bankInventory = new ResourceInventory({
      straw: 50,
      stone: 50,
      wool: 50,
      bricks: 50,
      wood: 50
    })
    const buildCostManager = new BuildCostManager(bankInventory);
    this.mockBuildings(round.players, playground);
    const buildingFactory = new BuildingFactory();
    const diceRoller = new DiceRoller();
    const buildingBuildManager = new BuildingBuildManager(
      buildingGraph,
      playground.graph,
      buildCostManager,
      buildingFactory
    );
    const resourceDistributor = new ResourceDistributor(playground, buildingBuildManager, bankInventory);
    const game = new Game(
      {
        bank: bankInventory,
        buildingBuildManager,
        roadBuildManager: new RoadBuildManager(
          buildingGraph,
          buildCostManager,
        ),
        playground,
        round,
        buildCostManager,
        diceRoller,
        resourceDistributor,
        robberManager: new RobberManager(playground),
        tradeManager: new TradeManager(bankInventory, round)
      }
    );

    //TODO FIX ROBTEST
    // const field = game.playground.gridField.find((f) => (f.polygon.points.find((p) => game.playground.buildingGraph.getNodeByPoint(p))? f : false))
    // console.log("FIELD", field);
    // if(field) {
    //   game.robTest(round.players[0], field)
    // } 
    const trade = game.tradeTest();
    trade.selectTradeOfferStarted.subscribe((data) => {
      console.log("TRADE STARTED", data);
    })
    trade.selectTradeCancel.subscribe((data)=> {
      console.log("TRADE CANCELED!!!", data)
      console.log(trade);
    })

    trade.selectTradeResponse.subscribe((data) => console.log("JAJAJAAJJAJA" , data))

    trade.selectTradeCompleted.subscribe((data)=> {
      console.log("ALLES FERDDISCCHHH", data)
      console.log("TESTTTTTTTTTTTTTTT");
      dispatch(
        ActionHistoryActions.addAction({
          typ: 'trade',
          id: Math.random().toString(),
          playerA: data.trade.player,
          playerB: data.acceptedPlayer,
          givenResources: resourcesToResourceCards(data.trade.offeredResources),
          receivedResources: resourcesToResourceCards(data.trade.requestedResources),
        })
      )
    })

    trade.startTrade({
      id: "1",
      offeredResources: {
        wood: 1
      },
      player: round.players[0],
      requestedResources: {
        wood: 7
      }
    })

    setTimeout(() => {
      trade.respondToTrade({
        tradeId: "1",
        respondedPlayer: round.players[1],
        accepted: true
      })
    }, 2000)

    // setTimeout(() => {
    //   trade.cancelTrade("1")
    // }, 3000)

    
	  return game;
  }

  private generateRound(roundPlayers: RoundPlayer[]) {
    const players: Player[] = roundPlayers.map((p, i) => {
      return new Player(
        p,
        new ResourceInventory({
          wood: 10,
          bricks: 10,
          stone: 10,
          straw: 10,
          wool: 10
        }), 
        new WinningpointsInventory({
          points: 0
        }),
        new Graph()
      )
    });

    return new Round(players);
  }

  private mockBuildings(players: Player[], playground: Playground) {
    const buildingFactory = new BuildingFactory();

    for(let i = 0; i < players.length * 2; i++) {
      try {
        const activePlayer = players[i % players.length];
        const randomLocation = playground.graph.nodes[parseInt("" + Math.random() * playground.graph.nodes.length)];
        playground.buildingGraph.tryAddNode(new GraphBuildingNode(randomLocation.id,randomLocation.position , activePlayer));
        const buildingNode = playground.buildingGraph.getNodeById(randomLocation.id);
        buildingNode?.tryBuild(buildingFactory.constructBuilding(BuildingType.TOWN, activePlayer, buildingNode))
      } catch(e) {}
    }
    const loc = playground.graph.nodes[32]
    playground.buildingGraph.tryAddNode(new GraphBuildingNode("32",loc.position , players[1]));
    const buildingNode = playground.buildingGraph.getNodeById("32");
    buildingNode?.tryBuild(buildingFactory.constructBuilding(BuildingType.TOWN, players[1], buildingNode))
    console.log("LOC", loc);
    console.log("BUILDINGNODEH", buildingNode);

  }

  private generatePlayground() {
    const buildingGraph = new Graph<GraphBuildingNode>();
    const playgroundGenerator = new PlaygroundGenerator(
      new PlaygroundGridGenerator(),
      new ResourceGenerator(),
      new PlaygroundGraphGenerator()
    );
    
    const playground = playgroundGenerator.generate({
      fieldHeight: 9,
      fieldWidth: 9
    }, buildingGraph)
    //TODO REMOVE ME
playground.resourceFields[0].value = 3
    return playground
  }

  private openDiceOverlay() {
    console.log("open")
    this._diceOverlayOpen.next(true);
    
    const component = this._gameComponentRef.createComponent(DiceOverlayComponent);
    this._diceRef = component;
    component.instance.diceRollStart.pipe(
      take(1),
      takeUntil(this._diceOverlayOpen)
    ).subscribe(() => this.game.rollDice());
  }

  private rollDice(dices: [number, number]) {
    const diceRef = this._diceRef;
    if(!diceRef) return;

    console.log("ROLLDICE", dices);
    diceRef.instance.dices = dices;
    diceRef.instance.rollDices()
    diceRef.instance.result.pipe(
      take(1),
      delay(1000)
    ).subscribe(() => diceRef.destroy())
  }

  private generatePlayers() {
    return [
      {
        id: '14124',
        color: '#CD5C5C',
        profileUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSO2F0VxhmZzAFM54PA95eDdtkEtHlZDga9ew&usqp=CAU',
        name: 'Admin',
        researchCardCount: 5,
        resourceCardCount: 5,
        winningPoints: 1,
        isBot: false,
      },
      {
        id: '1412523',
        color: '#22c55e',
        profileUrl: '/assets/robot.jpg',
        name: 'Robot',
        researchCardCount: 4,
        resourceCardCount: 2,
        winningPoints: 3,
        isBot: true,
      },
      // {
      //   id: '1412541241',
      //   color: '#6B46C1',
      //   profileUrl: '/assets/robot.jpg',
      //   name: 'Robot',
      //   researchCardCount: 6,
      //   resourceCardCount: 3,
      //   winningPoints: 1,
      //   isBot: true,
      // },
      // {
      //   id: '646546',
      //   color: '#000000',
      //   profileUrl: '/assets/robot.jpg',
      //   name: 'Robot',
      //   researchCardCount: 1,
      //   resourceCardCount: 4,
      //   winningPoints: 5,
      //   isBot: true,
      // }
    ];
  }
}
