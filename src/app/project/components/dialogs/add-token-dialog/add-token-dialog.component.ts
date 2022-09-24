import { Component, OnInit } from '@angular/core';
import { AbstractModalDialog } from '../../../../core/ui/dialog/abstract-modal-dialog';
import { DialogRef } from '../../../../core/ui/dialog/dialog-ref';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GeneratedWallet, Project } from '../../../../core/data-provider/data-provider';
import { ProjectSelector } from '../../../store/project.selector';
import { ESDTInteractor } from '../../../../core/elrond/services/estd-intercator';
import { INetworkEnvironment } from '../../../../core/elrond/interfaces/network-environment';
import { switchMap } from 'rxjs/operators';
import { NetworkSelector } from '../../../../network/store/network.selector';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITokenInfo } from '../../../../core/elrond/interfaces/token-info';
import { ProjectAction } from '../../../store/project.action';

@Component({
	selector: 'app-add-token-dialog',
	templateUrl: './add-token-dialog.component.html',
	styleUrls: ['./add-token-dialog.component.scss']
})
export class AddTokenDialogComponent extends AbstractModalDialog implements OnInit {
	tokenId = '';

	wallet!: GeneratedWallet;

	project$?: Observable<Project | undefined>;

	network$?: Observable<INetworkEnvironment | undefined>;

	dialogRef!: DialogRef<{projectId: string}, string>;

	tokens$!: Observable<ITokenInfo[]>;

	issueTokenForm!: FormGroup;

	constructor(private readonly store: Store,
				private readonly estdInteractor: ESDTInteractor,
				private readonly fb: FormBuilder) {
		super();
	}

	ngOnInit(): void {
		this.dialogRef.options.width = '400px';
		this.dialogRef.options.height = '420px';
		this.project$ = this.store.select(ProjectSelector.projectById(this.dialogRef.data.projectId));
		this.network$ = this.project$.pipe(
			switchMap((project) => this.store.select(NetworkSelector.networkByChainId(project?.chainId || ''))),
		);
		this.tokens$ = this.store.select(ProjectSelector.tokens(this.dialogRef.data.projectId));

		this.issueTokenForm = this.fb.group({
			name: ['', Validators.required],
			ticker: ['', Validators.required],
			supply: [0, Validators.required],
			decimals: [0, Validators.required],
		});
	}

	submit(): void {
		this.dialogRef.submit(this.tokenId.trim());
	}

	async issueEstd(network: INetworkEnvironment, wallet: GeneratedWallet): Promise<void> {
		if (!this.issueTokenForm.valid) {
			return;
		}

		const txHash = await this.estdInteractor.issueFungibleToken(network, wallet, this.issueTokenForm.value);

		console.log('txHash ' + txHash);
	}

	onChangeSearchInput(e: Event): void {
		const value = (<HTMLInputElement>e.target).value;

		this.store.dispatch(ProjectAction.searchTokens({
			projectId: this.dialogRef.data.projectId,
			options: {search: value},
		}))
	}
}
