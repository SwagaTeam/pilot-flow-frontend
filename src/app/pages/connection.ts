import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { emptyAnalysis } from '../core/model-defaults';
import { Analysis } from '../core/models';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-connection',
  imports: [FormsModule, PageHeading],
  templateUrl: './connection.html',
})
export class ConnectionPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  token = '';
  title = '';
  readonly analyses = signal<Analysis[]>([]);
  readonly busy = signal(false);
  readonly connected = signal(false);
  async demo(): Promise<void> {
    this.busy.set(true);
    await this.store.demo();
    this.busy.set(false);
    await this.router.navigateByUrl('/preparation');
  }
  async connect(): Promise<void> {
    this.busy.set(true);
    this.connected.set(false);
    this.store.error.set(null);
    try {
      this.analyses.set(await this.store.connect(this.token));
      this.token = '';
      this.connected.set(true);
    } catch (error) {
      this.store.report(error);
    } finally {
      this.busy.set(false);
    }
  }
  async open(analysis: Analysis): Promise<void> {
    this.busy.set(true);
    await this.store.open(analysis.id, analysis.version.id);
    this.busy.set(false);
    if (!this.store.error()) await this.router.navigateByUrl('/preparation');
  }
  async create(): Promise<void> {
    this.busy.set(true);
    this.store.error.set(null);
    try {
      const analysis = (
        await this.store.api.write<Analysis>('POST', '/analyses', {
          data: { ...emptyAnalysis(), title: this.title },
        })
      ).data;
      await this.open(analysis);
    } catch (error) {
      this.store.report(error);
    } finally {
      this.busy.set(false);
    }
  }
}
