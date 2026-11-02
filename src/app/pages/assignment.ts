import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { AssignmentOptions, AssignmentOption, Route } from '../core/models';
import { PageHeading, Issues } from '../shared/ui';

@Component({
  selector: 'pf-assignment',
  imports: [RouterLink, PageHeading, Issues],
  templateUrl: './assignment.html',
})
export class AssignmentPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly options = signal<AssignmentOptions | null>(null);
  readonly route = signal<Route | null>(null);
  private etag: string | null = null;
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const [options, route] = await Promise.all([
        this.store.api.get<AssignmentOptions>(
          `${this.store.versionPath}/products/${this.id}/assignment-options`,
        ),
        this.store.api.get<Route>(`${this.store.versionPath}/products/${this.id}/route`),
      ]);
      if (options.etag !== route.etag)
        throw new Error('Данные изменились во время загрузки. Обновите анализ.');
      this.options.set(options.data);
      this.route.set(route.data);
      this.etag = options.etag;
    } catch (error) {
      this.store.report(error);
    }
  }
  routeLabel(): string {
    return (
      this.route()
        ?.steps.map((s) => this.store.operationName(s.operationId))
        .join(', ') || 'Маршрут ещё не заполнен'
    );
  }
  compatibility(option: AssignmentOption): string {
    return option.issues.some((issue) => issue.code === 'DEMO_OPTION_UNAVAILABLE')
      ? 'Требуется проверка'
      : option.routeMatches
        ? 'Маршрут и порядок совпадают'
        : 'Другой маршрут';
  }
  async assign(familyId: string | null): Promise<void> {
    await this.store.save(
      '/assignments',
      {
        assignments: [{ productId: this.id, familyId }],
        reason: familyId
          ? 'Назначение продукции в совместимое семейство'
          : 'Исключение продукции из семейства для переназначения',
      },
      this.etag,
    );
    if (!this.store.error()) await this.router.navigateByUrl('/families');
  }
}
