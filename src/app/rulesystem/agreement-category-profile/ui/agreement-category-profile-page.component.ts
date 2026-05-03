import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiSelectComponent } from '../../../shared/ui/select/ui-select.component';
import { AgreementCategoryProfileStore } from '../store/agreement-category-profile.store';

@Component({
  selector: 'app-agreement-category-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSelectComponent, UiButtonComponent],
  templateUrl: './agreement-category-profile-page.component.html',
  styleUrl: './agreement-category-profile-page.component.scss',
})
export class AgreementCategoryProfilePageComponent implements OnInit {
  protected readonly store = inject(AgreementCategoryProfileStore);

  protected readonly TIPO_NOMINA_OPTIONS = [
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'DIARIO', label: 'Diaria' },
  ];

  ngOnInit(): void {
    this.store.initialize();
  }
}
