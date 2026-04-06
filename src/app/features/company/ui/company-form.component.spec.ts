import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDetailModel } from '../models/company-detail.model';
import { CompanyFormComponent } from './company-form.component';

const companyDetailFixture: CompanyDetailModel = {
  ruleSystemCode: 'ESP',
  companyCode: 'ACME',
  name: 'Acme',
  description: 'Main company',
  startDate: '2026-01-01',
  endDate: null,
  active: true,
  legalName: 'Acme Spain SA',
  taxIdentifier: 'A12345678',
  address: {
    street: 'Gran Via 1',
    city: 'Madrid',
    postalCode: '28013',
    regionCode: 'MD',
    countryCode: 'ESP',
  },
};

describe('CompanyFormComponent', () => {
  let fixture: ComponentFixture<CompanyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyFormComponent);
  });

  it('keeps identity fields editable in create mode', () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.componentRef.setInput('detail', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.form.get('ruleSystemCode')?.disabled).toBe(false);
    expect(component.form.get('companyCode')?.disabled).toBe(false);
    expect(component.form.get('startDate')?.disabled).toBe(false);
    expect(component.form.get('name')?.disabled).toBe(false);
  });

  it('populates detail and makes business-key fields readonly in edit mode', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('detail', companyDetailFixture);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.form.get('ruleSystemCode')?.disabled).toBe(true);
    expect(component.form.get('companyCode')?.disabled).toBe(true);
    expect(component.form.get('startDate')?.disabled).toBe(true);
    expect(component.form.get('name')?.value).toBe('Acme');
    expect(component.form.get('legalName')?.value).toBe('Acme Spain SA');
    expect(component.form.get('countryCode')?.value).toBe('ESP');
  });
});