import { Field } from "../../../playground/domain/classes/field";
import { ResourceType } from "./resources.model";


export interface ResourceField {
    typ: ResourceType
    color: string
    field: Field
    value: number
    resourceImage: HTMLImageElement
    resourceValueImage: HTMLImageElement
    resourceBackgroundImage: HTMLImageElement
}


