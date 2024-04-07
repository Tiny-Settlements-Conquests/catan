import { Observable, combineLatest, filter, map, switchMap, tap } from "rxjs";
import { BuildCostManager } from "../../../buildings/domain/classes/build-cost-manager";
import { BuildingBuildManager } from "../../../buildings/domain/classes/building-build-manager";
import { RoadBuildManager } from "../../../buildings/domain/classes/road-build-manager";
import { GraphBuildingNode } from "../../../buildings/domain/graph/graph-building-node";
import { DiceOverlayComponent } from "../../../dice/ui/dice-overlay/dice-overlay.component";
import { Graph } from "../../../graph/domain/classes/graph";
import { Inventory } from "../../../inventory/domain/classes/inventory";
import { Player } from "../../../player/domain/classes/player";
import { Playground } from "../../../playground/domain/classes/playground";
import { PlaygroundGenerator } from "../../../playground/domain/generators/playground-generator";
import { PlaygroundGraphGenerator } from "../../../playground/domain/generators/playground-graph-generator";
import { PlaygroundGridGenerator } from "../../../playground/domain/generators/playground-grid-generator";
import { ResourceGenerator } from "../../../resources/classes/generators/resource-generator";
import { Round } from "../../../round/domain/classes/round";
import { Game } from "./game";
import { DestroyRef, ViewContainerRef } from "@angular/core";
import { RoundPlayer } from "../../../round/domain/models/round-player.model";
import { BankRepository } from "../../../bank/domain/state/bank.repository";
import { InventoryRepository } from "../../../inventory/domain/state/inventory.repository";
import { RoundPlayerRepository } from "../../../round/domain/state/round-players.repository";
import { UserRepository } from "../../../user/domain/state/user.repository";
import { GameModeRepository } from "../state/game-mode.repository";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MediumBot } from "../../../bot/domain/classes/medium-bot";

export class GameLocalClient {
  private _game: Game

  public get game() {
    return this._game;
  }

  constructor(
    private gameComponentRef: ViewContainerRef,
    private _bankRepository: BankRepository,
    private _inventoryRepository: InventoryRepository,
    private _roundPlayerRepository: RoundPlayerRepository,
    private _userRepository: UserRepository,
    private _gameModeRepository: GameModeRepository,
    private _destroyRef: DestroyRef
  ) { 
    this._game = this.generateGame();
    this.syncStates();
    this.simulateGame();
  }

  private simulateGame() {
    combineLatest({
      me: this._userRepository.selectUser(),
      activePlayer: this.game.round.selectActivePlayer(),
    }).pipe(
      tap(({me, activePlayer}) => {
        const bot = new MediumBot();
        if(activePlayer) {
          // bot.makeMove(this.game, activePlayer)
        }
        if(me?.id !== activePlayer?.id && activePlayer) {
          bot.makeMove(this.game, activePlayer)

        }
      }),
      filter(({me, activePlayer}) => me?.id === activePlayer?.id),
    ).subscribe(() => {
      this.openDiceOverlay(this.game.rollDice()).subscribe();
    })

    for(let i = 0; i < 5; i++) {
      this.game.nextRound();
    }

  }

  private syncStates() {
    this.game.selectBankInventoryUpdate().subscribe(inventory => {
      this._bankRepository.updateResourceAmount(inventory.type, inventory.amount);
    });

    this._userRepository.selectUser().pipe(
      map((me) => {
        if(me) {
          const player = this.game.round.getPlayerById(me.id)
          if(player) {
            this._inventoryRepository.setResources(player.inventory.resources)
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

    this._game.round.selectRoundPlayers().subscribe(roundPlayers => {
      this._roundPlayerRepository.setRoundPlayers(roundPlayers);
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
    const bankInventory = new Inventory({
      straw: 50,
      stone: 50,
      wool: 50,
      bricks: 50,
      wood: 50
    })
    const buildCostManager = new BuildCostManager(bankInventory);
    this.mockBuildings(round.players, playground);

    const game = new Game(
      {
        bank: bankInventory,
        buildingBuildManager: new BuildingBuildManager(
          buildingGraph,
          playground.graph,
          buildCostManager,
        ),
        roadBuildManager: new RoadBuildManager(
          buildingGraph,
          buildCostManager,
        ),
        playground,
        round,
        buildCostManager
      }
    );

	return game;
  }

  private generateRound(roundPlayers: RoundPlayer[]) {
    const players: Player[] = roundPlayers.map((p, i) => {
      return new Player(
        p,
        new Inventory({
          wood: 10,
          bricks: 10,
          stone: 10,
          straw: 10,
          wool: 10
        }), 
        new Graph()
      )
    });

    return new Round(players);
  }

  private mockBuildings(players: Player[], playground: Playground) {

    for(let i = 0; i < players.length * 2; i++) {
      try {
        const randomLocation = playground.graph.nodes[parseInt("" + Math.random() * playground.graph.nodes.length)];
        playground.buildingGraph.tryAddNode(new GraphBuildingNode(randomLocation.id,randomLocation.position , players[i % players.length]));
        const buildingNode = playground.buildingGraph.getNodeById(randomLocation.id);
        buildingNode?.tryBuild('town')
      } catch(e) {}
    }

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

  private openDiceOverlay(dices: [number, number]): Observable<[number, number]> {
    const component = this.gameComponentRef.createComponent(DiceOverlayComponent);
    component.instance.dices = dices;
    return new Observable((subscriber) => {
      component.instance.result.subscribe((result) => {
        setTimeout(() => {
          component.destroy();
        }, 1000)
        subscriber.next(result);
        subscriber.complete();
      })
    })
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
      {
        id: '1412541241',
        color: '#6B46C1',
        profileUrl: '/assets/robot.jpg',
        name: 'Robot',
        researchCardCount: 6,
        resourceCardCount: 3,
        winningPoints: 1,
        isBot: true,
      },
      {
        id: '646546',
        color: '#000000',
        profileUrl: '/assets/robot.jpg',
        name: 'Robot',
        researchCardCount: 1,
        resourceCardCount: 4,
        winningPoints: 5,
        isBot: true,
      }
    ];
  }
}