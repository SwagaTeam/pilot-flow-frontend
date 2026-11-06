import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { MetricsInput } from '../core/models';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-metrics',
  imports: [FormsModule, RouterLink, PageHeading],
  templateUrl: './metrics.html',
})
export class MetricsPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly draft = signal<MetricsInput | null>(null);
  readonly loading = signal(true);
  private etag: string | null = null;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const response = await this.store.api.get<MetricsInput>(
        `${this.store.versionPath}/families/${this.id}/metrics`,
      );
      this.draft.set(response.data);
      this.etag = response.etag;
    } catch (error) {
      this.store.report(error);
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    await this.store.save(`/families/${this.id}/metrics`, this.draft(), this.etag);
    if (!this.store.error()) await this.router.navigateByUrl('/comparison');
  }
}
