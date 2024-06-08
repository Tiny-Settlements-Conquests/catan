import { ResourceInventory } from "../../../inventory/domain/classes/resource-inventory";
import { Player } from "../../../player/domain/classes/player";
import { Field } from "../../../playground/domain/classes/field";
import { Playground } from "../../../playground/domain/classes/playground";
import { ResourceType } from "../../../resources/domain/models/resources.model";


export class RobberManager {
  private robberPosition: Field | null = null;

  constructor(private playground: Playground) {}

  public playerRobsAtPosition(player:Player, position: Field): void {
    this.moveRobber(position);
    const players = this.getPlayersByNearbyPosition(position);
    console.log("PLAYÖRS", players)
    const randomPlayer = this.getRandomPlayerExclude(player, players);
    if(!randomPlayer) {
      throw new Error('No player nearby');
    }
    const stolenResource = this.stealRandomResourceFromPlayer(randomPlayer);
    if(stolenResource) {
        player.resourceInventory.addToInventory(stolenResource, 5);
    }

  }

  private moveRobber(newPosition: Field): void {
    this.robberPosition = newPosition;
  }

  private getRandomPlayerExclude(player: Player, players: Player[]): Player {
    return players.filter((p) => p.id!== player.id)[0];
  }

  private getPlayersByNearbyPosition(field: Field): Player[] {
    //!! TODO fehleranfällig, bessere abstrahierungsebene definieren, die felder mit graph-points verbindet
    return this.playground.buildingGraph.nodes.filter((n) => field.polygon.points.find((p) => p.equals(n.position))).map((n) => n.player);
  }

  private stealRandomResourceFromPlayer(victim: Player): ResourceType | null {
    if (!this.robberPosition) {
      throw new Error('Robber position not set');
    }

    const victimResources = victim.resourceInventory;
    const stolenResource = this.getRandomResource(victimResources);

    if (stolenResource) {
      victim.resourceInventory.removeFromInventory(stolenResource, 5);
    }
    return stolenResource;
  }

  private getRandomResource(resources: ResourceInventory): ResourceType | null {
    const resourceTypes: ResourceType[] = ['wood', 'wool', 'straw', 'stone', 'bricks'];
    const availableResources = resourceTypes.filter((type) => resources.resources[type] > 0);

    if (availableResources.length === 0) {
      return null; // No resources to steal
    }

    const randomIndex = Math.floor(Math.random() * availableResources.length);
    return availableResources[randomIndex];
  }
}