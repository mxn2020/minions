/**
 * @module minions-sdk/middleware
 * Middleware pipeline for intercepting Minions client operations.
 *
 * Middleware functions follow a Koa-style "onion" model: each middleware can
 * run logic before *and* after the core operation by placing code on either
 * side of the `await next()` call. Skipping `next()` short-circuits the
 * pipeline and prevents the core operation from executing.
 *
 * @example
 * ```typescript
 * const logger: MinionMiddleware = async (ctx, next) => {
 *   console.log(`→ ${ctx.operation}`, ctx.args);
 *   await next();
 *   console.log(`← ${ctx.operation}`, ctx.result);
 * };
 * ```
 */

import type { Minion } from '../types/index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** All interceptable operations on the Minions client. */
export type MinionOperation =
    | 'create'
    | 'update'
    | 'softDelete'
    | 'hardDelete'
    | 'restore'
    | 'save'
    | 'load'
    | 'remove'
    | 'list'
    | 'search';

/**
 * Context object passed through the middleware pipeline.
 *
 * - `operation` — the operation being executed.
 * - `args` — operation-specific arguments (e.g. `{ typeSlug, input }` for create).
 * - `result` — populated by the core operation (or a middleware that short-circuits).
 * - `metadata` — free-form bag for cross-middleware communication.
 */
export interface MinionContext {
    /** The operation being intercepted. */
    readonly operation: MinionOperation;
    /** Operation arguments — shape depends on the operation. */
    args: Record<string, unknown>;
    /** Result of the operation — populated after the core logic (or by middleware). */
    result?: unknown;
    /** Shared state for cross-middleware communication. */
    metadata: Record<string, unknown>;
}

/** Advance to the next middleware (or the core operation). */
export type NextFn = () => Promise<void>;

/**
 * A middleware function that can intercept any Minions client operation.
 *
 * Call `await next()` to proceed to the next middleware / core operation.
 * Omit the `next()` call to short-circuit.
 */
export type MinionMiddleware = (ctx: MinionContext, next: NextFn) => Promise<void>;

// ─── Runner ──────────────────────────────────────────────────────────────────

/**
 * Execute a middleware pipeline ending with a core operation.
 *
 * Each middleware wraps the next one in an "onion" pattern:
 * ```
 *  mw1-before → mw2-before → core → mw2-after → mw1-after
 * ```
 *
 * @param middlewares - Ordered array of middleware functions.
 * @param ctx        - The context for this operation.
 * @param core       - The core operation to run at the center of the pipeline.
 */
export async function runMiddleware(
    middlewares: readonly MinionMiddleware[],
    ctx: MinionContext,
    core: () => Promise<void>,
): Promise<void> {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
        if (i <= index) {
            throw new Error('next() called multiple times in the same middleware');
        }
        index = i;

        if (i === middlewares.length) {
            // All middleware executed — run the core operation
            await core();
            return;
        }

        const mw = middlewares[i];
        await mw(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
}
