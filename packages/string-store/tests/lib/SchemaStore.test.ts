import { Float64Type, Schema, SchemaStore, UnalignedUint16Array, type DuplexBuffer } from '../../src';

describe('SchemaStore', () => {
	test('GIVEN an empty SchemaStore THEN it should be empty', () => {
		const store = new SchemaStore();
		expectTypeOf<SchemaStore<object>>(store);
		expect(store.defaultMaximumArrayLength).toBe(100);

		type Key = string;
		type Value = never;
		type Entry = readonly [Key, Value];

		expect<Key[]>([...store.keys()]).toEqual([]);
		expect<Value[]>([...store.values()]).toEqual([]);
		expect<Entry[]>([...store.entries()]).toEqual([]);
		expect<Entry[]>([...store]).toEqual([]);
	});

	test('GIVEN a SchemaStore with a Schema THEN it has the correct properties and types', () => {
		const schema = new Schema(2).float64('height');
		const store = new SchemaStore().add(schema);
		expectTypeOf<SchemaStore<{ 2: Schema<2, { height: typeof Float64Type }> }>>(store);

		expect<typeof schema>(store.get(2)).toBe(schema);
	});

	describe('serialization', () => {
		test('GIVEN a schema and a value THEN it serializes and deserializes the buffer correctly', () => {
			const store = new SchemaStore(10).add(new Schema(2).string('name').float64('height'));

			const buffer = store.serializeRaw(2, { name: 'Mario', height: 1.8 });
			const deserialized = store.deserialize(buffer);
			expect<{ id: 2; data: { height: number } }>(deserialized).toEqual({ id: 2, data: { name: 'Mario', height: 1.8 } });

			expect<2>(store.getIdentifier(buffer)).toBe(2);
			expect<2>(store.getIdentifier(buffer.toString())).toBe(2);

			expectTypeOf(buffer).toEqualTypeOf<DuplexBuffer>();
		});

		test('GIVEN a schema and a value THEN it serializes and deserializes the binary string correctly', () => {
			const store = new SchemaStore(10).add(new Schema(2).string('name').float64('height'));

			const buffer = store.serialize(2, { name: 'Mario', height: 1.8 });
			const deserialized = store.deserialize(buffer);
			expect<{ id: 2; data: { height: number } }>(deserialized).toEqual({ id: 2, data: { name: 'Mario', height: 1.8 } });

			expect<2>(store.getIdentifier(buffer)).toBe(2);

			expectTypeOf(buffer).toEqualTypeOf<string>();
		});

		test('GIVEN a schema with a constant THEN it serializes and deserializes the buffer correctly', () => {
			const store = new SchemaStore(10).add(new Schema(2).constant('runner', 'vitest'));

			const buffer = store.serialize(2, {});
			const deserialized = store.deserialize(buffer);
			expect<{ id: 2; data: { runner: 'vitest' } }>(deserialized).toEqual({ id: 2, data: { runner: 'vitest' } });

			expect<2>(store.getIdentifier(buffer)).toBe(2);
			expect<2>(store.getIdentifier(buffer.toString())).toBe(2);
		});
	});

	describe('exceptions', () => {
		test('GIVEN a schema ID that already exists THEN it throws', () => {
			const schema = new Schema(2).float64('height');
			const store = new SchemaStore().add(schema);
			expect(() => store.add(schema)).toThrowError('Schema with id 2 already exists');
		});

		test('GIVEN a schema ID that does not exist THEN it throws', () => {
			const store = new SchemaStore();
			// @ts-expect-error Testing invalid input
			expect(() => store.get(2)).toThrowError('Schema with id 2 does not exist');
		});

		test.each(['', UnalignedUint16Array.from('')])('GIVEN an empty value to `getIdentifier` THEN it throws', (value) => {
			const store = new SchemaStore();
			expect(() => store.getIdentifier(value)).toThrowError('Expected a non-empty value');
		});
	});
});
