import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { Route } from '../core/models';
import { DecimalPipe } from '../shared/format';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-matrix',
  imports: [RouterLink, DecimalPipe, PageHeading],
  templateUrl: './matrix.html',
})
export class MatrixPage {
  readonly store = inject(AnalysisStore);
  readonly kind = inject(ActivatedRoute).snapshot.paramMap.get('kind');
  readonly routes = signal<Record<string, Route>>({});
  constructor() {
    if (this.kind === 'operations') void this.load();
  }
  async load(): Promise<void> {
    try {
      const routes = await Promise.all(
        this.store
          .products()
          .map(
            async (p) =>
              [
                p.id,
                (
                  await this.store.api.get<Route>(
                    `${this.store.versionPath}/products/${p.id}/route`,
                  )
                ).data,
              ] as const,
          ),
      );
      this.routes.set(Object.fromEntries(routes));
    } catch (error) {
      this.store.report(error);
    }
  }
  positions(productId: string, operationId: string): string {
    const route = this.routes()[productId];
    return route
      ? route.steps
          .filter((s) => s.operationId === operationId)
          .map((s) => s.position)
          .join(', ') || '—'
      : '…';
  }
}
