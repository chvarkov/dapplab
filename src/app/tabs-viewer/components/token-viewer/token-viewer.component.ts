import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DefinitionOfFungibleTokenOnNetwork } from '@elrondnetwork/erdjs-network-providers/out';
import { ProjectSelector } from '../../../project/store/project.selector';
import { ProjectAction } from '../../../project/store/project.action';
import { ITokenInfo } from '../../../core/elrond/interfaces/token-info';
import { ITokenHolder } from '../../../core/elrond/interfaces/token-holder';
import { ITokenRole } from '../../../core/elrond/interfaces/token-role';
import { ITokenTransfer } from '../../../core/elrond/interfaces/token-transfer';
import { map } from 'rxjs/operators';

@Component({
	selector: 'app-token-viewer',
	templateUrl: './token-viewer.component.html',
	styleUrls: ['./token-viewer.component.scss']
})
export class TokenViewerComponent implements OnInit {
	@Input() identifier: string = '';
	@Input() projectId: string = '';

	token$?: Observable<ITokenInfo>;
	tokenHolders$?: Observable<ITokenHolder[]>;
	tokenRoles$?: Observable<ITokenRole[]>;
	tokenTransfers$?: Observable<ITokenTransfer[]>;
	chainId$?: Observable<string>;

	constructor(private readonly store: Store) {
	}

	ngOnInit(): void {
		console.log(`onInit(${this.identifier})`);
		this.token$ = this.store.select(ProjectSelector.token(this.projectId, this.identifier));
		this.tokenHolders$ = this.store.select(ProjectSelector.tokenHolders(this.projectId, this.identifier));
		this.tokenRoles$ = this.store.select(ProjectSelector.tokenRoles(this.projectId, this.identifier));
		this.tokenTransfers$ = this.store.select(ProjectSelector.tokenTransfers(this.projectId, this.identifier));
		this.chainId$ = this.store.select(ProjectSelector.projectById(this.projectId)).pipe(
			map(project => project?.chainId || ''),
		);

		this.store.dispatch(ProjectAction.loadToken({projectId: this.projectId, identifier: this.identifier}));
		this.store.dispatch(ProjectAction.loadTokenHolders({projectId: this.projectId, identifier: this.identifier}));
		this.store.dispatch(ProjectAction.loadTokenRoles({projectId: this.projectId, identifier: this.identifier}));
		this.store.dispatch(ProjectAction.loadTokenTransfers({projectId: this.projectId, identifier: this.identifier}));
	}

}
