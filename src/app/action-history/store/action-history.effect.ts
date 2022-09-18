import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ActionHistoryAction } from './action-history.action';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { TransactionProvider } from '../../core/elrond/services/transaction.provider';
import { Store } from '@ngrx/store';
import { NetworkSelector } from '../../network/store/network.selector';

@Injectable()
export class ActionHistoryEffect {
	// TODO: Refactor it
	// loadTransactions$ = createEffect(() => this.actions$.pipe(
	// 	ofType(TransactionAction.loadTransactions),
	// 	withLatestFrom(this.store.select(NetworkSelector.selectedNetwork)),
	// 	switchMap(([{ address }, network]) => this.transactionProvider.getTransactions(network, address).pipe(
	// 		map((list) => TransactionAction.loadTransactionsSuccess({address, list})),
	// 		catchError(err => of(TransactionAction.loadTransactionsError({err})),
	// 	)),
	// )));

	constructor(private readonly actions$: Actions,
				private readonly store: Store,
				private readonly transactionProvider: TransactionProvider) {
	}
}
