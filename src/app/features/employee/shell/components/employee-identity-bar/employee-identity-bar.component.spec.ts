import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmployeeIdentityBarComponent } from './employee-identity-bar.component';
import { EmployeeDetailModel } from '../../../models/employee-detail.model';

const MOCK_EMPLOYEE: EmployeeDetailModel = {
  id: 1,
  ruleSystemCode: 'ESP',
  employeeTypeCode: 'INTERNAL',
  employeeNumber: '001',
  firstName: 'Juan',
  lastName1: 'García',
  lastName2: 'Ruiz',
  preferredName: null,
  displayName: 'García Ruiz, Juan',
  statusLabel: 'Alta',
  workCenter: 'Madrid',
  photoUrl: null,
};

describe('EmployeeIdentityBarComponent', () => {
  let fixture: ComponentFixture<EmployeeIdentityBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeIdentityBarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeIdentityBarComponent);
  });

  it('shows employee displayName', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('García Ruiz, Juan');
  });

  it('shows matricula chip with ruleSystemCode and employeeNumber', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.identity-bar__matricula'));
    expect(chip.nativeElement.textContent).toContain('ESP');
    expect(chip.nativeElement.textContent).toContain('001');
  });

  it('renders nothing when employee is null', () => {
    fixture.componentRef.setInput('employee', null);
    fixture.detectChanges();
    const bar = fixture.debugElement.query(By.css('.identity-bar'));
    expect(bar).toBeNull();
  });

  it('renders avatar initials derived from firstName and lastName1', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('JG');
  });

  it('shows workCenter in meta line', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    const meta = fixture.debugElement.query(By.css('.identity-bar__meta'));
    expect(meta.nativeElement.textContent).toContain('Madrid');
  });
});
