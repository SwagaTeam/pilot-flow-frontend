import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, PilotApi } from './api';
import { AnalysisData, AnalysisReader } from './analysis-reader';
import {
  Analysis,
  AnalysisPage,
  Version,
  Product,
  Operation,
  Family,
  Evaluation,
  FamilyMatrix,
  SelectionInput,
  ProtocolInput,
  Validation,
  Identity,
  DirectSelectionOptions,
} from './models';

const demoAnalysisId = '00000000-0000-4000-8000-000000000001';
const demoVersionId = '00000000-0000-4000-8000-000000000011';

@Injectable({ providedIn: 'root' })
export class AnalysisStore {
  readonly api = inject(PilotApi);
  private readonly reader = inject(AnalysisReader);
  readonly version = signal<Version | null>(null);
  readonly products = signal<Product[]>([]);
  readonly operations = signal<Operation[]>([]);
  readonly families = signal<Family[]>([]);
  readonly evaluation = signal<Evaluation | null>(null);
  readonly matrix = signal<FamilyMatrix | null>(null);
  readonly selection = signal<SelectionInput | null>(null);
  readonly protocol = signal<ProtocolInput | null>(null);
  readonly validation = signal<Validation | null>(null);
  readonly directOptions = signal<DirectSelectionOptions | null>(null);
  readonly identity = signal<Identity | null>(null);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly notice = signal('');
  readonly etag = signal<string | null>(null);
  readonly writable = computed(
    () =>
      this.api.mode() === 'live' &&
      this.version()?.state === 'draft' &&
      !!this.etag() &&
      !this.saving() &&
      !this.busy(),
  );
  private analysisId = demoAnalysisId;
  private versionId = demoVersionId;
  private loadRequestId = 0;

  get versionPath(): string {
    return `/analyses/${this.analysisId}/versions/${this.versionId}`;
  }

  familyName(id: string | null | undefined): string {
    return this.families().find((f) => f.id === id)?.data.name ?? 'Без семейства';
  }
  operationName(id: string): string {
    return this.operations().find((o) => o.id === id)?.data.name ?? 'Операция';
  }
  productName(id: string): string {
    return this.products().find((p) => p.id === id)?.data.name ?? 'Продукция';
  }
  familyOf(productId: string): Family | undefined {
    return this.families().find((f) => f.productIds.includes(productId));
  }
  report(error: unknown): void {
    this.error.set(
      error instanceof ApiError
        ? error
        : new ApiError(error instanceof Error ? error.message : 'Не удалось загрузить данные.'),
    );
  }

  async open(analysisId = this.analysisId, versionId = this.versionId): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.analysisId = analysisId;
    this.versionId = versionId;
    this.busy.set(true);
    this.error.set(null);
    this.etag.set(null);
    this.version.set(null);
    try {
      const analysis = await this.reader.load(this.versionPath);
      // A slow previous request must not replace the analysis opened more recently.
      if (requestId === this.loadRequestId) {
        this.applyAnalysis(analysis);
      }
    } catch (error) {
      if (requestId === this.loadRequestId) {
        this.report(error);
      }
    } finally {
      if (requestId === this.loadRequestId) {
        this.busy.set(false);
      }
    }
  }

  async demo(): Promise<void> {
    this.api.useDemo();
    await this.open(demoAnalysisId, demoVersionId);
  }
  async connect(token: string): Promise<Analysis[]> {
    ++this.loadRequestId;
    this.busy.set(false);
    // Do not label the previously loaded demo/owner's data as this new API session.
    this.version.set(null);
    this.etag.set(null);
    this.identity.set(null);
    this.products.set([]);
    this.families.set([]);
    this.operations.set([]);
    this.selection.set(null);
    this.protocol.set(null);
    this.evaluation.set(null);
    this.matrix.set(null);
    this.validation.set(null);
    this.directOptions.set(null);
    this.api.connect(token);
    return (await this.api.get<AnalysisPage>('/analyses?limit=1000')).data.items;
  }
  async save<T>(
    suffix: string,
    data: unknown,
    etag: string | null,
    method: 'POST' | 'PUT' = 'PUT',
  ): Promise<T | undefined> {
    if (this.saving()) return undefined;
    this.saving.set(true);
    this.error.set(null);
    this.notice.set('');
    try {
      const result = await this.api.write<T>(
        method,
        this.versionPath + suffix,
        data,
        etag ?? undefined,
      );
      await this.open();
      this.notice.set(
        this.error()
          ? 'Изменения сохранены, но обновить данные не удалось.'
          : 'Изменения сохранены',
      );
      return result.data;
    } catch (error) {
      this.report(error);
      return undefined;
    } finally {
      this.saving.set(false);
    }
  }

  private applyAnalysis(analysis: AnalysisData): void {
    this.version.set(analysis.version);
    this.etag.set(analysis.etag);
    this.products.set(analysis.products);
    this.operations.set(analysis.operations);
    this.families.set(analysis.families);
    this.evaluation.set(analysis.evaluation);
    this.matrix.set(analysis.matrix);
    this.selection.set(analysis.selection);
    this.protocol.set(analysis.protocol);
    this.validation.set(analysis.validation);
    this.identity.set(analysis.identity);
    this.directOptions.set(analysis.directOptions);
  }
}
