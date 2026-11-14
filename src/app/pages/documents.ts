import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { Decision, DecisionPage, Version } from '../core/models';
import { PageHeading, Issues } from '../shared/ui';

@Component({
  selector: 'pf-documents',
  imports: [FormsModule, RouterLink, DatePipe, PageHeading, Issues],
  templateUrl: './documents.html',
})
export class DocumentsPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly decisions = signal<Decision[]>([]);
  readonly selected = signal<Decision | null>(null);
  readonly downloading = signal(false);
  confirm = false;
  forkReason = '';
  private readonly etag = this.store.etag();
  readonly files = [
    {
      key: 'protocol',
      title: 'Протокол выбора пилотного потока',
      description: 'Выбранный поток, основания решения и подписи',
      path: '/protocol',
    },
    {
      key: 'familyMatrix',
      title: 'Матрица семейств',
      description: 'Состав продукции, маршруты и показатели семейств',
      path: '/matrix/families',
    },
    {
      key: 'selectionMatrix',
      title: 'Матрица выбора',
      description: 'Допуск, критерии, баллы и итоговые места',
      path: '/matrix/selection',
    },
  ];
  constructor() {
    void this.load();
  }
  selectedName(): string {
    const decision = this.selected();
    return decision
      ? (decision.snapshot.families.find((f) => f.id === decision.snapshot.selection.familyId)?.data
          .name ?? 'Не выбрано')
      : this.store.selection()
        ? this.store.familyName(this.store.selection()?.familyId)
        : 'Не выбрано';
  }
  private async load(): Promise<void> {
    try {
      const version = this.store.version()!;
      const decisions = (
        await this.store.api.get<DecisionPage>(
          `/analyses/${version.analysisId}/decisions?limit=1000`,
        )
      ).data.items;
      this.decisions.set(decisions);
      if (version.state === 'fixed')
        this.selected.set(decisions.find((decision) => decision.versionId === version.id) ?? null);
    } catch (error) {
      this.store.report(error);
    }
  }
  async download(document = 'bundle'): Promise<void> {
    this.downloading.set(true);
    this.store.error.set(null);
    try {
      const decision = this.selected();
      const base = decision
        ? `/analyses/${decision.snapshot.version.analysisId}/decisions/${decision.id}`
        : this.store.versionPath;
      await this.store.api.download(
        `${base}/export?document=${document}`,
        `pilot-flow-${document}.pdf`,
      );
    } catch (error) {
      this.store.report(error);
    } finally {
      this.downloading.set(false);
    }
  }
  async finalize(): Promise<void> {
    if (!this.confirm || !this.store.validation()?.canFinalize) return;
    const decision = await this.store.save<Decision>('/finalize', null, this.etag, 'POST');
    if (decision) {
      this.selected.set(decision);
      this.confirm = false;
      await this.load();
    }
  }
  async fork(): Promise<void> {
    const version = await this.store.save<Version>(
      '/fork',
      { reason: this.forkReason },
      this.etag,
      'POST',
    );
    if (version) {
      await this.store.open(version.analysisId, version.id);
      await this.router.navigateByUrl('/preparation');
    }
  }
}
