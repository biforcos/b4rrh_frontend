import { RehireEmployeeRequest, RehireEmployeeResponse } from '../../../core/api/generated/model/models';
import { RehireEmployeeDraft, RehireEmployeeResult } from '../models/employee-rehire.model';

export function mapDraftToRehireRequest(draft: RehireEmployeeDraft): RehireEmployeeRequest {
  const req: RehireEmployeeRequest = {
    rehireDate: draft.rehireDate,
    entryReasonCode: draft.entryReasonCode,
    companyCode: draft.companyCode,
    laborClassification: {
      agreementCode: draft.agreementCode,
      agreementCategoryCode: draft.agreementCategoryCode,
    },
    contract: {
      contractTypeCode: draft.contractTypeCode,
      contractSubtypeCode: draft.contractSubtypeCode ?? '',
    },
    workCenter: {
      workCenterCode: draft.workCenterCode,
    },
  };

  if (draft.costCenterDistribution && draft.costCenterDistribution.items.length > 0) {
    req.costCenterDistribution = {
      items: draft.costCenterDistribution.items.map((it) => ({
        costCenterCode: it.costCenterCode.trim(),
        allocationPercentage: Number(it.allocationPercentage),
      })),
    };
  }

  return req;
}

export function mapResponseToResult(response: RehireEmployeeResponse): RehireEmployeeResult {
  return {
    employeeKey: {
      ruleSystemCode: response.ruleSystemCode,
      employeeTypeCode: response.employeeTypeCode,
      employeeNumber: response.employeeNumber,
    },
  };
}
