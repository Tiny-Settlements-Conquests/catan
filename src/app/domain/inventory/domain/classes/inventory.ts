import { BehaviorSubject, Subject } from "rxjs";

interface StorageUpdate<T> {
  type: T;
  amount: number;
  newAmount: number;
  oldAmount: number;
}

export abstract class Inventory<T extends {[key: string | number]: number}> {
  protected readonly _inventoryUpdate = new Subject<StorageUpdate<keyof T>>();
  protected readonly _inventory = new BehaviorSubject<T>({} as T);

  constructor(_initData: T) {
    this._inventory.next(_initData);
  }


  public addToInventory<K extends keyof T>(key: K, value: number) {
    const newAmount = (this._inventory.value[key] ?? 0) + value;
    const oldAmount = this._inventory.value[key] ?? 0;
    if(newAmount < 0) throw new Error('Cannot add negative amount to inventory');

    this._inventoryUpdate.next({
      type: key,
      amount: value,
      newAmount,
      oldAmount
    });
    this._inventory.next({
      ...this._inventory.value,
      [key]: newAmount
    });
  }

  public removeFromInventory<K extends keyof T>(key: K, value: number) {
    const newAmount = (this._inventory.value[key] ?? 0) - value;
    const oldAmount = this._inventory.value[key] ?? 0;
    if(newAmount < 0) throw new Error('Cannot add negative amount to inventory');

    this._inventoryUpdate.next({
      type: key,
      amount: value,
      newAmount,
      oldAmount
    });
    this._inventory.next({
      ...this._inventory.value,
      [key]: newAmount
    });
  }

  public selectInventory() {
    return this._inventory;
  }

  public selectInventoryUpdate() {
    return this._inventoryUpdate;
  }

  public setInventory(inventory: T) {
    this._inventory.next(inventory);
  }
  
}
