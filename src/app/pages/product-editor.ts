import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { emptyEvidence } from '../core/model-defaults';
import { Product, ProductInput } from '../core/models';
import { PageHeading, Issues } from '../shared/ui';

@Component({
  selector: 'pf-product-editor',
  imports: [FormsModule, RouterLink, PageHeading, Issues],
  templateUrl: './product-editor.html',
})
export class ProductEditorPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly product = this.store.products().find((p) => p.id === this.id);
  readonly isNew = this.id === 'new';
  readonly draft: ProductInput = structuredClone(
    this.product?.data ?? {
      name: '',
      unitCode: 'piece',
      salesVolume: null,
      revenue: null,
      rawMaterialCost: null,
      financialEvidence: {
        ...emptyEvidence(),
        period: this.store.version()?.data.financialPeriod ?? null,
      },
      calendarDurationDays: null,
      durationStart: null,
      durationEnd: null,
      includesWaiting: null,
      durationEvidence: emptyEvidence(),
      inProductionPlan: null,
      planEvidence: {
        ...emptyEvidence(),
        period: this.store.version()?.data.activitiesPeriod ?? null,
      },
      isOther: false,
      productCode: null,
    },
  );
  private readonly etag = this.store.etag();
  async save(): Promise<void> {
    const result = await this.store.save<Product>(
      this.isNew ? '/products' : `/products/${this.id}`,
      this.draft,
      this.etag,
      this.isNew ? 'POST' : 'PUT',
    );
    if (result && !this.store.error()) await this.router.navigateByUrl('/products');
  }
}
