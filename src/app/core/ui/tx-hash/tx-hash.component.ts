import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { INetworkEnvironment } from '../../elrond/interfaces/network-environment';
import { Store } from '@ngrx/store';
import { NetworkSelector } from '../../../network/store/network.selector';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
	selector: 'app-tx-hash',
	templateUrl: './tx-hash.component.html',
	styleUrls: ['./tx-hash.component.scss']
})
export class TxHashComponent implements OnInit {
	@Input() chainId: string = '';

	@Input() txHash: string = '';

	@Input() interactive: boolean = false;

	@Input() label: string = '';

	@Input() maxLength?: number

	@Output() open: EventEmitter<string> = new EventEmitter<string>();

	network$?: Observable<INetworkEnvironment | undefined>;

	constructor(private readonly clipboard: ClipboardService,
				private readonly store: Store) {
	}

	ngOnInit(): void {
		this.network$ = this.store.select(NetworkSelector.networkByChainId(this.chainId));
	}

	copy(): void {
		this.clipboard.copy(this.txHash, 'Transaction hash');
	}

	explore(url: string): void {
		window.open(`${url}/transactions/${this.txHash}`, '_blank');
	}
}
