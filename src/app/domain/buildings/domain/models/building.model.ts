import { GraphNode } from "../../../graph/domain/classes/graph-node";
import { Player } from "../../../player/domain/classes/player";

/**
 * @deprecated replace by BuildingTyp
 */
export type BuildingTyp = 'town' | 'city';

export enum BuildingType {
    TOWN = 'town',
    CITY = 'city',
}

export enum PathType {
    ROAD = 'road',
    SEA_PATH ='seaPath'
}

export type PlaceableType = BuildingType | PathType;

export interface Buildable {
    type: BuildingType | PathType;
    owner: Player,
}
export interface Building extends Buildable {
    type: BuildingType;
    winningPoints: number;
    graphNode: GraphNode
}


export interface PathBuilding extends Buildable {
    type: PathType;
    graphNodeA: GraphNode;
    graphNodeB: GraphNode
}



