import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { GeneratedWallet, ProjectAbi, ProjectSmartContract } from '../../../core/data-provider/data-provider';
import { Store } from '@ngrx/store';
import { ProjectAction } from '../../../project/store/project.action';
import { Observable, of } from 'rxjs';
import { ProjectSelector } from '../../../project/store/project.selector';
import { AccountOnNetwork } from '@elrondnetwork/erdjs-network-providers/out';
import { IElrondTransaction } from '../../../core/elrond/interfaces/elrond-transaction';
import { ITokenPosition } from '../../../core/elrond/interfaces/token-position';
import { ScEndpointComponent } from './sc-endpoint/sc-endpoint.component';
import { TAB } from '@angular/cdk/keycodes';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'app-sc-viewer',
	templateUrl: './sc-viewer.component.html',
	styleUrls: ['./sc-viewer.component.scss'],
})
export class ScViewerComponent implements OnInit {
	readonly TABS = {
		Endpoints: 0,
		Tokens: 1,
		NFTs: 2,
		Code: 3,
	};

	@Input() projectId: string = '';
	@Input() chainId: string = '';

	@Input() abi?: ProjectAbi | null;

	@Input() sc?: ProjectSmartContract | null;

	@ViewChildren(ScEndpointComponent) private readonly endpointList?: QueryList<ScEndpointComponent>;

	account$?: Observable<AccountOnNetwork>;
	transactions$?: Observable<IElrondTransaction[]>;
	tokens$?: Observable<ITokenPosition[]>;
	native$?: Observable<string>;

	code$: Observable<string> = of('');

	wallets$: Observable<GeneratedWallet[]> = of([]);

	openedTab = this.TABS.Endpoints;

	constructor(private readonly store: Store) {
	}

	ngOnInit(): void {
		const projectId = this.abi?.projectId || '';
		const address = this.sc?.address || '';

		this.account$ = this.store.select(ProjectSelector.account(projectId, address));
		this.transactions$ = this.store.select(ProjectSelector.accountTransactions(projectId, address));
		this.tokens$ = this.store.select(ProjectSelector.accountTokens(projectId, address));
		this.native$ = this.store.select(ProjectSelector.accountNativeAmount(projectId, address));
		this.code$ = this.store.select(ProjectSelector.smartContractCode(projectId, address)).pipe(filter(v => !!v));

		this.wallets$ = this.store.select(ProjectSelector.wallets());

		this.store.dispatch(ProjectAction.loadAccountAndPositions({projectId, address}));
		this.store.dispatch(ProjectAction.loadAccountTransactions({projectId, address}));
	}

	expandAll(): void {
		this.endpointList?.forEach(endpoint => endpoint.show());
	}

	hideAll(): void {
		this.endpointList?.forEach(endpoint => endpoint.hide());
	}
}
