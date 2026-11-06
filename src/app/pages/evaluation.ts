import { Component, inject, signal, viewChild, ElementRef, afterRenderEffect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { CriterionScore, FamilyEvaluation } from '../core/models';
import { DecimalPipe, criterionNames, formatDecimal } from '../shared/format';
import { PageHeading, Issues } from '../shared/ui';

@Component({
  selector: 'pf-evaluation',
  imports: [RouterLink, DecimalPipe, PageHeading, Issues],
  templateUrl: './evaluation.html',
})
export class EvaluationPage {
  readonly store = inject(AnalysisStore);
  readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as
    'admission' | 'comparison' | 'validation';
  readonly explanations = signal<FamilyEvaluation | null>(null);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('scoreDialog');
  readonly criterionNames = criterionNames;

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
  }

  closeDetails(): void {
    this.dialog()?.nativeElement.close();
    this.explanations.set(null);
  }

  admission(value: FamilyEvaluation['admission']): string {
    const labels = {
      admitted: 'Допущен',
      excluded: 'Не допущен',
      unknown: 'Нужна проверка',
    };
    return labels[value];
  }

  scoreDescription(score: CriterionScore): string {
    switch (score.status) {
      case 'missing':
        return 'Нет данных';
      case 'unresolved':
        return 'Не определено';
      case 'notApplicable':
        return 'Не применяется';
      default:
        return score.value === null ? '' : formatDecimal(score.value);
    }
  }
}
