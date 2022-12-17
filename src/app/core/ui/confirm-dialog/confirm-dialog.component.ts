import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
	title: string;
	message: string;
}

@Component({
	selector: 'app-confirm-dialog',
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
	constructor(@Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData,
				readonly dialogRef: MatDialogRef<ConfirmDialogComponent>) {
	}

	ngOnInit(): void {
	}
}
