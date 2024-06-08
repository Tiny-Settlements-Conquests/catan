import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ActionCardComponent } from '../../../cards/feature/action-card/action-card.component';
import { resourceTypeToActionCardMode, resourceTypeToResourceCard } from '../../domain/function/resource-type.function';
import { ResourceType } from '../../domain/models/resources.model';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [
    ActionCardComponent
  ],
  templateUrl: './resource-card.component.html',
  styleUrl: './resource-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCardComponent { 
  public readonly resourceType = input<ResourceType | undefined>(undefined);

  public readonly resourceCard = computed(() => {
    const resourceType = this.resourceType();
    if(typeof resourceType === 'undefined') return;
    return resourceTypeToResourceCard(resourceType)
  })

  public readonly resourceCardMode = computed(() => {
    const resourceType = this.resourceType();
    if(typeof resourceType === 'undefined') return 'red';
    return resourceTypeToActionCardMode(resourceType);
  })

}
