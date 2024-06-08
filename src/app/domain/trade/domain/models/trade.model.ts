import { ResourceInventory,  } from "../../../inventory/domain/classes/resource-inventory";
import { Player } from "../../../player/domain/classes/player";
import { Resources } from "../../../resources/domain/models/resources.model";


export interface TradeOffer {
  id: string;
  offeredResources: Partial<Resources>;
  requestedResources: Partial<Resources>;
  player: Player;
}


export interface TradeResponse {
  tradeId: string;
  respondedPlayer: Player;
  accepted: boolean;
}

export interface TradeComplete {
  trade: TradeOffer;
  acceptedPlayer: Player;
}

export interface TradeCancel {
  tradeId: string;
}

export interface OpenTradeOffer {
  offer: TradeOffer;
  playerResponses: { [playerId: string]: boolean };
}