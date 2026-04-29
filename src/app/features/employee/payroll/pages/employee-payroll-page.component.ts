import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';

import { employeeTexts } from '../../employee.texts';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';
import { EmployeePayrollInputSectionComponent } from '../components/employee-payroll-input-section.component';

@Component({
  selector: 'app-employee-payroll-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeePayrollInputSectionComponent],
  templateUrl: './employee-payroll-page.component.html',
  styleUrl: './employee-payroll-page.component.scss',
})
export class EmployeePayrollPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    { initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap) },
  );
}
