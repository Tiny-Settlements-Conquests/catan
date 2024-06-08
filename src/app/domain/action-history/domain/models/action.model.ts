import { PlaceableType } from "../../../buildings/domain/models/building.model";
import { Dices } from "../../../dice/domain/models/dice.model";
import { Player } from "../../../player/domain/classes/player";
import { ResourceCard } from "../../../resources/domain/models/resource-card.model";

export type HistoryAction = (BuildAction | TradeAction | DiceAction | ResourceAction) & { id: string };

export type BuildAction = {
    typ: 'build',
    player: Player,
    building: PlaceableType
}

export type TradeAction = {
    typ: 'trade',
    playerA: Player,
    playerB: Player,
    givenResources: ResourceCard[],
    receivedResources: ResourceCard[],
}

export type DiceAction = {
    typ: 'dice',
    player: Player,
    dice: Dices
}

export type ResourceAction = {
    typ: 'resource',
    player: Player,
    receivedResources: ResourceCard[]
}