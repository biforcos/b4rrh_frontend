import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataCardComponent } from './data-card.component';

describe('DataCardComponent', () => {
  let fixture: ComponentFixture<DataCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DataCardComponent);
  });

  it('renders label and value', () => {
    fixture.componentRef.setInput('label', 'Contrato');
    fixture.componentRef.setInput('value', 'Indefinido');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Contrato');
    expect(fixture.nativeElement.textContent).toContain('Indefinido');
  });

  it('renders sub when provided', () => {
    fixture.componentRef.setInput('label', 'Jornada');
    fixture.componentRef.setInput('value', 'Completa');
    fixture.componentRef.setInput('sub', '40h semanales');
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.data-card__sub'));
    expect(sub.nativeElement.textContent.trim()).toBe('40h semanales');
  });

  it('does not render sub element when sub is null', () => {
    fixture.componentRef.setInput('label', 'Jornada');
    fixture.componentRef.setInput('value', 'Completa');
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.data-card__sub'));
    expect(sub).toBeNull();
  });

  it('applies accent class when accent input is true', () => {
    fixture.componentRef.setInput('label', 'Nómina');
    fixture.componentRef.setInput('value', 'Abr 2026');
    fixture.componentRef.setInput('accent', true);
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.data-card--accent'));
    expect(card).toBeTruthy();
  });

  it('shows shimmer when loading is true', () => {
    fixture.componentRef.setInput('label', 'Contrato');
    fixture.componentRef.setInput('value', '');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const shimmer = fixture.debugElement.query(By.css('.data-card__shimmer'));
    expect(shimmer).toBeTruthy();
  });

  it('does not show shimmer when loading is false', () => {
    fixture.componentRef.setInput('label', 'Contrato');
    fixture.componentRef.setInput('value', 'Indefinido');
    fixture.detectChanges();
    const shimmer = fixture.debugElement.query(By.css('.data-card__shimmer'));
    expect(shimmer).toBeNull();
  });
});
