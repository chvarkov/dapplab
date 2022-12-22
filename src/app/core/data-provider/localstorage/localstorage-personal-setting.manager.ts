import { Inject, Injectable } from '@angular/core';
import {
	getProjectComponentNodeId,
	LayoutState,
	OpenedProjectTab,
	PersonalSettingsManager,
	ProjectExplorerNode,
	ProjectExplorerState, reverseTheme,
	SELF_PROJECT_ID,
	TabsData,
	Theme
} from '../personal-settings.manager';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectComponentType } from '../../types';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { DATA_PROVIDER, DataProvider, Project } from '../data-provider';

@Injectable({providedIn: 'root'})
export class LocalstoragePersonalSettingManager implements PersonalSettingsManager {
	private readonly globalPrefix = 'elrond-sc';
	private readonly openedTabsKey = `${this.globalPrefix}.opened_tabs`;
	private readonly currentTabIndexKey = `${this.globalPrefix}.current_tab_index`;
	private readonly layoutStateKey = `${this.globalPrefix}.layout_state`;
	private readonly projectExplorerStateKey = `${this.globalPrefix}.project_explorer_state`;

	private readonly projectComponentGroups: ProjectComponentType[] = ['abi', 'sc', 'token', 'nft', 'wallet'];

	constructor(@Inject(DATA_PROVIDER) private readonly dataProvider: DataProvider) {
	}

	getActiveProjectOpenedTabs(): Observable<TabsData> {
		return this.dataProvider.getActiveProjectId().pipe(
			map(projectId => ({
				tabs: this.getActiveProjectOpenedTabList(projectId),
				selectedIndex: this.getCurrentTabIndex(projectId),
			})),
		);
	}

	openTab(projectId: string,
			title: string,
			componentType: ProjectComponentType,
			componentId: string): Observable<TabsData> {
		return this.getActiveProjectOpenedTabs().pipe(
			map(({ tabs, selectedIndex }) => {
				tabs = tabs || [];

				const openedElem = tabs.find(i => i.componentType === componentType && i.componentId === componentId);

				if (openedElem) {
					return { tabs, selectedIndex: openedElem.index };
				}

				const updatedList: OpenedProjectTab[] = [
					{index: 0, title, componentType, componentId, projectId},
					...tabs.map((item, index) => ({...item, index: index + 1}))
				]

				this.set(this.getOpenedTabsKey(projectId), updatedList);
				this.set(this.getCurrentTabKey(projectId), 0);

				return { tabs: updatedList, selectedIndex: 0 };
			}),
		);
	}

