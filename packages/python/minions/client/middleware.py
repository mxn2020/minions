"""
minions.client.middleware
=========================
Middleware pipeline for intercepting Minions client operations.

Middleware callables follow a Koa-style "onion" model: each middleware can
run logic before *and* after the core operation by placing code on either
side of the ``await next_fn()`` call. Skipping ``next_fn()`` short-circuits
the pipeline and prevents the core operation from executing.

Example::

    async def logger(ctx: MinionContext, next_fn: NextFn) -> None:
        print(f"→ {ctx.operation}", ctx.args)
        await next_fn()
        print(f"← {ctx.operation}", ctx.result)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, Literal, Optional

# ─── Types ────────────────────────────────────────────────────────────────────

MinionOperation = Literal[
    "create",
    "update",
    "soft_delete",
    "hard_delete",
    "restore",
    "save",
    "load",
    "remove",
    "list",
    "search",
]


@dataclass
class MinionContext:
    """Context object passed through the middleware pipeline.

    Attributes:
        operation: The operation being intercepted.
        args: Operation-specific arguments (e.g. ``{"type_slug": ..., "input_data": ...}``).
        result: Populated by the core operation (or a middleware that short-circuits).
        metadata: Free-form dict for cross-middleware communication.
    """

    operation: MinionOperation
    args: Dict[str, Any] = field(default_factory=dict)
    result: Any = None
    metadata: Dict[str, Any] = field(default_factory=dict)


NextFn = Callable[[], Awaitable[None]]
"""Advance to the next middleware (or the core operation)."""

MinionMiddleware = Callable[[MinionContext, NextFn], Awaitable[None]]
"""A middleware callable that can intercept any Minions client operation.

Call ``await next_fn()`` to proceed to the next middleware / core operation.
Omit the ``next_fn()`` call to short-circuit.
"""


# ─── Runner ───────────────────────────────────────────────────────────────────


async def run_middleware(
    middlewares: list[MinionMiddleware],
    ctx: MinionContext,
    core: Callable[[], Awaitable[None]],
) -> None:
    """Execute a middleware pipeline ending with a core operation.

    Each middleware wraps the next one in an "onion" pattern::

        mw1-before → mw2-before → core → mw2-after → mw1-after

    Args:
        middlewares: Ordered list of middleware callables.
        ctx: The context for this operation.
        core: The core operation to run at the center of the pipeline.
    """
    index = -1

    async def dispatch(i: int) -> None:
        nonlocal index
        if i <= index:
            raise RuntimeError("next() called multiple times in the same middleware")
        index = i

        if i == len(middlewares):
            await core()
            return

        mw = middlewares[i]
        await mw(ctx, lambda: dispatch(i + 1))

    await dispatch(0)
