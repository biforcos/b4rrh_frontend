import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { employeeTexts } from '../../employee.texts';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-overview-page.component.html',
  styleUrl: './employee-overview-page.component.scss',
})
export class EmployeeOverviewPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly texts = employeeTexts;
  protected readonly employeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    {
      initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap),
    },
  );
}
