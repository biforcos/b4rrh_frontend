import { describe, expect, it } from 'vitest';

import { buildTargetSelectionPayload } from './target-selection.model';

describe('buildTargetSelectionPayload', () => {
  it('ALL returns ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD with no employee fields', () => {
    expect(buildTargetSelectionPayload('ALL', '', '', '')).toEqual({
      selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD',
    });
  });

  it('LIST parses colon-separated lines into employees array', () => {
    const result = buildTargetSelectionPayload('LIST', 'EMP:EMP001\nEMP:EMP002', '', '');
    expect(result).toEqual({
      selectionType: 'EMPLOYEE_LIST',
      employees: [
        { employeeTypeCode: 'EMP', employeeNumber: 'EMP001' },
        { employeeTypeCode: 'EMP', employeeNumber: 'EMP002' },
      ],
    });
  });

  it('LIST ignores blank lines', () => {
    const result = buildTargetSelectionPayload('LIST', 'EMP:EMP001\n\n', '', '');
    expect(result.employees).toHaveLength(1);
  });

  it('LIST trims whitespace from type and number', () => {
    const result = buildTargetSelectionPayload('LIST', '  EMP : EMP001 ', '', '');
    expect(result.employees![0]).toEqual({ employeeTypeCode: 'EMP', employeeNumber: 'EMP001' });
  });

  it('SINGLE returns single employee target', () => {
    expect(buildTargetSelectionPayload('SINGLE', '', 'EMP', 'EMP001')).toEqual({
      selectionType: 'SINGLE_EMPLOYEE',
      employee: { employeeTypeCode: 'EMP', employeeNumber: 'EMP001' },
    });
  });
});
