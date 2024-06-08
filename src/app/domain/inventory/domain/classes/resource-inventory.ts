import { Resources } from "../../../resources/domain/models/resources.model";
import { Inventory } from "./inventory";

export class ResourceInventory extends Inventory<Resources>{

  constructor(_resources = {
    straw: 0,
    stone: 0,
    wool: 0,
    bricks: 0,
    wood: 0
  }) {
    super(_resources);
  }

  public get resources() {
    return this._inventory.value;
  }

  public get amount() {
    return Object.values(this._inventory.value).reduce((a, b) => a + b, 0);
  }

}