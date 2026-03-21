import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import {
  EmployeeAddressBlockComponent,
  EmployeeAddressBlockItemModel,
  EmployeeAddressBlockModel,
} from '../components/employee-address-block.component';
import { EmployeeContactSectionComponent } from '../components/employee-contact-section.component';
import { EmployeeIdentifierSectionComponent } from '../components/employee-identifier-section.component';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { EmployeeIdentifierStore } from '../../data-access/employee-identifier.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeAddressModel } from '../../models/employee-address.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmployeeContactSectionComponent,
    EmployeeAddressBlockComponent,
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
  protected readonly addresses = this.employeeAddressStore.addresses;
  protected readonly loadingAddresses = this.employeeAddressStore.loading;
  protected readonly addressesError = this.employeeAddressStore.error;
  protected readonly loadingIdentifiers = this.employeeIdentifierStore.loading;
  protected readonly identifiersError = this.employeeIdentifierStore.error;
  protected readonly loadingPersonals = computed(
    () => this.loadingContacts() || this.loadingAddresses() || this.loadingIdentifiers(),
  );
  protected readonly addressBlockModel = computed<EmployeeAddressBlockModel>(() =>
    this.toAddressBlockModel(this.addresses()),
  );

  constructor() {
    effect(() => {
      this.employeeAddressStore.loadAddressesByBusinessKey(this.activeEmployeeKey());
    });
  }

  private toAddressBlockModel(addresses: ReadonlyArray<EmployeeAddressModel>): EmployeeAddressBlockModel {
    const sortedAddresses = [...addresses].sort((left, right) => this.compareAddressOrder(left, right));

    const primaryAddress = sortedAddresses[0] ?? null;

    return {
      primaryAddress: primaryAddress ? this.toAddressBlockItemModel(primaryAddress) : null,
      secondaryAddresses: sortedAddresses.slice(1).map((address) => this.toAddressBlockItemModel(address)),
    };
  }

  private compareAddressOrder(left: EmployeeAddressModel, right: EmployeeAddressModel): number {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return left.addressNumber - right.addressNumber;
  }

  private toAddressBlockItemModel(address: EmployeeAddressModel): EmployeeAddressBlockItemModel {
    return {
      typeLabel: address.addressTypeCode,
      street: address.street,
      locality: this.buildAddressLocality(address),
      validity: this.buildAddressValidityLabel(address),
      isActive: address.isActive,
    };
  }

  private buildAddressLocality(address: EmployeeAddressModel): string {
    return [address.postalCode, address.city, address.regionCode, address.countryCode]
      .filter((value) => Boolean(value))
      .join(' · ');
  }

  private buildAddressValidityLabel(address: EmployeeAddressModel): string | null {
    const startDate = address.startDate.trim();
    const endDate = address.endDate?.trim() ?? '';

    if (!startDate && !endDate) {
      return null;
    }

    if (!endDate) {
      return startDate;
    }

    return `${startDate} - ${endDate}`;
  }
}
