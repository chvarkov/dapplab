import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkSelectorComponent } from './network-selector/network-selector.component';
import { CoreModule } from '../core/core.module';
import { StoreModule } from '@ngrx/store';
import { networkReducer } from './store/network.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NetworkEffect } from './store/network.effect';
import { NETWORK_FEATURE } from './constants';

@NgModule({
	declarations: [
		NetworkSelectorComponent
	],
	imports: [
		CommonModule,
		CoreModule,
		StoreModule.forFeature(NETWORK_FEATURE, networkReducer),
		EffectsModule.forFeature([NetworkEffect]),
	],
	exports: [
		NetworkSelectorComponent,
		StoreModule,
		EffectsModule,
	],
})
export class NetworkModule {
	static storeName = 'networks';
}
