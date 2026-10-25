import { Injectable, inject } from '@angular/core';
import { ApiError, ApiResult, PilotApi } from './api';
import {
  DirectSelectionOptions,
  Evaluation,
  Family,
  FamilyMatrix,
  FamilyPage,
  Identity,
  Operation,
  OperationPage,
  Product,
  ProductPage,
  ProtocolInput,
  SelectionInput,
  Validation,
  Version,
} from './models';

export interface AnalysisData {
  version: Version;
  etag: string | null;
  products: Product[];
  operations: Operation[];
  families: Family[];
  evaluation: Evaluation;
  matrix: FamilyMatrix;
  selection: SelectionInput | null;
  protocol: ProtocolInput | null;
  validation: Validation;
  identity: Identity;
  directOptions: DirectSelectionOptions;
}

/** Loads one consistent revision before it can be shown or edited. */
@Injectable({ providedIn: 'root' })
export class AnalysisReader {
  private readonly api = inject(PilotApi);

  async load(versionPath: string): Promise<AnalysisData> {
    const [
      version,
      products,
      operations,
      families,
      evaluation,
      matrix,
      selection,
      protocol,
      validation,
      identity,
      directOptions,
    ] = await Promise.all([
      this.api.get<Version>(versionPath),
      this.api.get<ProductPage>(`${versionPath}/products?limit=1000`),
      this.api.get<OperationPage>(`${versionPath}/operations?limit=1000`),
      this.api.get<FamilyPage>(`${versionPath}/families?limit=1000`),
      this.api.get<Evaluation>(`${versionPath}/evaluation`),
      this.api.get<FamilyMatrix>(`${versionPath}/family-matrix`),
      this.readOptional<SelectionInput>(`${versionPath}/selection`),
      this.readOptional<ProtocolInput>(`${versionPath}/protocol`),
      this.api.get<Validation>(`${versionPath}/validation`),
      this.api.get<Identity>('/me'),
      this.api.get<DirectSelectionOptions>(`${versionPath}/direct-selection-options`),
    ]);

    this.ensureConsistentRevision([
      version,
      products,
      operations,
      families,
      evaluation,
      matrix,
      selection,
      protocol,
      validation,
      directOptions,
    ]);
    this.ensureCompleteCatalogs([products.data, operations.data, families.data]);

    return {
      version: version.data,
      etag: version.etag,
      products: products.data.items,
      operations: operations.data.items,
      families: families.data.items,
      evaluation: evaluation.data,
      matrix: matrix.data,
      selection: selection.data,
      protocol: protocol.data,
      validation: validation.data,
      identity: identity.data,
      directOptions: directOptions.data,
    };
  }

  private async readOptional<T>(path: string): Promise<ApiResult<T | null>> {
    try {
      return await this.api.get<T>(path);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: null, etag: null };
      }
      throw error;
    }
  }

  private ensureConsistentRevision(responses: ApiResult<unknown>[]): void {
    const revisions = new Set(responses.map((response) => response.etag).filter(Boolean));
    if (revisions.size > 1) {
      throw new ApiError('Анализ изменился во время загрузки. Обновите данные.', 412);
    }
  }

  private ensureCompleteCatalogs(catalogs: Array<{ total: number; items: unknown[] }>): void {
    if (catalogs.some((catalog) => catalog.total > catalog.items.length)) {
      throw new ApiError(
        'Объём каталога превышает 1000 записей. Этот интерфейс пока поддерживает до 1000 записей на каталог.',
      );
    }
  }
}
