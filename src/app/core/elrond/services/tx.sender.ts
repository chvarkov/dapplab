import { Inject, Injectable } from '@angular/core';
import { Transaction } from '@multiversx/sdk-core/out';
import { Observable, of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
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
import { WalletConnector } from './wallet-connector';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Injectable({providedIn: 'root'})
export class TxSender {
	constructor(private readonly store: Store,
				private readonly proxy: ElrondProxyProvider,
				private readonly elrondDataProvider: ElrondDataProvider,
				private readonly walletConnector: WalletConnector,
				private readonly dialog: MatDialog,
				private readonly toastrService: ToastrService,
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
				switchMap((network) => this.proxy.getProxy(network).sendTransaction(tx)
					.then(txHash => {
						this.toastrService.success('Transaction successful sent', 'Send transaction');

						return txHash;
					})
					.catch(e => {
						this.handleError(e);

						throw e;
					}),
				),
			)),
		);
	}

	sign(projectId: string,
		 wallet: ProjectWallet,
		 network: INetworkEnvironment,
		 tx: Transaction): Observable<void> {
		return of(undefined).pipe(
			map(() => this.walletConnector.activeAddress),
			switchMap((connectedAddress) => {
				console.log('pass ', connectedAddress);
				if (connectedAddress && connectedAddress === wallet.address) {
					return this.walletConnector.signTransaction(tx);
				}

				return this.signViaInternalSigner(projectId, wallet, tx);
			}),
			switchMap(() => {
				if (this.isInternalSign(wallet.signStrategy)) {
					return this.dialog.open(ConfirmTransactionDialogComponent, {data: tx}).afterClosed().pipe(
						filter(v => !!v),
						map(() => undefined),
					);
				}

				return of(undefined);
			}),
		);
	}

	private handleError(e: HttpErrorResponse): void {
		const msg = this.extractErrorMessage(e);

		this.toastrService.error(msg, 'Transaction sending was failed');
	}

	private extractErrorMessage(e: Error): string {
		const msg = (e.message.split(':').pop() || '');

		const extractedMessage = msg.substr(0, msg.length - 1);

		return extractedMessage.charAt(0).toUpperCase() + extractedMessage.slice(1);
	}

	private signViaInternalSigner(projectId: string, wallet: ProjectWallet, tx: Transaction): Observable<void> {
		return SecurityNgrxHelper.resolvePasswordHash(
			this.store,
			this.dialog,
			this.secretManager,
		).pipe(
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
		)
	}

	private isInternalSign(strategy: WalletSignStrategy): boolean {
		return strategy === WalletSignStrategy.Mnemonic ||
			strategy === WalletSignStrategy.Secret ||
			strategy == WalletSignStrategy.Pem;
	}
}
