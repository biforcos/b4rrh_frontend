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

  it('renders company name and entry reason when labels exist', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 1,
        companyCode: 'AC01',
        companyName: 'Empresa Activa',
        entryReasonCode: 'ENT01',
        entryReasonName: 'Alta inicial',
        exitReasonCode: null,
        exitReasonName: null,
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

    expect(hostText).toContain('Empresa Activa');
    expect(hostText).toContain('#1');
    expect(hostText).toContain('Alta inicial');
  });

  it('falls back to CODE when companyName is missing and renders entry reason code', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 1,
        companyCode: 'AC01',
        companyName: null,
        entryReasonCode: 'ENT01',
        entryReasonName: null,
        exitReasonCode: 'EXT01',
        exitReasonName: null,
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
    expect(hostText).toContain('ENT01');
  });

  it('renders backend catalog labels in Name · CODE format when label maps are provided', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 2,
        companyCode: 'COMP-ES',
        companyName: null,
        entryReasonCode: 'HIRE',
        entryReasonName: null,
        exitReasonCode: 'END',
        exitReasonName: null,
        startDate: '2026-02-01',
        endDate: null,
        isActive: true,
      },
      currentPresenceKind: 'active',
      presenceHistory: [],
    };

    fixture.componentRef.setInput('presence', model);
    fixture.componentRef.setInput('companyLabelsByCode', {
      'COMP-ES': 'Compania Espana · COMP-ES',
    });
    fixture.componentRef.setInput('entryReasonLabelsByCode', {
      HIRE: 'Alta inicial · HIRE',
    });
    fixture.componentRef.setInput('exitReasonLabelsByCode', {
      END: 'Fin de relacion · END',
    });
    fixture.detectChanges();

    const hostText = fixture.nativeElement.textContent as string;
    expect(hostText).toContain('Compania Espana · COMP-ES');
    expect(hostText).toContain('Alta inicial · HIRE');
  });

  it('keeps rendering when one backend catalog map is empty', () => {
    const model: EmployeePresenceBlockModel = {
      currentPresence: {
        presenceNumber: 3,
        companyCode: 'COMP-ES',
        companyName: null,
        entryReasonCode: 'HIRE',
        entryReasonName: null,
        exitReasonCode: 'END',
        exitReasonName: null,
        startDate: '2026-02-10',
        endDate: null,
        isActive: true,
      },
      currentPresenceKind: 'active',
      presenceHistory: [],
    };

    fixture.componentRef.setInput('presence', model);
    fixture.componentRef.setInput('companyLabelsByCode', {
      'COMP-ES': 'Compania Espana · COMP-ES',
    });
    fixture.componentRef.setInput('entryReasonLabelsByCode', {
      HIRE: 'Alta inicial · HIRE',
    });
    fixture.componentRef.setInput('exitReasonLabelsByCode', {});
    fixture.detectChanges();

    const hostText = fixture.nativeElement.textContent as string;
    expect(hostText).toContain('Compania Espana · COMP-ES');
    expect(hostText).toContain('Alta inicial · HIRE');
  });
});
