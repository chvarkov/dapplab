import { Pipe, PipeTransform } from '@angular/core';
import { AbiJson, ScBuilder } from '../builders/sc.builder';
import { SmartContract } from '@multiversx/sdk-core/out';

@Pipe({
	name: 'sc',
	pure: true,
})
export class ScPipe implements PipeTransform {
	transform(value: AbiJson, address: string): SmartContract {
		return ScBuilder.build(address, value);
	}
}
