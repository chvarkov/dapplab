import {
	AddressType,
	AddressValue, BigIntType, BigIntValue, BigUIntType, BigUIntValue, BytesType, BytesValue,
	EndpointParameterDefinition, I16Type, I16Value, I32Type, I32Value, I64Type, I64Value, I8Type, I8Value,
	SmartContract, TokenIdentifierType, TokenIdentifierValue,
	TypedValue, U16Type, U16Value, U32Type, U32Value, U64Type, U64Value, U8Type, U8Value
} from '@elrondnetwork/erdjs/out';
import BigNumber from 'bignumber.js';

export class ScArgsBuilder {
	constructor(private readonly sc: SmartContract) {
	}

	build(functionName: string, payload: Record<string, any>): TypedValue[] {
		const endpoint = this.sc.getEndpoint(functionName);

		const args = endpoint.input.map((input): TypedValue | null => {
			const value = payload[input.name];

			return this.transformToTypedValue(input, value);
		});

		return args.filter((i) => !!i) as TypedValue[];
	}

	transformToTypedValue(input: EndpointParameterDefinition, value?: any): TypedValue | null {
		switch (input.type.getClassName()) {
			case I8Type.ClassName:
				return new I8Value(value);
			case U8Type.ClassName:
				return new U8Value(value);
			case I16Type.ClassName:
				return new I16Value(value);
			case U16Type.ClassName:
				return new U16Value(value);
			case I32Type.ClassName:
				return new I32Value(value);
			case U32Type.ClassName:
				return new U32Value(value);
			case I64Type.ClassName:
				return new I64Value(value);
			case U64Type.ClassName:
				return new U64Value(value);
			case BigIntType.ClassName:
				return new BigIntValue(value);
			case BigUIntType.ClassName:
				return new BigUIntValue(new BigNumber(value));
			case BytesType.ClassName:
				return new BytesValue(value);
			case AddressType.ClassName:
				return new AddressValue(value);
			case TokenIdentifierType.ClassName:
				return new TokenIdentifierValue(value);
			// TODO: Describe all types
			default:
				console.warn(`Cannot resolve typed value for ${input.type.getClassName()} type`);
				return null;
		}
	}
}
