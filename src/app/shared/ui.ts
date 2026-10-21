import { Component, input } from '@angular/core';
import { Issue } from '../core/models';

@Component({
  selector: 'pf-issues',
  template: `@for (issue of issues(); track $index) {
    <div
      class="callout"
      [class.warning]="issue.severity === 'warning'"
      [class.danger]="issue.severity === 'error'"
    >
      <strong>{{ issue.message }}</strong>
      @if (issue.suggestion) {
        <p>{{ issue.suggestion }}</p>
      }
    </div>
  }`,
})
export class Issues {
  readonly issues = input<Issue[]>([]);
}

@Component({
  selector: 'pf-page-heading',
  template: `<div class="page-heading">
    <h1>{{ title() }}</h1>
    <p>{{ subtitle() }}</p>
  </div>`,
})
export class PageHeading {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
