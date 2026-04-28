import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeriodTableComponent } from './period-table.component';
import { PeriodTableRow } from './period-table.model';

interface TestRow extends PeriodTableRow { label: string; }
const row = (o: Partial<TestRow> = {}): TestRow =>
  ({ startDate: '2024-01-01', endDate: null, isActive: true, label: 'A', ...o });

@Component({
  template: `
    <app-period-table [rows]="rows" sectionTitle="Test"
      (addClicked)="adds=adds+1" (editClicked)="editIdx=$event" (deleteClicked)="delIdx=$event">
      <ng-template #columnHeaders><th>Label</th></ng-template>
      <ng-template #cellContent let-r><td>{{ r.label }}</td></ng-template>
    </app-period-table>`,
  imports: [PeriodTableComponent],
})
class Host { rows: TestRow[] = []; adds = 0; editIdx: number|null = null; delIdx: number|null = null; }

function createHost(initialRows: TestRow[] = []): { fix: ComponentFixture<Host>; host: Host } {
  const fix = TestBed.createComponent(Host);
  const host = fix.componentInstance;
  host.rows = initialRows;
  fix.detectChanges();
  return { fix, host };
}

describe('PeriodTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  });

  it('shows empty when no rows', () => {
    const { fix } = createHost([]);
    expect(fix.nativeElement.querySelector('.period-table__empty')).toBeTruthy();
  });

  it('renders active row with Vigente badge', () => {
    const { fix } = createHost([row()]);
    expect(fix.nativeElement.querySelector('.period-table__badge--active')).toBeTruthy();
    expect(fix.nativeElement.querySelector('.period-table__td--period').textContent).toContain('2024-01-01');
  });

  it('formats active period as startDate — en vigor', () => {
    const { fix } = createHost([row({ startDate: '2024-01-01', endDate: null, isActive: true })]);
    expect(fix.nativeElement.querySelector('.period-table__td--period').textContent).toContain('en vigor');
  });

  it('formats closed period as startDate — endDate', () => {
    const { fix } = createHost([row({ startDate: '2022-01-01', endDate: '2023-12-31', isActive: false })]);
    expect(fix.nativeElement.querySelector('.period-table__td--period').textContent).toContain('2022-01-01');
    expect(fix.nativeElement.querySelector('.period-table__td--period').textContent).toContain('2023-12-31');
  });

  it('shows delete only for non-active canDelete rows', () => {
    const { fix } = createHost([
      row({ isActive: true }),
      row({ isActive: false, canDelete: true }),
    ]);
    expect(fix.nativeElement.querySelectorAll('[aria-label^="Eliminar"]').length).toBe(1);
  });

  it('does not show delete for non-active rows when canDelete is false', () => {
    const { fix } = createHost([row({ isActive: false, canDelete: false })]);
    expect(fix.nativeElement.querySelector('[aria-label^="Eliminar"]')).toBeNull();
  });

  it('hides edit button when canEdit is false', () => {
    const { fix } = createHost([row({ canEdit: false })]);
    expect(fix.nativeElement.querySelector('[aria-label^="Editar"]')).toBeNull();
  });

  it('emits addClicked', () => {
    const { fix, host } = createHost([]);
    fix.nativeElement.querySelector('.period-table__add-btn').click();
    expect(host.adds).toBe(1);
  });

  it('emits editClicked with index', () => {
    const { fix, host } = createHost([row()]);
    fix.nativeElement.querySelector('[aria-label^="Editar"]').click();
    expect(host.editIdx).toBe(0);
  });

  it('emits deleteClicked with index', () => {
    const { fix, host } = createHost([row({ isActive: false, canDelete: true })]);
    fix.nativeElement.querySelector('[aria-label^="Eliminar"]').click();
    expect(host.delIdx).toBe(0);
  });

  it('renders custom column headers via ContentChild', () => {
    const { fix } = createHost([row()]);
    const headers = Array.from(fix.nativeElement.querySelectorAll('th')) as HTMLElement[];
    expect(headers.some(h => h.textContent?.includes('Label'))).toBe(true);
  });

  it('renders custom cell content via ContentChild', () => {
    const { fix } = createHost([row({ label: 'My Label' })]);
    expect(fix.nativeElement.textContent).toContain('My Label');
  });
});
