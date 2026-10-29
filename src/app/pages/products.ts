import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { DecimalPipe } from '../shared/format';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-products',
  imports: [FormsModule, RouterLink, DecimalPipe, PageHeading],
  templateUrl: './products.html',
})
export class ProductsPage {
  readonly store = inject(AnalysisStore);
  readonly query = signal('');
  readonly filter = signal('all');
  readonly page = signal(0);
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ru');
    const completeness = this.filter();

    return this.store.products().filter((product) => {
      const nameAndCode = `${product.data.name} ${product.data.productCode ?? ''}`;
      const matchesQuery = nameAndCode.toLocaleLowerCase('ru').includes(query);
      const matchesCompleteness = completeness === 'all' || completeness === product.completeness;
      return matchesQuery && matchesCompleteness;
    });
  });
  readonly visible = computed(() =>
    this.filtered().slice(this.page() * 10, (this.page() + 1) * 10),
  );
  row(id: string) {
    return this.store.matrix()?.products.find((p) => p.productId === id);
  }
}
