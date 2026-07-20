interface IResult<T, E> {
	isOk(): this is Ok<T, E>
	isErr(): this is Err<T, E>
	map<A>(f: (t: T) => A): Result<A, E>
	mapErr<U>(f: (e: E) => U): Result<T, U>
	flatMap<U>(fn: (t: T) => Result<U, E>): Result<U, E>
	andThen<R extends Result<unknown, unknown>>(
		f: (t: T) => R
	): Result<InferOkTypes<R>, InferErrTypes<R> | E>
	andThen<U, F>(f: (t: T) => Result<U, F>): Result<U, E | F>
	unwrap(): T
	unwrapOr<A>(v: A): T | A
	unwrapOrElse(fn: (e: E) => T): T
	match<A, B = A>(ok: (t: T) => A, err: (e: E) => B): A | B
	tap(fn: (t: T) => void): Result<T, E>
	tapErr(fn: (e: E) => void): Result<T, E>
}
export class Ok<T, E> implements IResult<T, E> {
	readonly value: T

	constructor(value: T) {
		this.value = value
	}

	isOk(): this is Ok<T, E> {
		return true
	}

	isErr(): this is Err<T, E> {
		return !this.isOk()
	}

	map<A>(f: (t: T) => A): Result<A, E> {
		return ok(f(this.value))
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mapErr<U>(_f: (e: E) => U): Result<T, U> {
		return ok(this.value)
	}

	flatMap<U>(fn: (t: T) => Result<U, E>): Result<U, E> {
		return fn(this.value)
	}

	andThen<U, F>(f: (t: T) => Result<U, F>): Result<U, E | F> {
		return f(this.value)
	}

	unwrap(): T {
		return this.value
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	unwrapOr<A>(_v: A): T | A {
		return this.value
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	unwrapOrElse(_f: (e: E) => T): T {
		return this.value
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	match<A, B = A>(ok: (t: T) => A, _err: (e: E) => B): A | B {
		return ok(this.value)
	}

	tap(f: (t: T) => void): Result<T, E> {
		f(this.value)
		return this
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	tapErr(_f: (e: E) => void): Result<T, E> {
		return this
	}
}

export class Err<T, E> implements IResult<T, E> {
	readonly error: E

	constructor(error: E) {
		this.error = error
	}

	isOk(): this is Ok<T, E> {
		return false
	}

	isErr(): this is Err<T, E> {
		return !this.isOk()
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<A>(_f: (t: T) => A): Result<A, E> {
		return err(this.error)
	}

	mapErr<U>(f: (e: E) => U): Result<T, U> {
		return err(f(this.error))
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	flatMap<U>(_f: (t: T) => Result<U, E>): Result<U, E> {
		return err(this.error)
	}

	andThen<U, F>(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_f: (t: T) => Result<U, F>
	): Result<U, E | F> {
		return err(this.error)
	}

	unwrap(): T {
		throw new Error(`Called unwrap on Err: ${this.error}`)
	}

	unwrapOr<A>(v: A): T | A {
		return v
	}

	unwrapOrElse(f: (e: E) => T): T {
		return f(this.error)
	}

	match<A, B = A>(_ok: (t: T) => A, err: (e: E) => B): A | B {
		return err(this.error)
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	tap(_f: (t: T) => void): Result<T, E> {
		return this
	}

	tapErr(f: (e: E) => void): Result<T, E> {
		f(this.error)
		return this
	}
}

export type Result<T, E> = Ok<T, E> | Err<T, E>
export type InferOkTypes<R> = R extends Result<infer T, unknown> ? T : never
export type InferErrTypes<R> = R extends Result<unknown, infer E> ? E : never

export function ok<T>(value: T): Ok<T, never> {
	return new Ok(value)
}

export function err<E>(error: E): Err<never, E> {
	return new Err(error)
}
