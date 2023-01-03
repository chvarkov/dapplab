import { createAction, props } from '@ngrx/store';
import { INetworkEnvironment } from '../../core/elrond/interfaces/network-environment';

export class NetworkAction {
	static readonly loadNetworks = createAction(`[${NetworkAction.name}] load networks [...]`);
	static readonly loadNetworksSuccess = createAction(`[${NetworkAction.name}] load networks [OK]`, props<{list: INetworkEnvironment[]}>());
	static readonly loadNetworksError = createAction(`[${NetworkAction.name}] load networks [ERR]`, props<{err: Error}>());

	static readonly addNetwork = createAction(`[${NetworkAction.name}] add network [...]`);
	static readonly addNetworkSuccess = createAction(`[${NetworkAction.name}] add network [OK]`, props<{list: INetworkEnvironment[]}>());
	static readonly addNetworkError = createAction(`[${NetworkAction.name}] add network [ERR]`, props<{err: Error}>());

	static readonly updateNetwork = createAction(`[${NetworkAction.name}] update network [...]`, props<{network: INetworkEnvironment}>());
	static readonly updateNetworkSuccess = createAction(`[${NetworkAction.name}] update network [OK]`, props<{list: INetworkEnvironment[]}>());
	static readonly updateNetworkError = createAction(`[${NetworkAction.name}] update network [ERR]`, props<{err: Error}>());

	static readonly syncNetwork = createAction(`[${NetworkAction.name}] sync network [...]`, props<{network: INetworkEnvironment}>());
	static readonly syncNetworkSuccess = createAction(`[${NetworkAction.name}] sync network [OK]`, props<{list: INetworkEnvironment[]}>());
	static readonly syncNetworkError = createAction(`[${NetworkAction.name}] sync network [ERR]`, props<{err: Error}>());

	static readonly deleteNetwork = createAction(`[${NetworkAction.name}] delete network [...]`, props<{chainId: string}>());
	static readonly deleteNetworkSuccess = createAction(`[${NetworkAction.name}] delete network [OK]`, props<{list: INetworkEnvironment[]}>());
	static readonly deleteNetworkError = createAction(`[${NetworkAction.name}] delete network [ERR]`, props<{err: Error}>());

	static readonly errorActions = [
		NetworkAction.loadNetworksError,
		NetworkAction.addNetworkError,
		NetworkAction.updateNetworkError,
		NetworkAction.syncNetworkError,
		NetworkAction.deleteNetworkError,
	];
}
