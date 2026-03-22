import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeLaborClassificationCatalogGateway } from './employee-labor-classification-catalog.gateway';
import { EmployeeLaborClassificationCatalogStore } from './employee-labor-classification-catalog.store';

const agreementsFixture = [
  {
    code: 'AGR_01',
    name: 'Convenio Oficina',
    label: 'AGR_01 · Convenio Oficina',
    startDate: '2020-01-01',
    endDate: null,
  },
  {
    code: 'AGR_02',
    name: 'Convenio Tecnico',
    label: 'AGR_02 · Convenio Tecnico',
    startDate: '2021-01-01',
    endDate: null,
  },
] as const;

const categoriesFixture = [
  {
    code: 'CAT_A',
    name: 'Categoria A',
    label: 'CAT_A · Categoria A',
    startDate: '2020-01-01',
    endDate: null,
  },
  {
    code: 'CAT_B',
    name: 'Categoria B',
    label: 'CAT_B · Categoria B',
    startDate: '2021-01-01',
    endDate: null,
  },
] as const;

describe('EmployeeLaborClassificationCatalogStore', () => {
  let store: EmployeeLaborClassificationCatalogStore;
  let gatewayMock: {
    loadAgreements: ReturnType<typeof vi.fn>;
    loadAgreementCategories: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    gatewayMock = {
      loadAgreements: vi.fn().mockReturnValue(of(agreementsFixture)),
      loadAgreementCategories: vi.fn().mockReturnValue(of(categoriesFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeLaborClassificationCatalogGateway, useValue: gatewayMock }],
    });

    store = TestBed.inject(EmployeeLaborClassificationCatalogStore);
  });

  it('loads agreements with rule system and reference date', () => {
    store.loadAgreements('PA-ES', '2026-03-01');

    expect(gatewayMock.loadAgreements).toHaveBeenCalledWith('PA-ES', '2026-03-01');
    expect(store.agreements()).toEqual(agreementsFixture);
    expect(store.loadingAgreements()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads categories when selecting agreement', () => {
    store.loadAgreements('PA-ES', '2026-03-01');

    store.selectAgreement('AGR_01');

    expect(gatewayMock.loadAgreementCategories).toHaveBeenCalledWith(
      'PA-ES',
      'AGR_01',
      '2026-03-01',
    );
    expect(store.agreementCategories()).toEqual(categoriesFixture);
    expect(store.loadingCategories()).toBe(false);
  });

  it('resets category selection when agreement changes', () => {
    store.loadAgreements('PA-ES', '2026-03-01');

    store.selectAgreement('AGR_01');
    store.selectAgreementCategory('CAT_A');

    expect(store.selectedAgreementCategoryCode()).toBe('CAT_A');

    store.selectAgreement('AGR_02');

    expect(store.selectedAgreementCode()).toBe('AGR_02');
    expect(store.selectedAgreementCategoryCode()).toBeNull();
    expect(gatewayMock.loadAgreementCategories).toHaveBeenLastCalledWith(
      'PA-ES',
      'AGR_02',
      '2026-03-01',
    );
  });

  it('sets request-failed when categories request fails', () => {
    gatewayMock.loadAgreementCategories.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadAgreements('PA-ES', '2026-03-01');
    store.selectAgreement('AGR_01');

    expect(store.agreementCategories()).toEqual([]);
    expect(store.loadingCategories()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });
});
