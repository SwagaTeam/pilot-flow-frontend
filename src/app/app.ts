import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalysisStore } from './core/store';
import { Issues } from './shared/ui';

@Component({
  selector: 'pf-root',
  imports: [RouterOutlet, RouterLink, DatePipe, Issues],
  templateUrl: './app.html',
})
export class App {
  readonly store = inject(AnalysisStore);
  readonly router = inject(Router);
  readonly url = signal(this.router.url);
  readonly menuOpen = signal(false);
  readonly groups = [
  {
    "title": "Данные предприятия",
    "items": [
      {
        "path": "/preparation",
        "label": "Подготовка"
      },
      {
        "path": "/products",
        "label": "Продукция"
      },
      {
        "path": "/routes",
        "label": "Маршруты"
      },
      {
        "path": "/families",
        "label": "Семейства"
      }
    ]
  },
  {
    "title": "Сопоставление",
    "items": [
      {
        "path": "/admission",
        "label": "Допуск"
      },
      {
        "path": "/comparison",
        "label": "Сравнение"
      }
    ]
  }
];
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
        this.menuOpen.set(false);
        this.store.notice.set('');
      }
    });
    void this.store.open();
  }
  active(path: string): boolean {
    const current = this.url();
    return (
      current.startsWith(path) ||
      (path === '/families' && current.startsWith('/assignments')) ||
      (path === '/comparison' && current.startsWith('/metrics')) ||
      (path === '/documents' &&
        (current.startsWith('/protocol') || current.startsWith('/matrix'))) ||
      (path === '/products' && current.startsWith('/validation'))
    );
  }
}
