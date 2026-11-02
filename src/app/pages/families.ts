import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { emptyEvidence } from '../core/model-defaults';
import { Family, FamilyInput } from '../core/models';
import { PageHeading } from '../shared/ui';
import { DecimalPipe } from '../shared/format';

@Component({
  selector: 'pf-families',
  imports: [FormsModule, RouterLink, PageHeading, DecimalPipe],
  templateUrl: './families.html',
})
export class FamiliesPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  private readonly activated = inject(ActivatedRoute);
  readonly id = this.activated.snapshot.paramMap.get('id');
  readonly sourceProductId = this.activated.snapshot.queryParamMap.get('product');
  readonly family = this.store.families().find((f) => f.id === this.id);
  readonly draft: FamilyInput = structuredClone(
    this.family?.data ?? {
      name: '',
      startBoundary: null,
      endBoundary: null,
      compositionReason: null,
      confirmed: false,
      confirmationEvidence: emptyEvidence(),
      route: { steps: [] },
    },
  );
  private readonly etag = this.store.etag();
  constructor() {
    if (this.id === 'new' && this.sourceProductId) void this.loadRoute();
  }
  private async loadRoute(): Promise<void> {
    try {
      this.draft.route = (
        await this.store.api.get<FamilyInput['route']>(
          `${this.store.versionPath}/products/${this.sourceProductId}/route`,
        )
      ).data;
    } catch (error) {
      this.store.report(error);
    }
  }
  evaluation(id: string) {
    return this.store.evaluation()?.families.find((f) => f.familyId === id);
  }
  cycle(id: string) {
    return this.store.matrix()?.cycles.find((f) => f.familyId === id);
  }
  routeNames(family: Family): string {
    return family.data.route.steps.map((s) => this.store.operationName(s.operationId)).join(' → ');
  }
  async save(): Promise<void> {
    const result = await this.store.save<Family>(
      this.id === 'new' ? '/families' : `/families/${this.id}`,
      this.draft,
      this.etag,
      this.id === 'new' ? 'POST' : 'PUT',
    );
    if (!result || this.store.error()) return;
    if (this.id === 'new' && this.sourceProductId) {
      await this.store.save(
        '/assignments',
        {
          assignments: [{ productId: this.sourceProductId, familyId: result.id }],
          reason: this.draft.compositionReason || 'Создано отдельное семейство',
        },
        this.store.etag(),
      );
      if (this.store.error()) {
        this.store.notice.set(
          'Семейство создано. Назначение продукции не выполнено; повторите его на экране назначения.',
        );
        return;
      }
    }
    await this.router.navigateByUrl('/families');
  }
}
