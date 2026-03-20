import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeContractReadClient } from '../../../core/api/clients/employee-contract-read.client';
import {
  EmployeeContractReadModel,
  mapEmployeeContractApiToReadModel,
} from '../../../core/api/mappers/employee-contract.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeContractModel } from '../models/employee-contract.model';

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

  private toEmployeeContractModel(source: EmployeeContractReadModel): EmployeeContractModel {
    return {
      contractCode: source.contractCode,
      contractSubtypeCode: source.contractSubtypeCode,
      startDate: source.startDate,
      endDate: source.endDate,
      isActive: source.isActive,
    };
  }
}
