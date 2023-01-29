import { Component, EventEmitter, HostListener, Input, OnInit, Output, Renderer2 } from '@angular/core';

export type SplitterSide = 'left' | 'right';

@Component({
	selector: 'app-resize-vertical-splitter',
	templateUrl: './resize-vertical-splitter.component.html',
	styleUrls: ['./resize-vertical-splitter.component.scss']
})
export class ResizeVerticalSplitterComponent implements OnInit {
	@Input() side: SplitterSide = 'left';
	@Input() minX!: number;
	@Input() maxX!: number;

	@Output() dx: EventEmitter<number> = new EventEmitter<number>();

	prevClientX = 0;

	isMoving = false;

	constructor(private readonly renderer2: Renderer2) {
	}

	ngOnInit(): void {
	}

	onMouseDown(): void {
		this.isMoving = true;

		this.renderer2.addClass(document.body, 'prevent-text-select');
	}

	@HostListener('document:mousemove', ['$event'])
	onMouseMove(e: MouseEvent): void {
		if (this.isMoving && e.clientX !== this.prevClientX) {
			if ((this.minX && this.maxX && this.maxX > this.minX) && (e.clientX >= this.minX) && ( e.clientX <= this.maxX)) {
				this.dx.emit(e.movementX);
				this.prevClientX = e.clientX;
			}
		}
	}

	@HostListener('document:mouseup', ['$event'])
	onMouseUp(): void {
		this.isMoving = false;

		this.renderer2.removeClass(document.body, 'prevent-text-select');
	}
}
