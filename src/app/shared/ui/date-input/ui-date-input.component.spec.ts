import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiDateInputComponent } from './ui-date-input.component';

describe('UiDateInputComponent', () => {
  let fixture: ComponentFixture<UiDateInputComponent>;
  let component: UiDateInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDateInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiDateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits local yyyy-mm-dd when the picker returns a Date', () => {
    const emittedValues: string[] = [];
    component.valueChanged.subscribe((value) => emittedValues.push(value));

    (component as unknown as { onDateChange(value: Date): void }).onDateChange(new Date(2020, 0, 5));

    expect(emittedValues).toEqual(['2020-01-05']);
  });

  it('parses min and max as local calendar dates', () => {
    fixture.componentRef.setInput('min', '2020-01-05');
    fixture.componentRef.setInput('max', '2020-01-31');
    fixture.detectChanges();

    const minDate = (component as unknown as { minDate: () => Date | null }).minDate();
    const maxDate = (component as unknown as { maxDate: () => Date | null }).maxDate();

    expect(minDate?.getFullYear()).toBe(2020);
    expect(minDate?.getMonth()).toBe(0);
    expect(minDate?.getDate()).toBe(5);
    expect(maxDate?.getFullYear()).toBe(2020);
    expect(maxDate?.getMonth()).toBe(0);
    expect(maxDate?.getDate()).toBe(31);
  });
});