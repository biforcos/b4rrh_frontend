import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { EmployeeCostCenterStore } from '../../data-access/employee-cost-center.store';
import { employeeTexts } from '../../employee.texts';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';
import { EmployeeWorkCenterSectionComponent } from '../../presence/components/employee-work-center-section.component';
import { EmployeeCostCenterSectionComponent } from '../components/employee-cost-center-section.component';

@Component({
  selector: 'app-employee-organization-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeWorkCenterSectionComponent, EmployeeCostCenterSectionComponent],
  templateUrl: './employee-organization-page.component.html',
  styleUrl: './employee-organization-page.component.scss',
})
export class EmployeeOrganizationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeWorkCenterStore = inject(EmployeeWorkCenterStore);
  private readonly employeeCostCenterStore = inject(EmployeeCostCenterStore);

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    {
      initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap),
    },
  );
  protected readonly loadingWorkCenters = this.employeeWorkCenterStore.loading;
  protected readonly loadingCostCenters = this.employeeCostCenterStore.loading;
  protected readonly workCentersError = this.employeeWorkCenterStore.error;
  protected readonly costCentersError = this.employeeCostCenterStore.error;
  protected readonly organizationAreaLoading = computed(() => this.loadingWorkCenters() || this.loadingCostCenters());
}
