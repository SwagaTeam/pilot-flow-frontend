import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { EntityRouteReuseStrategy } from './core/entity-route-reuse';
import { RouterTestingHarness } from '@angular/router/testing';
import examples from '../../public/demo-responses.json';
import { routes } from './app.routes';
import { PilotApi } from './core/api';
import { AnalysisStore } from './core/store';
import { readDemo } from './core/demo';

describe('Pilot Flow route integration', () => {
  it('renders each workflow page with contract data, including deep links', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: RouteReuseStrategy, useClass: EntityRouteReuseStrategy },
        {
          provide: PilotApi,
          useValue: {
            mode: signal('demo'),
            get: async (path: string) => ({ data: readDemo(examples, path), etag: null }),
          },
        },
      ],
    });
    const store = TestBed.inject(AnalysisStore);
    await store.open();
    expect(store.error()).toBeNull();
    const harness = await RouterTestingHarness.create();
    const pages = [
      ['/preparation', 'Подготовка анализа'],
      ['/products', 'Продукция предприятия'],
      ['/products/new', 'Добавить продукцию'],
      ['/products/00000000-0000-4000-8000-000000000026', 'Исходные данные продукции'],
      ['/routes', 'Маршруты продукции'],
      ['/routes/00000000-0000-4000-8000-000000000021', 'Маршрут продукции'],
      ['/families', 'Подтверждение семейств'],
      ['/families/00000000-0000-4000-8000-000000000031', 'Семейство'],
      ['/assignments/00000000-0000-4000-8000-000000000022', 'Назначение продукции'],
      ['/admission', 'Допуск потоков'],
      ['/comparison', 'Сравнение потоков'],
      ['/metrics/00000000-0000-4000-8000-000000000031', 'Показатели потока'],
      ['/selection', 'Выбор пилотного потока'],
      ['/documents', 'Документы решения'],
      ['/protocol', 'Реквизиты протокола'],
      ['/matrix/operations', 'Матрица операций'],
      ['/matrix/families', 'Матрица семейств'],
      ['/matrix/selection', 'Матрица выбора'],
      ['/validation', 'Проверка исходных данных'],
      ['/connection', 'Анализы и подключение'],
    ];
    for (const [url, title] of pages) {
      await harness.navigateByUrl(url);
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent, url).toContain(title);
    }
    expect(store.error()).toBeNull();
  });
});
