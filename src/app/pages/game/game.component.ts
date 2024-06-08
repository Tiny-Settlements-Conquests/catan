import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { AppComponent } from '../../app.component';
import { ActionHistoryRepository } from '../../domain/action-history/domain/state/action-history.repository';
import { ActionHistoryComponent } from '../../domain/action-history/feature/action-history/action-history.component';
import { BankRepository } from '../../domain/bank/domain/state/bank.repository';
import { BankComponent } from '../../domain/bank/feature/bank/bank.component';
import { BuildingsSelectionComponent } from '../../domain/buildings/feature/buildings-selection/buildings-selection.component';
import { ChatComponent } from '../../domain/chat/feature/chat/chat.component';
import { DiceRepository } from '../../domain/dice/domain/state/dice.repository';
import { DiceOverlayComponent } from '../../domain/dice/ui/dice-overlay/dice-overlay.component';
import { DiceRandomNumberComponent } from '../../domain/dice/ui/dice-random-number/dice-random-number.component';
import { Game } from '../../domain/game/domain/classes/game';
import { GameLocalClient } from '../../domain/game/domain/classes/game-local-client';
import { GameModeRepository } from '../../domain/game/domain/state/game-mode.repository';
import { CanvasComponent } from '../../domain/game/feature/canvas/canvas.component';
import { InventoryRepository } from '../../domain/inventory/domain/state/inventory.repository';
import { ResourceInventoryComponent } from '../../domain/inventory/feature/resource-inventory/resource-inventory.component';
import { BlockComponent } from '../../domain/layouts/ui/block/block.component';
import { TitleComponent } from '../../domain/layouts/ui/title/title.component';
import { PlayerCardComponent } from '../../domain/player/feature/players-card/player-card.component';
import { RoundPlayerRepository } from '../../domain/round/domain/state/round-players.repository';
import { NextMoveButtonComponent } from '../../domain/round/feature/next-move-button/next-move-button.component';
import { RoundCountdownComponent } from '../../domain/round/feature/round-countdown/round-countdown.component';
import { RoundPlayerCardsComponent } from '../../domain/round/feature/round-player-cards/round-player-cards.component';
import { TradeCardComponent } from '../../domain/trade/feature/trade-card/trade-card.component';
import { UserRepository } from '../../domain/user/domain/state/user.repository';
import { TradeMenuComponent } from '../../domain/trade/feature/trade-menu/trade-menu.component';



@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CanvasComponent,
    TitleComponent,
    BlockComponent,
    BuildingsSelectionComponent,
    TradeCardComponent,
    PlayerCardComponent,
    FontAwesomeModule,
    RoundPlayerCardsComponent,
    ResourceInventoryComponent,
    NextMoveButtonComponent,
    ActionHistoryComponent,
    ChatComponent,
    BankComponent,
    DiceRandomNumberComponent,
    DiceOverlayComponent,
    RoundCountdownComponent,
    TradeMenuComponent
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent { 
  private readonly _gameModeRepository = inject(GameModeRepository);
  private readonly _userRepository = inject(UserRepository);
  private readonly _roundPlayerRepository = inject(RoundPlayerRepository);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _app = inject(AppComponent);
  private readonly _inventoryRepository = inject(InventoryRepository);
  private readonly _bankRepository = inject(BankRepository);
  private readonly _diceRepository = inject(DiceRepository);
  private readonly _actionHistoryRepository = inject(ActionHistoryRepository);

  //todo das overlay nochmal umbauen, sodass es einfach nur über dem canvas liegt
  public icons = {
    clock: faClock
  }

  public readonly isMyTurn = toSignal(
    this._roundPlayerRepository.selectIsMyTurn()
  )

  private readonly _game = signal<Game | undefined>(undefined)

  public get game() {
    return this._game();
  }

  public ngOnInit() {
    const client = new GameLocalClient(
      this._app._ref,
      this._bankRepository,
      this._inventoryRepository,
      this._roundPlayerRepository,
      this._userRepository,
      this._gameModeRepository,
      this._diceRepository,
      this._actionHistoryRepository,
      this._destroyRef
    );
    this._game.set(client.game)
  }
  
}
