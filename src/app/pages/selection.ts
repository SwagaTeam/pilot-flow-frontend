import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { emptyEvidence } from '../core/model-defaults';
import { SelectionInput } from '../core/models';
import { PageHeading, Issues } from '../shared/ui';
import { DecimalPipe } from '../shared/format';

@Component({
  selector: 'pf-selection',
  imports: [FormsModule, RouterLink, PageHeading, Issues, DecimalPipe],
  templateUrl: './selection.html',
})
export class SelectionPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly draft: SelectionInput = structuredClone(
    this.store.selection() ?? {
      familyId: '',
      mode: 'ranked',
      dominantProductId: null,
      justification: null,
      directBasisEvidence: emptyEvidence(),
      managerDecisionReference: null,
    },
  );
  private readonly etag = this.store.etag();
  validChoice(): boolean {
    if (this.draft.mode === 'ranked')
      return !!this.store
        .evaluation()
        ?.families.some((f) => f.familyId === this.draft.familyId && f.canSelectRanked);
    return !!this.store
      .directOptions()
      ?.options.some(
        (o) =>
          o.familyId === this.draft.familyId &&
          o.mode === this.draft.mode &&
          o.dominantProductId === this.draft.dominantProductId &&
          o.status === 'eligible',
      );
  }
  requiresReason(): boolean {
    return (
      this.draft.mode === 'ranked' &&
      (this.store.evaluation()?.families.find((f) => f.familyId === this.draft.familyId)?.rank !==
        1 ||
        (this.store.evaluation()?.leaderFamilyIds.length ?? 0) > 1)
    );
  }
  async save(): Promise<void> {
    await this.store.save('/selection', this.draft, this.etag);
    if (!this.store.error()) await this.router.navigateByUrl('/documents');
  }
}
