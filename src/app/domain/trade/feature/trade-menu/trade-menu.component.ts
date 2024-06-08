import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleDown, faCircleUp } from '@fortawesome/free-solid-svg-icons';
import { map, switchMap, tap } from 'rxjs';
import { ActionCardStackComponent } from '../../../cards/feature/action-card-stack/action-card-stack.component';
import { ResourceInventory } from '../../../inventory/domain/classes/resource-inventory';
import { InventoryRepository } from '../../../inventory/domain/state/inventory.repository';
import { BlockComponent } from '../../../layouts/ui/block/block.component';
import { resourceTypeToActionCardMode, resourceTypeToResourceCard } from '../../../resources/domain/function/resource-type.function';
import { ResourceCardComponent } from '../../../resources/ui/resource-card/resource-card.component';
import { resourceTypes, ResourceType } from '../../../resources/domain/models/resources.model';

@Component({
  selector: 'app-trade-menu',
  standalone: true,
  imports: [
    BlockComponent,
    ResourceCardComponent,
    FontAwesomeModule,
    ActionCardStackComponent
  ],
  templateUrl: './trade-menu.component.html',
  styleUrl: './trade-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeMenuComponent { 
  private readonly _inventoryRepository = inject(InventoryRepository);

  public readonly resourceTypes = resourceTypes;
  public readonly icons = {
    up: faCircleUp,
    down: faCircleDown
  }

  public readonly requestInventory = new ResourceInventory();
  public readonly offerInventory = new ResourceInventory();

  public resources = toSignal(
    this._inventoryRepository.selectInventory().pipe(
      map((inv) => Object.entries(inv).map(([type, amount]) => ({ 
        mode: resourceTypeToActionCardMode(type as ResourceType), 
        amount: amount,
        card: resourceTypeToResourceCard(type as ResourceType)
      }))),
      map((resources) => resources.filter(r => r.amount > 0)),
      tap(console.log)
    )
  )

  public requestedResources = toSignal(
    this.requestInventory.selectInventory().pipe(
      map((inv) => Object.entries(inv).map(([type, amount]) => ({ 
        mode: resourceTypeToActionCardMode(type as ResourceType), 
        amount: amount,
        card: resourceTypeToResourceCard(type as ResourceType)
      }))),
      map((resources) => resources.filter(r => r.amount > 0)),
      tap(console.log)
    )
  )

  //todo fix this
  public offeredResources = toSignal(
    this.offerInventory.selectInventory().pipe(
      map((inv) => Object.entries(inv).map(([type, amount]) => ({ 
        mode: resourceTypeToActionCardMode(type as ResourceType), 
        amount: amount,
        card: resourceTypeToResourceCard(type as ResourceType)
      }))),
      map((resources) => resources.filter(r => r.amount > 0)),
      tap(console.log)
    )
  )

  public addResource(type: ResourceType) {
    this.requestInventory.addToInventory(type, 1);
  }

  public removeResource(type: ResourceType) {
    this.requestInventory.removeFromInventory(type, 1);
  }

  public removeOfferedResource(type: ResourceType) {
    this.offerInventory.removeFromInventory(type, 1);
    this._inventoryRepository.updateRelativeResourceAmount(type, 1);
  }

  public addOfferedResource(type: ResourceType) {
    this.offerInventory.addToInventory(type, 1);
    this._inventoryRepository.updateRelativeResourceAmount(type, -1);
  }


}
