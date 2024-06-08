
import { Field } from "../../../../playground/domain/classes/field";
import { PlaygroundDimensions } from "../../../../playground/domain/models/playground.model";
import { ResourceField } from "../../models/resource-field.model";
import { ResourceType } from "../../models/resources.model";
import { BrickResourceField } from "../fields/brick-resource-field";
import { SheepResourceField } from "../fields/sheep-resource-field";
import { StoneResourceField } from "../fields/stone-resource-field";
import { StrawResourceField } from "../fields/straw-resource-field";
import { WoodResourceField } from "../fields/wood-resource-field";

export class ResourceGenerator {
  private resourceRarity = {
    wool: 0.2,
    wood: 0.3,
    stone: 0.1,
    straw: 0.2,
    bricks: 0.2,
  }

  public generateResources(grid: Field[], dimensions: PlaygroundDimensions): ResourceField[] {
    const waterAround = 2;
    // filtere die seiten raus, da diese Wasser bleiben sollen!!!!
    const filteredGrid = this.filterWaterAround(waterAround, dimensions, grid);

    return filteredGrid.map((f) => {
      const randomType = this.generateRandomResourceType();
      const randomNumber = this.generateRandomNumber();
      return this.getResourceByType(randomType, f, randomNumber);
    });
  }

  private filterWaterAround(waterAround: number, dimensions: PlaygroundDimensions, grid: Field[]): Field[] {
    return grid.filter(({ colIndex, rowIndex }) => {
      const { fieldWidth, fieldHeight } = dimensions;
      return (
          colIndex > 1 &&
          colIndex < fieldWidth - waterAround &&
          rowIndex > 1 &&
          rowIndex < fieldHeight - waterAround
      );
  });
  }

  // generates a random resourcetype based on resource Rarity
  private generateRandomResourceType(): ResourceType {
    return Object.keys(this.resourceRarity)[Math.floor(Math.random() * Object.keys(this.resourceRarity).length)] as ResourceType
  }

  private generateRandomNumber(min: number = 2, max: number = 12): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

  public getResourceByType(type: ResourceType, field: Field, value: number): ResourceField {
    switch(type) {
      case 'bricks':
        return new BrickResourceField(field, value);
      case 'wool':
        return new SheepResourceField(field, value);
      case 'stone':
        return new StoneResourceField(field, value);
      case 'straw':
        return new StrawResourceField(field, value);
      case 'wood':
        return new WoodResourceField(field, value);
    }
  }
}