	pushTabAsFirst(index: number): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs, selectedIndex }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				tabs = tabs || [];

				const current = tabs[index];

				if (!current) {
					return {tabs, selectedIndex};
				}
				const updatedList: OpenedProjectTab[] = [
					{
						...current,
						index: 0,
					},
					...tabs
						.filter((t) => t.index !== index)
						.map((item, index) => ({
							...item,
							index: index + 1,
						})),
				];

				this.set(this.getOpenedTabsKey(projectId), updatedList);
				this.set(this.getCurrentTabKey(projectId), 0);

				return { tabs: updatedList, selectedIndex: 0 };
			}),
		);
	}

	rename(projectId: string,
		   componentType: ProjectComponentType,
		   componentId: string,
		   newName: string): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs, selectedIndex }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				tabs = tabs || [];

				const tab = tabs.find(t => t.projectId === projectId && t.componentType === componentType && componentId === componentId);

				if (tab) {
					tab.title = newName;

					this.set(this.getOpenedTabsKey(projectId), tabs);
				}

				return { tabs, selectedIndex };
			}),
		);
	}

	deleteComponent(projectId: string, componentType: ProjectComponentType, componentId: string): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs, selectedIndex }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				if (!tabs?.length) {
					return { tabs: [] };
				}

				if (componentType === 'project' && projectId !== componentId) {
					throw new Error('ProjectId is not equals to ComponentId for Project component');
				}

				const selectedTab = tabs[selectedIndex || 0] ? {...tabs[selectedIndex || 0]} : undefined;

				const isShouldDeleted = (t?: OpenedProjectTab) => t?.projectId === projectId &&
					t?.componentType === componentType &&
					t?.componentId === componentId;

				const isSelectedShouldBeDeleted = isShouldDeleted(selectedTab);

				tabs = componentType === 'project'
					? tabs.filter(t => t.projectId !== componentId)
					: tabs.filter(t => !isShouldDeleted(t));

				let index = selectedTab && !isSelectedShouldBeDeleted
					? tabs.findIndex(t => t.projectId === selectedTab.projectId &&
						t.componentType === selectedTab.componentType &&
						t.componentId === selectedTab.componentId)
					: 0;

				if (index === -1) {
					index = 0;
				}

				this.set(this.getOpenedTabsKey(projectId), tabs);
				this.set(this.getCurrentTabKey(projectId), index);

				return { tabs, selectedIndex: index };
			}),
		);
	}

	closeTab(index: number): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				if (!tabs?.length) {
					return { tabs: [] };
				}

				for (let i = index; i < tabs.length - 1; i++) {
					tabs[i] = tabs[i + 1];
					tabs[i].index = i;
				}

				tabs.pop();

				this.pushHomeIfListIsEmpty(tabs);

				this.set(this.openedTabsKey, tabs);
				this.set(this.currentTabIndexKey, 0);

				return { tabs, selectedIndex: 0 };
			}),
		);
	}

	moveTab(prevIndex: number, currentIndex: number): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs, selectedIndex }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				if (!tabs?.length) {
					return {tabs: []};
				}

				moveItemInArray(tabs, prevIndex, currentIndex);

				tabs.forEach((item, index) => {
					item.index = index;
				});

				// console.log(`prevIndex: ${prevIndex} / currentIndex: ${currentIndex} / selectedIndex(${typeof selectedIndex}): ${selectedIndex}`);

				if (prevIndex === (selectedIndex || 0)) {
					selectedIndex = currentIndex;
					// console.log(`currentIndex: ${selectedIndex}`);

					this.set(this.getCurrentTabKey(projectId), selectedIndex || 0);
				}

				this.set(this.getOpenedTabsKey(projectId), tabs);

				return { tabs, selectedIndex };
			}),
		);
	}

	selectTab(index: number): Observable<TabsData> {
		return forkJoin([
			this.dataProvider.getActiveProjectId(),
			this.getActiveProjectOpenedTabs(),
		]).pipe(
			map(([projectId, { tabs, selectedIndex }]) => {
				if (!projectId) {
					throw new Error('Active project not found.');
				}

				if (!tabs?.length) {
					return { tabs: [] };
				}

				if (index === selectedIndex) {
					return {tabs, selectedIndex};
				}

				if (!tabs[index]) {
					throw new Error('Selected invalid tab');
				}

				this.set(this.getCurrentTabKey(projectId), index);

				return { tabs, selectedIndex: index };
			}),
		);
	}

	getLayoutState(): Observable<LayoutState> {
		const state: LayoutState = this.get(this.layoutStateKey);

		if (state) {
			return of(state);
		}

		const defaultState: LayoutState = {
			theme: Theme.Dark,
			leftPanelWidth: 420,
			rightPanelWidth: 420,
		};

		this.set(this.layoutStateKey, defaultState);

		return of(defaultState);
	}

	setLayoutState(partialState: Partial<LayoutState>): Observable<LayoutState> {
		return this.getLayoutState().pipe(
			map(state => {
				const merged = {
					...state,
					...partialState,
				};

				this.set(this.layoutStateKey, merged);

				return merged;
			}),
		);
	}

	toggleTheme(): Observable<LayoutState> {
		return this.getLayoutState().pipe(
			map(state => {
				const updatedState: LayoutState = {
					...state,
					theme: reverseTheme(state.theme),
				};

				this.set(this.layoutStateKey, updatedState);

				return updatedState;
			}),
		);
	}

	getProjectExplorerState(): Observable<ProjectExplorerState> {
		const state: ProjectExplorerState = this.get(this.projectExplorerStateKey);

		if (state) {
			return of(state);
		}

		const defaultState: ProjectExplorerState = {
			explorerNodeMap: {},
		};

		this.set(this.projectExplorerStateKey, defaultState);

		return of(defaultState);
	}

	updateProjectExplorerTree(id: string,
							  isExpanded: boolean,
							  withParents: boolean,
							  withChildren: boolean): Observable<ProjectExplorerState> {
		return this.getProjectExplorerState().pipe(
			map((state) => {
				this.updateProjectStateTree(state, isExpanded, [id], withParents, withChildren);

				this.set(this.projectExplorerStateKey, state);

				return state;
			}),
		);
	}

	syncProjectExplorerTree(projects: Project[]): Observable<ProjectExplorerState> {
		return this.getProjectExplorerState().pipe(
			map((state) => {
				for (const project of projects) {
					const projectNodeId = getProjectComponentNodeId(project.id, 'project', project.id);

					if (!state.explorerNodeMap[projectNodeId]) {
						state.explorerNodeMap[projectNodeId] = {
							id: projectNodeId,
							isExpanded: true,
							childrenIds: [],
						};
					}

					const projectNode = state.explorerNodeMap[projectNodeId];

					for (const groupType of this.projectComponentGroups) {
						const group = getProjectComponentNodeId(project.id, 'group', groupType);

						this.syncProjectExplorerNode(state, projectNode, group);
					}

					const abiFolderNodeId = getProjectComponentNodeId(project.id, 'group', 'abi');

					for (const abi of project.abiInterfaces) {
						const nodeId = getProjectComponentNodeId(project.id, 'abi', abi.id);
						this.syncProjectExplorerNode(state, state.explorerNodeMap[abiFolderNodeId], nodeId);
					}

					const scFolderNodeId = getProjectComponentNodeId(project.id, 'group', 'sc');

					for (const sc of project.smartContracts) {
						const nodeId = getProjectComponentNodeId(project.id, 'sc', sc.id);
						this.syncProjectExplorerNode(state, state.explorerNodeMap[scFolderNodeId], nodeId);
					}

					const tokenFolderNodeId = getProjectComponentNodeId(project.id, 'group', 'token');

					for (const token of project.tokens) {
						const nodeId = getProjectComponentNodeId(project.id, 'token', token);
						this.syncProjectExplorerNode(state, state.explorerNodeMap[tokenFolderNodeId], nodeId);
					}

					const nftFolderNodeId = getProjectComponentNodeId(project.id, 'group', 'nft');

					// TODO: SYNC NFT TREE

					const walletFolderNodeId = getProjectComponentNodeId(project.id, 'group', 'wallet');

					for (const wallet of project.wallets) {
						const nodeId = getProjectComponentNodeId(project.id, 'wallet', wallet.address);
						this.syncProjectExplorerNode(state, state.explorerNodeMap[walletFolderNodeId], nodeId);
					}
				}

				this.set(this.projectExplorerStateKey, state);

				return state;
			}),
		);
	}

	private syncProjectExplorerNode(stateRef: ProjectExplorerState, parentRef: ProjectExplorerNode, currentNodeId: string): void {
		if (!stateRef.explorerNodeMap[currentNodeId]) {
			stateRef.explorerNodeMap[currentNodeId] = {
				id: currentNodeId,
				isExpanded: true,
				childrenIds: [],
				parentId: parentRef.id,
			};
		}

		if (!parentRef.childrenIds.includes(currentNodeId)) {
			parentRef.childrenIds.push(currentNodeId);
		}
	}

	private updateProjectStateTree(stateRef: ProjectExplorerState,
								   isExpanded: boolean,
								   ids: string[],
								   withParent: boolean,
								   withChildren: boolean): void {
		const idsToMutate: string[] = [];

		for (const id of ids) {
			const current = stateRef.explorerNodeMap[id];
			if (!current) {
				continue;
			}

			current.isExpanded = isExpanded;

			if (withParent && current.parentId) {
				idsToMutate.push(current.parentId);
			}

			if (withChildren) {
				current.childrenIds.forEach(childrenId => idsToMutate.push(childrenId));
			}

		}

		if (idsToMutate.length) {
			this.updateProjectStateTree(stateRef, isExpanded, idsToMutate, withParent, withChildren);
		}
	};

	private getActiveProjectOpenedTabList(projectId?: string): OpenedProjectTab[] {
		if (!projectId) {
			return [];
		}
		return this.pushHomeIfListIsEmpty(this.get(this.getOpenedTabsKey(projectId)) || []);
	}

	private pushHomeIfListIsEmpty(list: OpenedProjectTab[]): OpenedProjectTab[] {
		if (!list.length) {
			list.push({projectId: SELF_PROJECT_ID, title: 'Home', index: 0, componentType: 'home', componentId: SELF_PROJECT_ID});
		}

		return list;
	}

	private getOpenedTabsKey(projectId: string): string {
		return `${this.openedTabsKey}.${projectId}`;
	}

	private getCurrentTabKey(projectId: string): string {
		return `${this.currentTabIndexKey}.${projectId}`;
	}

	private getCurrentTabIndex(projectId?: string): number {
		if (!projectId) {
			return 0;
		}
		const index = +this.get<string>(this.getCurrentTabKey(projectId));
		return !isNaN(index) ? index : 0;
	}

	private set<T>(key: string, value: T): void {
		return localStorage.setItem(key, JSON.stringify(value));
	}

	private get<T>(key: string): T {
		return JSON.parse(localStorage.getItem(key) || 'null');
	}
}
