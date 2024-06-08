import { Injectable } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import { map } from 'rxjs';
import { ResourceType, Resources } from '../../../resources/domain/models/resources.model';

const inventoryStore = createStore(
    { name: 'inventory' },
    withProps<Resources>({
        bricks:0,
        stone: 0,
        straw: 0,
        wood: 0,
        wool: 0
    })
);

@Injectable(
  { providedIn: 'root' }
)
export class InventoryRepository {

  public updateResourceAmount(resourceType: ResourceType, amount: number) {
    inventoryStore.update(state => ({ ...state, [resourceType]: amount }));
  }

  public setResources(resources: Resources) {
    inventoryStore.update(state => ({...state,...resources }));
  }

  public selectInventory() {
    return inventoryStore.pipe()
  }

  public getMode() {
    return inventoryStore.query(state => state);
  }

  public setInventory(inventory: Resources) {
    inventoryStore.update(() => ({...inventory }));
  }

  public updateRelativeResourceAmount(resourceType: ResourceType, amount: number) {
    inventoryStore.update(state => ({ ...state, [resourceType]: state[resourceType] += amount }));
  }

}
