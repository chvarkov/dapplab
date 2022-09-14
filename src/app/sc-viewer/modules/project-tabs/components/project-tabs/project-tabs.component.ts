import {
	AfterContentInit,
	AfterViewInit,
	Component,
	ContentChildren,
	ElementRef, HostListener,
	OnInit,
	QueryList,
	ViewChild,
	ViewChildren,
} from '@angular/core';
import { ProjectTabComponent } from '../project-tab/project-tab.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
	selector: 'app-project-tabs',
	templateUrl: './project-tabs.component.html',
	styleUrls: ['./project-tabs.component.scss']
})
export class ProjectTabsComponent  implements OnInit, AfterContentInit, AfterViewInit {
	@ViewChild('container', {static: true}) container?: ElementRef;
	@ContentChildren(ProjectTabComponent) tabs?: QueryList<ProjectTabComponent>;
	@ViewChildren('tabItems') tabItems?: QueryList<ElementRef>;

	invisibleTabsSubject: Subject<ProjectTabComponent[]> = new Subject<ProjectTabComponent[]>();

	get invisibleTabs$(): Observable<ProjectTabComponent[]> {
		return this.invisibleTabsSubject.asObservable();
	}

	ngAfterViewInit() {
		if (this.tabItems) {
			this.onChangeTabHeader(this.tabItems.toArray());

			this.tabItems?.changes.pipe(
				map((tabItems: any[]) => {
					this.onChangeTabHeader(tabItems);
				})
			)
		}
	}

	onChangeTabHeader(tabItems: ElementRef[]): void {
		const containerWidth = this.container?.nativeElement?.clientWidth || 0;

		console.log(`width ${containerWidth} / count ${tabItems.length}`);
		let currentOffset = 0;
		const indexes = tabItems
			.map((elemRef, i) => {
				currentOffset += +elemRef.nativeElement.clientWidth;

				return containerWidth < currentOffset ? i : null;
			})
			.filter(v => !!v) as number[] || [];

		const data = this.tabs
			? indexes.map(i => this.tabs?.get(i)).filter(i => !!i) as ProjectTabComponent[]
			: [];

		setTimeout(() => this.invisibleTabsSubject.next(data));
	}

	ngAfterContentInit(): void {
		if (!this.tabs) {
			return;
		}

		const activeTabs = this.tabs.filter(tab => tab.active) || [];

		if (activeTabs.length === 0) {
			this.selectTab(this.tabs?.first);
		}
	}

	drop(event: CdkDragDrop<string[]>) {
		console.log('event', event);
	}

	selectTab(tab: ProjectTabComponent) {
		if (!this.tabs) {
			return;
		}

		this.tabs.toArray().forEach(tab => (tab.active = false));
		tab.active = true;
	}

	ngOnInit(): void {
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: Event) {
		this.onChangeTabHeader(this.tabItems?.toArray() || []);
	}
}
