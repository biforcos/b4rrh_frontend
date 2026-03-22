import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeContractReadClient } from '../../../core/api/clients/employee-contract-read.client';
import {
  EmployeeContractReadModel,
  mapEmployeeContractApiToReadModel,
} from '../../../core/api/mappers/employee-contract.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeContractModel } from '../models/employee-contract.model';
import {
  ContractCloseDraft,
  ContractCorrectDraft,
  ContractReplaceDraft,
  mapContractCloseDraftToRequest,
  mapContractCorrectDraftToRequest,
  mapContractReplaceDraftToRequest,
} from './employee-contract.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContractReadGateway {
  private readonly employeeContractReadClient = inject(EmployeeContractReadClient);

  readEmployeeContractsByBusinessKey(
    key: EmployeeBusinessKey,
  ): Observable<ReadonlyArray<EmployeeContractModel>> {
    return this.employeeContractReadClient.readEmployeeContractsByBusinessKey(key).pipe(
      map((contracts) =>
        contracts
          .map((contract) => mapEmployeeContractApiToReadModel(contract))
          .filter((contract): contract is EmployeeContractReadModel => contract !== null)
          .map((contract) => this.toEmployeeContractModel(contract)),
      ),
    );
  }

  replaceContractFromDate(
    key: EmployeeBusinessKey,
    draft: ContractReplaceDraft,
  ): Observable<void> {
    return this.employeeContractReadClient
      .replaceContractFromDateByBusinessKey(key, mapContractReplaceDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  correctContractOccurrence(
    key: EmployeeBusinessKey,
    startDate: string,
    draft: ContractCorrectDraft,
  ): Observable<void> {
    return this.employeeContractReadClient
      .updateContractByBusinessKey(key, startDate, mapContractCorrectDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  closeContractOccurrence(
    key: EmployeeBusinessKey,
    startDate: string,
    draft: ContractCloseDraft,
  ): Observable<void> {
    return this.employeeContractReadClient
      .closeContractByBusinessKey(key, startDate, mapContractCloseDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  sortByTimelineRecency(
    contracts: ReadonlyArray<EmployeeContractModel>,
  ): ReadonlyArray<EmployeeContractModel> {
    return [...contracts].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      const startDateOrder = right.startDate.localeCompare(left.startDate);
      if (startDateOrder !== 0) {
        return startDateOrder;
      }

      const contractCodeOrder = right.contractCode.localeCompare(left.contractCode);
      if (contractCodeOrder !== 0) {
        return contractCodeOrder;
      }

      const leftSubtype = left.contractSubtypeCode ?? '';
      const rightSubtype = right.contractSubtypeCode ?? '';
      return rightSubtype.localeCompare(leftSubtype);
    });
  }

  private toEmployeeContractModel(source: EmployeeContractReadModel): EmployeeContractModel {
    return {
      contractCode: source.contractCode,
      contractTypeName: source.contractTypeName ?? null,
      contractSubtypeCode: source.contractSubtypeCode,
      contractSubtypeName: source.contractSubtypeName ?? null,
      startDate: source.startDate,
      endDate: source.endDate,
      isActive: source.isActive,
    };
  }
}
