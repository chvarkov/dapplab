import { Pipe, PipeTransform } from '@angular/core';
import { ProjectComponentType } from '../types';

@Pipe({
	name: 'componentIcon',
	pure: true,
})
export class ComponentIconPipe implements PipeTransform {
	transform(value: ProjectComponentType): string {
		switch (value) {
			case 'project':
				return 'folder_copy';
			case 'sc':
				return 'code';
			case 'abi':
				return 'data_object';
			case 'token':
				return 'token';
			case 'wallet':
				return 'account_balance_wallet';
			case 'nft':
				return 'photo_library';
			case 'group':
				return 'folder';
			case 'tx':
				return 'receipt_long';
			case 'address_book':
				return 'book';
			case 'home':
				return 'home';
			case 'settings':
				return 'settings';
		}
	}
}
