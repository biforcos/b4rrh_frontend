import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmployeeOverviewPageComponent } from './employee-overview-page.component';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { EmployeeLaborClassificationStore } from '../../data-access/employee-labor-classification.store';
import { EmployeeWorkingTimeStore } from '../../data-access/employee-working-time.store';
import { EmployeeCostCenterStore } from '../../data-access/employee-cost-center.store';
import { EmployeeTaxInformationStore } from '../../data-access/employee-tax-information.store';
import { EmployeeJourneyStore } from '../../data-access/employee-journey.store';

function buildMockStores() {
  return {
    detailStore: {
      selectedEmployeeDetail: signal(null),
      loadingDetail: signal(false),
      mutating: signal(false),
      mutationError: signal(null),
      mutationSuccess: signal(null),
    },
    presenceStore: {
      presences: signal([]),
      loading: signal(false),
      loadPresencesByBusinessKey: vi.fn(),
    },
    contractStore: {
      contracts: signal([]),
      loading: signal(false),
      loadContractsByBusinessKey: vi.fn(),
    },
    contactStore: {
      contacts: signal([]),
      loading: signal(false),
      loadContactsByBusinessKey: vi.fn(),
    },
    addressStore: {
      addresses: signal([]),
      loading: signal(false),
      loadAddressesByBusinessKey: vi.fn(),
    },
    workCenterStore: {
      workCenters: signal([]),
      loading: signal(false),
      loadWorkCenters: vi.fn(),
    },
    laborClassStore: {
      laborClassifications: signal([]),
      loading: signal(false),
      loadLaborClassificationsByBusinessKey: vi.fn(),
    },
    workingTimeStore: {
      workingTimes: signal([]),
      loading: signal(false),
      loadWorkingTimesByBusinessKey: vi.fn(),
    },
    costCenterStore: {
      currentDistribution: signal(null),
      history: signal(null),
      loading: signal(false),
      loadCostCenters: vi.fn(),
    },
    taxInfoStore: {
      records: signal([]),
      latest: signal(null),
      loading: signal(false),
      load: vi.fn(),
    },
    journeyStore: {
      journey: signal([]),
      loading: signal(false),
      error: signal(null),
    },
  };
}

function createFixture(mocks = buildMockStores()) {
  TestBed.configureTestingModule({
    imports: [EmployeeOverviewPageComponent],
    providers: [
      provideRouter([]),
      { provide: EmployeeDetailStore, useValue: mocks.detailStore },
      { provide: EmployeePresenceStore, useValue: mocks.presenceStore },
      { provide: EmployeeContractStore, useValue: mocks.contractStore },
      { provide: EmployeeContactStore, useValue: mocks.contactStore },
      { provide: EmployeeAddressStore, useValue: mocks.addressStore },
      { provide: EmployeeWorkCenterStore, useValue: mocks.workCenterStore },
      { provide: EmployeeLaborClassificationStore, useValue: mocks.laborClassStore },
      { provide: EmployeeWorkingTimeStore, useValue: mocks.workingTimeStore },
      { provide: EmployeeCostCenterStore, useValue: mocks.costCenterStore },
      { provide: EmployeeTaxInformationStore, useValue: mocks.taxInfoStore },
      { provide: EmployeeJourneyStore, useValue: mocks.journeyStore },
    ],
  });
  const fixture = TestBed.createComponent(EmployeeOverviewPageComponent);
  fixture.detectChanges();
  return { fixture, mocks };
}

describe('EmployeeOverviewPageComponent', () => {
  describe('contactCard', () => {
    it('counts contacts and addresses from their stores', () => {
      const mocks = buildMockStores();
      mocks.contactStore.contacts = signal([
        { contactTypeCode: 'EMAIL', value: 'a@b.com', isPrimary: true },
        { contactTypeCode: 'PHONE', value: '555', isPrimary: false },
      ] as never);
      mocks.addressStore.addresses = signal([
        { addressTypeCode: 'HOME' },
      ] as never);
      const { fixture } = createFixture(mocks);

      const comp = fixture.componentInstance as unknown as {
        contactCard: () => { count: number; addressCount: number };
      };
      expect(comp.contactCard().count).toBe(2);
      expect(comp.contactCard().addressCount).toBe(1);
    });
  });

  describe('activeWorkCenter', () => {
    it('returns the active work center', () => {
      const mocks = buildMockStores();
      mocks.workCenterStore.workCenters = signal([
        {
          workCenterAssignmentNumber: 1, workCenterCode: 'MAD', workCenterName: 'Madrid',
          startDate: '2024-01-01', endDate: null, isActive: true,
          canDelete: false, startsAtPresenceStart: false, deleteForbiddenReason: null,
        },
        {
          workCenterAssignmentNumber: 2, workCenterCode: 'BCN', workCenterName: 'Barcelona',
          startDate: '2023-01-01', endDate: '2023-12-31', isActive: false,
          canDelete: true, startsAtPresenceStart: false, deleteForbiddenReason: null,
        },
      ] as never);
      const { fixture } = createFixture(mocks);

      const comp = fixture.componentInstance as unknown as {
        activeWorkCenter: () => { code: string; name: string | null } | null;
      };
      expect(comp.activeWorkCenter()?.code).toBe('MAD');
      expect(comp.activeWorkCenter()?.name).toBe('Madrid');
    });
  });

  describe('activeWorkingTime', () => {
    it('returns the active working time weekly hours', () => {
      const mocks = buildMockStores();
      mocks.workingTimeStore.workingTimes = signal([
        {
          workingTimeNumber: 1, startDate: '2024-01-01', endDate: null,
          workingTimePercentage: 100, weeklyHours: 40, dailyHours: 8,
          monthlyHours: 160, isActive: true,
        },
      ] as never);
      const { fixture } = createFixture(mocks);

      const comp = fixture.componentInstance as unknown as {
        activeWorkingTime: () => { weeklyHours: number } | null;
      };
      expect(comp.activeWorkingTime()?.weeklyHours).toBe(40);
    });
  });
});
