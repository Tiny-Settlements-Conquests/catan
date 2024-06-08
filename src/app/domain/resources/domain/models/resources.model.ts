export type ResourceType = 'stone' | 'wool' | 'bricks' | 'wood' | 'straw';
export type Resources = {[key in ResourceType]: number}
export const resourceTypes: ResourceType[] = ['bricks', 'stone', 'wood', 'wool', 'straw'];
