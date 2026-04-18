import {
  buildEmployeeDetailRouteCommands,
  buildEmployeeDetailRoutePath,
  buildEmployeeKeyRoutePath,
  buildEmployeeUnknownSectionRoutePath,
  employeeRouteBaseSegment,
} from './employee-route-builder.util';

const key = { ruleSystemCode: 'ESP', employeeTypeCode: 'ORD', employeeNumber: '00001' };

describe('buildEmployeeDetailRouteCommands', () => {
  it('builds route commands for overview section', () => {
    const commands = buildEmployeeDetailRouteCommands(key, 'overview');

    expect(commands).toEqual([
      `/${employeeRouteBaseSegment}`,
      'ESP',
      'ORD',
      '00001',
      'overview',
    ]);
  });

  it('trims whitespace from key segments', () => {
    const commands = buildEmployeeDetailRouteCommands(
      { ruleSystemCode: ' ESP ', employeeTypeCode: ' ORD ', employeeNumber: ' 00001 ' },
      'contact',
    );

    expect(commands[1]).toBe('ESP');
    expect(commands[2]).toBe('ORD');
    expect(commands[3]).toBe('00001');
  });

  it('includes the requested section', () => {
    expect(buildEmployeeDetailRouteCommands(key, 'presence').at(-1)).toBe('presence');
    expect(buildEmployeeDetailRouteCommands(key, 'organization').at(-1)).toBe('organization');
  });
});

describe('buildEmployeeKeyRoutePath', () => {
  it('returns param placeholders for the three key segments', () => {
    const path = buildEmployeeKeyRoutePath();

    expect(path).toContain(':ruleSystemCode');
    expect(path).toContain(':employeeTypeCode');
    expect(path).toContain(':employeeNumber');
  });
});

describe('buildEmployeeDetailRoutePath', () => {
  it('appends section to the key path', () => {
    const path = buildEmployeeDetailRoutePath('contact');

    expect(path).toContain(':ruleSystemCode');
    expect(path.endsWith('/contact')).toBe(true);
  });
});

describe('buildEmployeeUnknownSectionRoutePath', () => {
  it('appends :section param after the key path', () => {
    const path = buildEmployeeUnknownSectionRoutePath();

    expect(path.endsWith('/:section')).toBe(true);
  });
});
