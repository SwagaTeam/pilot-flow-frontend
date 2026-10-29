import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-preparation',
  imports: [FormsModule, PageHeading],
  templateUrl: './preparation.html',
})
export class PreparationPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly draft = structuredClone(this.store.version()!.data);
  private readonly etag = this.store.etag();
  readonly periods = [
    {
      key: 'financialPeriod',
      label: 'Финансовый период',
      hint: 'Выручка и сырьевая себестоимость за один период.',
    },
    {
      key: 'activitiesPeriod',
      label: 'Период мероприятий',
      hint: 'Для проверки наличия продукции в плане производства.',
    },
    {
      key: 'forecastPeriod',
      label: 'Горизонт прогноза продаж',
      hint: 'Отдельный период для потенциала роста.',
    },
    {
      key: 'laborPeriod',
      label: 'Период прямого труда',
      hint: 'Последние шесть месяцев; человеко-часы на единицу.',
    },
  ] as const;
  setDate(key: (typeof this.periods)[number]['key'], side: 'start' | 'end', value: string): void {
    const current = this.draft[key] ?? { start: '', end: '' };
    current[side] = value;
    this.draft[key] = !current.start && !current.end ? null : current;
    if (key === 'financialPeriod') this.draft.revenueEvidence.period = this.draft[key];
  }
  async next(): Promise<void> {
    if (this.store.api.mode() === 'demo') {
      await this.router.navigateByUrl('/products');
      return;
    }
    await this.store.save('', this.draft, this.etag);
    if (!this.store.error()) await this.router.navigateByUrl('/products');
  }
}
