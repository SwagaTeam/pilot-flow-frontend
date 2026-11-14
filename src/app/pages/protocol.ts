import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnalysisStore } from '../core/store';
import { ProtocolInput } from '../core/models';
import { PageHeading } from '../shared/ui';

@Component({
  selector: 'pf-protocol',
  imports: [FormsModule, RouterLink, PageHeading],
  templateUrl: './protocol.html',
})
export class ProtocolPage {
  readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly draft: ProtocolInput = structuredClone(
    this.store.protocol() ?? {
      agreementNumber: null,
      agreementDate: null,
      enterpriseParty: null,
      partnerParty: null,
      signingPlace: null,
      protocolDate: null,
      preparedBy: { fullName: null, position: null },
      approvedBy: { fullName: null, position: null },
      conclusions: null,
      protocolNumber: null,
    },
  );
  private readonly etag = this.store.etag();
  async save(): Promise<void> {
    await this.store.save('/protocol', this.draft, this.etag);
    if (!this.store.error()) await this.router.navigateByUrl('/documents');
  }
}
