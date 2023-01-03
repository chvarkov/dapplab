import { Component, Input, OnInit } from '@angular/core';

export type ToolBarTitleSize = 'big' | 'medium' | 'small';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
	@Input() titleSize: ToolBarTitleSize = 'big';
	@Input() title?: string
	@Input() borderRight: boolean = false;
	@Input() borderLeft: boolean = false;
	@Input() borderTop: boolean = false;

	constructor() {
	}

	ngOnInit(): void {
	}

}
