import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EmployeeSectionRailComponent } from './employee-section-rail.component';

describe('EmployeeSectionRailComponent', () => {
  let fixture: ComponentFixture<EmployeeSectionRailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSectionRailComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeSectionRailComponent);
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('routeBase', '/personas/empleados/ESP/INTERNAL/001');
  });

  it('renders a nav item for each section', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.section-rail__item'));
    expect(items.length).toBe(5);
  });

  it('renders mini avatar with initials', () => {
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css('.section-rail__avatar'));
    expect(avatar.nativeElement.textContent.trim()).toBe('JG');
  });

  it('each nav item has a title attribute for tooltip', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.section-rail__item'));
    items.forEach((item) => {
      expect(item.nativeElement.getAttribute('title')).toBeTruthy();
    });
  });

  it('each nav item links to the correct route', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.section-rail__item'));
    const hrefs = items.map((i) => i.nativeElement.getAttribute('href'));
    expect(hrefs[0]).toContain('overview');
    expect(hrefs[1]).toContain('contact');
  });
});
