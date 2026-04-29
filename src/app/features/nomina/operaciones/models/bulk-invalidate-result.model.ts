export interface BulkInvalidateResult {
  totalCandidates: number;
  totalFound: number;
  totalInvalidated: number;
  totalSkippedAlreadyNotValid: number;
  totalSkippedProtected: number;
  totalSkippedNotFound: number;
}
