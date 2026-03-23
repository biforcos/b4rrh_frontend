import { RuleEntityResponse } from '../../../core/api/generated/model/rule-entity-response';

import { mapRuleEntityResponseToModel } from './rule-entity.mapper';

describe('mapRuleEntityResponseToModel', () => {
  it('marks active occurrences as closable and deletable', () => {
    const source: RuleEntityResponse = {
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'CONTRACT',
      code: 'IND',
      name: 'Indefinido',
      description: null,
      active: true,
      startDate: '2026-01-01',
      endDate: null,
    };

    expect(mapRuleEntityResponseToModel(source)).toMatchObject({
      occurrenceKey: 'IND|2026-01-01',
      canCorrect: true,
      canClose: true,
      canDelete: true,
    });
  });

  it('marks closed occurrences as correctable and deletable but not closable', () => {
    const source: RuleEntityResponse = {
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'CONTRACT',
      code: 'TMP',
      name: 'Temporal',
      description: 'Legacy',
      active: false,
      startDate: '2020-01-01',
      endDate: '2020-12-31',
    };

    expect(mapRuleEntityResponseToModel(source)).toMatchObject({
      occurrenceKey: 'TMP|2020-01-01',
      canCorrect: true,
      canClose: false,
      canDelete: true,
    });
  });
});
