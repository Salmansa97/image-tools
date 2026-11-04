import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  POPULAR_TOOLS,
  TOOL_CATEGORIES,
  ToolCategory,
  toolsInCategory,
} from '../../core/models/tools.catalog';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected readonly categories = TOOL_CATEGORIES;
  protected readonly popular = POPULAR_TOOLS;
  protected readonly year = new Date().getFullYear();

  protected toolsFor(category: ToolCategory) {
    return toolsInCategory(category);
  }
}
