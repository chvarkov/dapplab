import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { NetworkAction } from './network/store/network.action';
import { Observable } from 'rxjs';
import { ProjectAbi, ProjectSmartContract } from './core/data-provider/data-provider';
import { ProjectSelector } from './project/store/project.selector';
import { OpenedProjectTab, SELF_PROJECT_ID, Theme } from './core/data-provider/personal-settings.manager';
import { ProjectAction } from './project/store/project.action';
import { map } from 'rxjs/operators';
import { TokenIssueAwaiter } from './project/services/token-issue.awaiter';
import { LayoutSelector } from './layout/store/layout.selector';
import { LayoutAction } from './layout/store/layout.action';
import { SecurityAction } from './security/store/security.action';
import { SecuritySelector } from './security/store/security.selector';
import { Mnemonic } from '@elrondnetwork/erdjs-walletcore/out';
import * as bip39 from 'bip39';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
	theme$: Observable<Theme>;

	isPasswordSet$: Observable<boolean>;

	isUnlockedWalletAccess$: Observable<boolean>;

	openedTabs$: Observable<OpenedProjectTab[]>;

	currentTabIndex$: Observable<number | undefined>;

	isVisibleLoadingScreen$: Observable<boolean>;

	constructor(private readonly store: Store,
				private readonly tokenIssueAwaiter: TokenIssueAwaiter) {
		this.openedTabs$ = this.store.select(ProjectSelector.openedTabs);
		this.currentTabIndex$ = this.store.select(ProjectSelector.currentTabIndex);
		this.isVisibleLoadingScreen$ = this.store.select(LayoutSelector.isLoadingScreenVisible);
		this.isPasswordSet$ = this.store.select(SecuritySelector.isPasswordSet);
		this.isUnlockedWalletAccess$ = this.store.select(SecuritySelector.isSecretsUnlocked);
		this.theme$ = this.store.select(LayoutSelector.theme);
	}

	async ngOnInit(): Promise<void> {
		const m1 = Mnemonic.generate();

		console.log('m1 ' + m1.toString());

		const s1 = m1.deriveKey().hex();

		console.log('secret ' + s1);

		const s2 = bip39.entropyToMnemonic(m1.deriveKey().hex());

		console.log('m2 ' + s2);


		this.store.dispatch(NetworkAction.loadNetworks());
		setTimeout(() => {
			this.store.dispatch(ProjectAction.loadProjectTabs());
		});

		this.tokenIssueAwaiter.enable();

		this.store.dispatch(SecurityAction.loadSecurityState());
		this.store.dispatch(ProjectAction.loadActiveProject());

		this.store.dispatch(ProjectAction.loadTokenIssueWaitList());

		setTimeout(() => {
			this.store.dispatch(LayoutAction.toggleLoadingScreen({visible: false}));
		}, 2600);
	}

	trackByTab = (index: number, item: OpenedProjectTab) => `${item.projectId}:${item.componentType}:${item.componentId}`;

	ngOnDestroy() {
		this.tokenIssueAwaiter.disable();
	}

	moveTab(prevIndex: number, currentIndex: number): void {
		this.store.dispatch(ProjectAction.moveProjectTab({prevIndex, currentIndex}));
	}

	closeTab(index: number): void {
		this.store.dispatch(ProjectAction.closeProjectTab({index}));
	}

	selectTab(index: number): void {
		this.store.dispatch(ProjectAction.selectTab({index}));
	}

	getScById$(projectId: string, scId: string): Observable<ProjectSmartContract | undefined> {
		return this.store.select(ProjectSelector.smartContractsById(scId));
	}

	getAbiById$(projectId: string, abiId: string): Observable<ProjectAbi | undefined> {
		return this.store.select(ProjectSelector.abiById(abiId));
	}

	getProjectChainId$(projectId: string): Observable<string> {
		return this.store.select(ProjectSelector.activeProject())
			.pipe(
				map(proj => proj?.chainId || '')
			);
	}

	onLogoClick(): void {
		this.store.dispatch(ProjectAction.openProjectTab({
			title: 'Home',
			componentType: 'home',
			componentId: SELF_PROJECT_ID,
		}));
	}

	openSettings(): void {
		this.store.dispatch(ProjectAction.openProjectTab({
			title: 'Settings',
			componentType: 'settings',
			componentId: SELF_PROJECT_ID,
		}));
	}

	putPassword(): void {
		this.store.dispatch(SecurityAction.putPassword());
	}

	lockWalletAccess(): void {
		this.store.dispatch(SecurityAction.clearPasswordHash());
	}

	toggleTheme(): void {
		this.store.dispatch(LayoutAction.toggleTheme());
	}
}
