import { Field } from "../../../playground/domain/classes/field";
import { ResourceField } from "../../models/resource-field.model";
import { Resource } from "./resource-field";

export class StrawResourceField extends Resource implements ResourceField{
  public readonly typ ='straw';
  public readonly color = '#eab308';

  constructor(
    public readonly field: Field,
    public readonly value: number
  ) { 
    super()
    this._image.src = "/assets/images/wheat.png";
  }
}