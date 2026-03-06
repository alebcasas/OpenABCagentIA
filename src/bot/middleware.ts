import type { Context, NextFunction } from "grammy";
import { getAllowedUserIds } from "../config/env.js";

const allowedIds = new Set(getAllowedUserIds());

export async function whitelistMiddleware(
  ctx: Context,
  next: NextFunction
): Promise<void> {
  const userId = ctx.from?.id;
  if (userId == null) {
    await next();
    return;
  }
  if (!allowedIds.has(userId)) {
    await ctx.reply("No estás autorizado para usar este bot.");
    return;
  }
  await next();
}
