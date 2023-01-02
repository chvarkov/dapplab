import { Inject, Injectable } from '@angular/core';
import { Transaction } from '@elrondnetwork/erdjs/out';
import { Observable, of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs/operators';
import { ElrondProxyProvider } from './elrond-proxy-provider';
import { ElrondDataProvider } from '../elrond.data-provider';
import { NetworkSelector } from '../../../network/store/network.selector';
import { INetworkEnvironment } from '../interfaces/network-environment';
import { ProjectWallet, WalletSignStrategy } from '../../data-provider/data-provider';
import { UserSignerFactory } from '../../helpers/user-signer.factory';
import { SECRET_MANAGER, SecretManager } from '../../data-provider/secret.manager';
import { MatDialog } from '@angular/material/dialog';
import { SecurityNgrxHelper } from '../../../security/store/security.ngrx-helper';
import { ConfirmTransactionDialogComponent } from '../../ui/confirm-transaction-dialog/confirm-transaction-dialog.component';

@Injectable({providedIn: 'root'})
export class TxSender {
	constructor(private readonly store: Store,
				private readonly proxy: ElrondProxyProvider,
				private readonly elrondDataProvider: ElrondDataProvider,
				private readonly dialog: MatDialog,
				@Inject(SECRET_MANAGER) private readonly secretManager: SecretManager) {
	}

	send(projectId: string, wallet: ProjectWallet, tx: Transaction): Observable<string> {
		return of(null).pipe(
			switchMap(() => this.store.select(NetworkSelector.networkByChainId(tx.getChainID().valueOf())).pipe(
				switchMap((network) => {
					if (!network) {
						return throwError(new Error('Network not found.'));
					}

					return of(network);
				}),
				switchMap((network) => this.elrondDataProvider.getAccountInfo(network, wallet.address).pipe(
					map((accountOnNetwork) => {
						tx.setNonce(accountOnNetwork.nonce);

						return network;
					}),
				)),
				switchMap(network => this.sign(projectId, wallet, network, tx).pipe(
					map(() => network),
				)),
				switchMap((network) => this.proxy.getProxy(network).sendTransaction(tx)),
			)),
		);
	}

	sign(projectId: string,
		 wallet: ProjectWallet,
		 network: INetworkEnvironment,
		 tx: Transaction): Observable<void> {
		return of(undefined).pipe(
			switchMap(() => SecurityNgrxHelper.resolvePasswordHash(
				this.store,
				this.dialog,
				this.secretManager,
			)),
			switchMap((passwordHash) => {
				if (this.isInternalSign(wallet.signStrategy)) {
					return this.dialog.open(ConfirmTransactionDialogComponent, {data: tx}).afterClosed().pipe(
						filter(v => !!v),
						map(() => passwordHash),
					);
				}

				return of(passwordHash);
			}),
			switchMap(passwordHash => this.secretManager.getWalletSecret(passwordHash, projectId, wallet.address)),
			map((secretValue) => {
				switch (wallet.signStrategy) {
					case WalletSignStrategy.Pem:
						return UserSignerFactory.fromPem(secretValue);
					case WalletSignStrategy.Secret:
						return UserSignerFactory.fromSecret(secretValue);
					case WalletSignStrategy.Mnemonic:
						return UserSignerFactory.fromMnemonic(secretValue);
					default:
						throw new Error(`Sign strategy "${wallet.signStrategy}" not implemented`);
				}
			}),
			map((userSigner) => {
				userSigner.sign(tx);
			}),
		);
	}

	private isInternalSign(strategy: WalletSignStrategy): boolean {
		return strategy === WalletSignStrategy.Mnemonic ||
			strategy === WalletSignStrategy.Secret ||
			strategy == WalletSignStrategy.Pem;
	}
}
