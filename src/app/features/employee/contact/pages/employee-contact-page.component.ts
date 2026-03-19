import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import {
  EmployeeAddressBlockComponent,
  EmployeeAddressBlockItemModel,
  EmployeeAddressBlockModel,
} from '../components/employee-address-block.component';
import {
  EmployeeContactBlockComponent,
  EmployeeContactBlockModel,
} from '../components/employee-contact-block.component';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeAddressModel } from '../../models/employee-address.model';
import { EmployeeContactModel } from '../../models/employee-contact.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeContactBlockComponent, EmployeeAddressBlockComponent],
  templateUrl: './employee-contact-page.component.html',
  styleUrl: './employee-contact-page.component.scss',
})
export class EmployeeContactPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeAddressStore = inject(EmployeeAddressStore);
  private readonly employeeContactStore = inject(EmployeeContactStore);

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
  protected readonly loadingPersonals = computed(
    () => this.loadingContacts() || this.loadingAddresses(),
  );
  protected readonly contactBlockModel = computed<EmployeeContactBlockModel>(() =>
    this.toContactBlockModel(this.contacts()),
  );
  protected readonly addressBlockModel = computed<EmployeeAddressBlockModel>(() =>
    this.toAddressBlockModel(this.addresses()),
  );

  constructor() {
    effect(() => {
      this.employeeContactStore.loadContactsByBusinessKey(this.activeEmployeeKey());
      this.employeeAddressStore.loadAddressesByBusinessKey(this.activeEmployeeKey());
    });
  }

  private toContactBlockModel(contacts: ReadonlyArray<EmployeeContactModel>): EmployeeContactBlockModel {
    const phoneContacts = contacts.filter((contact) => contact.type === 'phone');
    const emailContacts = contacts.filter((contact) => contact.type === 'email');
    const otherContacts = contacts.filter((contact) => contact.type === 'other');

    const primaryPhone = phoneContacts[0]?.value ?? null;
    const primaryEmail = emailContacts[0]?.value ?? null;

    return {
      primaryPhone,
      primaryEmail,
      secondaryContacts: [
        ...phoneContacts.slice(primaryPhone ? 1 : 0),
        ...emailContacts.slice(primaryEmail ? 1 : 0),
        ...otherContacts,
      ].map((contact) => ({
        type: contact.type,
        label: contact.label,
        value: contact.value,
      })),
    };
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
