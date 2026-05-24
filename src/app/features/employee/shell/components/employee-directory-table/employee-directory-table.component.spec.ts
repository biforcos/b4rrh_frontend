import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmployeeDirectoryTableComponent } from './employee-directory-table.component';
import { EmployeeListItemModel } from '../../../models/employee-list-item.model';

const MOCK_ITEMS: EmployeeListItemModel[] = [
  { ruleSystemCode: 'ESP', employeeTypeCode: 'INTERNAL', employeeNumber: '001', displayName: 'García Ruiz, Juan', workCenter: 'Madrid', statusLabel: 'Alta' },
  { ruleSystemCode: 'ESP', employeeTypeCode: 'INTERNAL', employeeNumber: '002', displayName: 'Martínez López, Ana', workCenter: 'Madrid', statusLabel: 'Baja' },
];

describe('EmployeeDirectoryTableComponent', () => {
  let fixture: ComponentFixture<EmployeeDirectoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDirectoryTableComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeDirectoryTableComponent);
  });

  it('renders one row per item', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('.dir-table__row'));
    expect(rows).toHaveLength(2);
  });

  it('shows displayName in each row', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('García Ruiz, Juan');
  });

  it('shows matricula in mono format', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    const matriculas = fixture.debugElement.queryAll(By.css('.dir-table__matricula'));
    expect(matriculas[0].nativeElement.textContent).toContain('ESP');
    expect(matriculas[0].nativeElement.textContent).toContain('001');
  });

  it('emits employeeClicked when row is clicked', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    let emitted: EmployeeListItemModel | null = null;
    fixture.componentInstance.employeeClicked.subscribe((e: EmployeeListItemModel) => (emitted = e));
    const row = fixture.debugElement.query(By.css('.dir-table__row'));
    row.triggerEventHandler('click', null);
    expect(emitted).toEqual(MOCK_ITEMS[0]);
  });

  it('shows empty state when items is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    const empty = fixture.debugElement.query(By.css('.dir-table__empty'));
    expect(empty).toBeTruthy();
  });

  it('shows loading skeleton rows when loading is true', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeletons = fixture.debugElement.queryAll(By.css('.dir-table__skeleton-row'));
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
