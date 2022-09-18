import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DefinitionOfFungibleTokenOnNetwork } from '@elrondnetwork/erdjs-network-providers/out';
import { ProjectSelector } from '../../../project/store/project.selector';
import { ProjectAction } from '../../../project/store/project.action';
import { ITokenInfo } from '../../../core/elrond/interfaces/token-info';

@Component({
	selector: 'app-token-viewer',
	templateUrl: './token-viewer.component.html',
	styleUrls: ['./token-viewer.component.scss']
})
export class TokenViewerComponent implements OnInit {
	@Input() identifier: string = '';
	@Input() projectId: string = '';

	token$?: Observable<ITokenInfo>;

	constructor(private readonly store: Store) {
	}

	ngOnInit(): void {
		this.token$ = this.store.select(ProjectSelector.token(this.projectId, this.identifier));

		this.store.dispatch(ProjectAction.loadToken({projectId: this.projectId, identifier: this.identifier}));
	}

}
