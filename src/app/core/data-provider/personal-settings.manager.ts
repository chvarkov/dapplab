import { Observable } from 'rxjs';
import { ProjectComponentType } from '../types';
import { Project } from './data-provider';

export const PERSONAL_SETTINGS_MANAGER = 'CORE:PERSONAL_SETTINGS_MANAGER';

export const SELF_PROJECT_ID = 'self';

export enum Theme {
	Dark = 'dark',
	Light = 'light',
}

export interface OpenedProjectTab {
	index: number;
	title: string;
	componentType: ProjectComponentType;
	componentId: string;
	projectId: string;
}

export interface TabsData {
	tabs: OpenedProjectTab[];
	selectedIndex?: number;
}

export interface LayoutState {
	theme: Theme,
	leftPanelWidth: number;
	rightPanelWidth: number;
}

export interface ProjectExplorerNode {
	id: string;
	isExpanded: boolean;
	parentId?: string;
	childrenIds: string[],
}

export interface ProjectExplorerState {
	explorerNodeMap: {[id: string]: ProjectExplorerNode};
}

export interface PersonalSettingsManager {
	getActiveProjectOpenedTabs(): Observable<TabsData>;

	openTab(title: string,
			componentType: ProjectComponentType,
			componentId: string): Observable<TabsData>;

	pushTabAsFirst(index: number): Observable<TabsData>;

	rename(projectId: string,
		   componentType: ProjectComponentType,
		   componentId: string,
		   newName: string): Observable<TabsData>;

	deleteComponent(projectId: string, componentType: ProjectComponentType, componentId: string): Observable<TabsData>;

	closeTab(index: number): Observable<TabsData>;

	moveTab(prevIndex: number, currentIndex: number): Observable<TabsData>;

	selectTab(index: number): Observable<TabsData>;

	getLayoutState(): Observable<LayoutState>;

	setLayoutState(partialState: Partial<LayoutState>): Observable<LayoutState>;

	getProjectExplorerState(): Observable<ProjectExplorerState>;

	updateProjectExplorerTree(id: string,
							  isExpanded: boolean,
							  withParents: boolean,
							  withChildren: boolean): Observable<ProjectExplorerState>;

	syncProjectExplorerTree(projects: Project[]): Observable<ProjectExplorerState>;

	toggleTheme(): Observable<LayoutState>;
}

export function getProjectComponentNodeId(projectId: string, type: ProjectComponentType, componentId: string): string {
	return [projectId, type, componentId].join(':');
}

export function reverseTheme(theme: Theme): Theme {
	return theme === Theme.Dark ? Theme.Light : Theme.Dark;
}
