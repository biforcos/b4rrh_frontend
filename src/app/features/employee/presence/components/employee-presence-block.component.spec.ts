import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  EmployeePresenceBlockComponent,
  EmployeePresenceBlockModel,
} from './employee-presence-block.component';

describe('EmployeePresenceBlockComponent', () => {
  let fixture: ComponentFixture<EmployeePresenceBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeePresenceBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeePresenceBlockComponent);
  });

  it('renders Name · CODE when companyName exists', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 1,
        companyCode: 'AC01',
        companyName: 'Empresa Activa',
        entryReasonCode: 'ENT01',
        exitReasonCode: null,
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      currentPresenceKind: 'active',
      presenceHistory: [],
    };

    fixture.componentRef.setInput('presence', model);
    fixture.detectChanges();

    const identity =
      fixture.nativeElement.querySelector('.employee-presence-block__current-item .employee-presence-block__identity')
        ?.textContent ?? '';

    expect(identity).toContain('Empresa Activa');
    expect(identity).toContain('AC01');
    expect(identity).toContain('#1');
  });

  it('falls back to CODE when companyName is missing and keeps period/reason rendering', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 1,
        companyCode: 'AC01',
        companyName: null,
        entryReasonCode: 'ENT01',
        exitReasonCode: null,
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      currentPresenceKind: 'active',
      presenceHistory: [],
    };

    fixture.componentRef.setInput('presence', model);
    fixture.detectChanges();

    const hostText = fixture.nativeElement.textContent as string;

    expect(hostText).toContain('AC01');
    expect(hostText).toContain('Periodo');
    expect(hostText).toContain('Motivo entrada');
  });
});
