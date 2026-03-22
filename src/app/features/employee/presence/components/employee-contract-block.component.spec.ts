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

    const identityLines = Array.from(
      fixture.nativeElement.querySelectorAll('.employee-contract-block__current-item .employee-contract-block__identity'),
    ) as HTMLElement[];

    expect(identityLines[0]?.textContent ?? '').toContain('Indefinido');
    expect(identityLines[0]?.textContent ?? '').toContain('IND');
    expect(identityLines[1]?.textContent ?? '').toContain('Tiempo completo');
    expect(identityLines[1]?.textContent ?? '').toContain('FT1');
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
