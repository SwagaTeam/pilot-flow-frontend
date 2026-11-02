import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { emptyEvidence } from '../core/model-defaults';
import { Route, Operation } from '../core/models';
import { PageHeading } from '../shared/ui';
import { DecimalPipe } from '../shared/format';

@Component({
  selector: 'pf-routes',
  imports: [FormsModule, RouterLink, PageHeading, DecimalPipe],
  templateUrl: './routes-page.html',
})
export class RoutesPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly route = signal<Route | null>(null);
  private etag = this.store.etag();
  readonly loading = signal(false);
  operationName = '';
  workplace = '';
  constructor() {
    if (this.id) void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const r = await this.store.api.get<Route>(
        `${this.store.versionPath}/products/${this.id}/route`,
      );
      this.route.set(r.data);
      this.etag = r.etag;
    } catch (error) {
      this.store.report(error);
    } finally {
      this.loading.set(false);
    }
  }
  add(): void {
    this.route.update((r) =>
      r
        ? {
            steps: [
              ...r.steps,
              {
                occurrenceId: crypto.randomUUID(),
                operationId: this.store.operations()[0]?.id ?? '',
                position: r.steps.length + 1,
                durationHours: null,
                workplaceName: null,
                evidence: emptyEvidence(),
              },
            ],
          }
        : r,
    );
  }
  move(index: number, delta: number): void {
    const r = this.route();
    if (!r) return;
    const steps = [...r.steps];
    [steps[index], steps[index + delta]] = [steps[index + delta], steps[index]];
    this.route.set({ steps: steps.map((s, i) => ({ ...s, position: i + 1 })) });
  }
  remove(index: number): void {
    this.route.update((r) =>
      r
        ? {
            steps: r.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i + 1 })),
          }
        : r,
    );
  }
  async save(): Promise<void> {
    await this.store.save(`/products/${this.id}/route`, this.route(), this.etag);
    if (!this.store.error()) await this.router.navigateByUrl('/routes');
  }
  async addOperation(): Promise<void> {
    const result = await this.store.save<Operation>(
      '/operations',
      {
        name: this.operationName,
        kind: 'operation',
        workplaceName: this.workplace || null,
        aggregationCoveragePercent: null,
        aggregationEvidence: emptyEvidence(),
      },
      this.etag,
      'POST',
    );
    if (result) {
      this.operationName = '';
      this.etag = this.store.etag();
    }
  }
  duration(id: string) {
    return this.store.matrix()?.products.find((p) => p.productId === id)?.routeDurationHours;
  }
}
