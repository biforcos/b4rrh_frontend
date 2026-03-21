import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { EmployeeAddressSectionComponent } from '../components/employee-address-section.component';
import { EmployeeContactSectionComponent } from '../components/employee-contact-section.component';
import { EmployeeIdentifierSectionComponent } from '../components/employee-identifier-section.component';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { EmployeeIdentifierStore } from '../../data-access/employee-identifier.store';
import { employeeTexts } from '../../employee.texts';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmployeeContactSectionComponent,
    EmployeeAddressSectionComponent,
    EmployeeIdentifierSectionComponent,
  ],
  templateUrl: './employee-contact-page.component.html',
  styleUrl: './employee-contact-page.component.scss',
})
export class EmployeeContactPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeAddressStore = inject(EmployeeAddressStore);
  private readonly employeeContactStore = inject(EmployeeContactStore);
  private readonly employeeIdentifierStore = inject(EmployeeIdentifierStore);

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    {
      initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap),
    },
  );
  protected readonly contacts = this.employeeContactStore.contacts;
  protected readonly loadingContacts = this.employeeContactStore.loading;
  protected readonly contactsError = this.employeeContactStore.error;
  protected readonly loadingAddresses = this.employeeAddressStore.loading;
  protected readonly addressesError = this.employeeAddressStore.error;
  protected readonly loadingIdentifiers = this.employeeIdentifierStore.loading;
  protected readonly identifiersError = this.employeeIdentifierStore.error;
  protected readonly loadingPersonals = computed(
    () => this.loadingContacts() || this.loadingAddresses() || this.loadingIdentifiers(),
  );
}
