import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AvatarGradientComponent } from './avatar-gradient.component';

describe('AvatarGradientComponent', () => {
  let fixture: ComponentFixture<AvatarGradientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarGradientComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AvatarGradientComponent);
  });

  it('renders initials', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar__initials'));
    expect(el.nativeElement.textContent.trim()).toBe('JG');
  });

  it('applies a gradient background from initials', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar'));
    expect(el.nativeElement.style.background).toContain('gradient');
  });

  it('shows photo img when photoUrl is provided', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('photoUrl', 'https://example.com/photo.jpg');
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('.avatar__photo'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('hides initials when photo is present', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('photoUrl', 'https://example.com/photo.jpg');
    fixture.detectChanges();
    const initials = fixture.debugElement.query(By.css('.avatar__initials'));
    expect(initials).toBeNull();
  });

  it('applies sm size class', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar--sm'));
    expect(el).toBeTruthy();
  });

  it('produces same gradient for same initials', () => {
    fixture.componentRef.setInput('initials', 'AB');
    fixture.detectChanges();
    const bg1 = (fixture.debugElement.query(By.css('.avatar')).nativeElement as HTMLElement).style.background;

    const fixture2 = TestBed.createComponent(AvatarGradientComponent);
    fixture2.componentRef.setInput('initials', 'AB');
    fixture2.detectChanges();
    const bg2 = (fixture2.debugElement.query(By.css('.avatar')).nativeElement as HTMLElement).style.background;

    expect(bg1).toBe(bg2);
  });
});
