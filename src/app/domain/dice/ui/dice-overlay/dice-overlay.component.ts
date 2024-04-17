import { AfterViewInit, ChangeDetectionStrategy, Component, ComponentRef, ElementRef, Input, ViewChild, inject, output, signal } from '@angular/core';
import { DiceRandomNumberComponent } from '../dice-random-number/dice-random-number.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dice-overlay',
  standalone: true,
  imports: [
    DiceRandomNumberComponent
  ],
  templateUrl: './dice-overlay.component.html',
  styleUrl: './dice-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceOverlayComponent{ 
  public readonly hasRolled = signal(false);

  @ViewChild(DiceRandomNumberComponent)
  private readonly diceComponent : DiceRandomNumberComponent | undefined;

  public readonly result = new Subject();

  public readonly diceRollStart = new Subject();

  dices: [number, number] = [1,1]

  public rollDices() {
    if(this.hasRolled() || this.diceComponent === undefined) return
    this.hasRolled.set(true);
    this.diceComponent.setDices = this.dices;
    this.diceComponent?.result.subscribe(() => {
      this.result.next(this.dices);
    })
  }
}
