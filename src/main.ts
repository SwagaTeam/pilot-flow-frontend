import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy, withInMemoryScrolling } from '@angular/router';
import { EntityRouteReuseStrategy } from './app/core/entity-route-reuse';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: RouteReuseStrategy, useClass: EntityRouteReuseStrategy },
  ],
}).catch((error: unknown) => console.error(error));
