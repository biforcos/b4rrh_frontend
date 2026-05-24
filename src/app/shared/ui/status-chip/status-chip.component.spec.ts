import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let fixture: ComponentFixture<StatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusChipComponent);
  });

  it('renders the label text', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activo');
  });

  it('applies active variant class', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--active'));
    expect(chip).toBeTruthy();
  });

  it('applies inactive variant class', () => {
    fixture.componentRef.setInput('label', 'Baja');
    fixture.componentRef.setInput('variant', 'inactive');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--inactive'));
    expect(chip).toBeTruthy();
  });

  it('applies warning variant class', () => {
    fixture.componentRef.setInput('label', 'Pendiente');
    fixture.componentRef.setInput('variant', 'warning');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--warning'));
    expect(chip).toBeTruthy();
  });

  it('applies error variant class', () => {
    fixture.componentRef.setInput('label', 'Error');
    fixture.componentRef.setInput('variant', 'error');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--error'));
    expect(chip).toBeTruthy();
  });

  it('shows dot element', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    const dot = fixture.debugElement.query(By.css('.status-chip__dot'));
    expect(dot).toBeTruthy();
  });
});
