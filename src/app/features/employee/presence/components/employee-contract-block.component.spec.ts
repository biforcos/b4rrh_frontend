import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  EmployeeContractBlockComponent,
  EmployeeContractBlockModel,
} from './employee-contract-block.component';

describe('EmployeeContractBlockComponent', () => {
  let fixture: ComponentFixture<EmployeeContractBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeContractBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContractBlockComponent);
  });

  it('renders Name · CODE for contract type and subtype when names exist', () => {
    const model: EmployeeContractBlockModel = {
      currentContract: {
        contractCode: 'IND',
        contractTypeName: 'Indefinido',
        contractSubtypeCode: 'FT1',
        contractSubtypeName: 'Tiempo completo',
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      currentContractKind: 'active',
      contractHistory: [],
    };

    fixture.componentRef.setInput('contract', model);
    fixture.detectChanges();

    const identityEl = fixture.nativeElement.querySelector('.employee-contract-block__identity') as HTMLElement | null;
    const subtypeEl = fixture.nativeElement.querySelector('.employee-contract-block__subtype') as HTMLElement | null;

    expect(identityEl?.textContent ?? '').toContain('Indefinido');
    expect(identityEl?.textContent ?? '').toContain('IND');
    expect(subtypeEl?.textContent ?? '').toContain('Tiempo completo');
    expect(subtypeEl?.textContent ?? '').toContain('FT1');
  });

  it('falls back to CODE when names are missing', () => {
    const model: EmployeeContractBlockModel = {
      currentContract: {
        contractCode: 'TMP',
        contractTypeName: null,
        contractSubtypeCode: 'PT1',
        contractSubtypeName: null,
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      currentContractKind: 'active',
      contractHistory: [],
    };

    fixture.componentRef.setInput('contract', model);
    fixture.detectChanges();

    const hostText = fixture.nativeElement.textContent as string;

    expect(hostText).toContain('TMP');
    expect(hostText).toContain('PT1');
  });
});
