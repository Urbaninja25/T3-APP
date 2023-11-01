import { clerkClient } from "@clerk/nextjs";
//დააკვირდი როგორ აკეთებ არა User ის იმპორტს არამედ მისი type ის
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
// !!!!!
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,

  prefix: "@upstash/ratelimit",
});

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: {
        created_at: "desc",
      },
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId as string),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.username) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author or username for post not found",
        });
      }

      return {
        post,
        author: {
          ...author,
          username: author.username,
        },
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      // !!!!!!!! so when we call rate limiter it will return success which can be boolien and Whether the request may pass(true) or exceeded the limit(false).ALSO WE CAN LIMIT WITH IP ADRESS OR SO MANY OTHER THINGS
      const { success } = await ratelimit.limit(authorId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      }

      const post = await ctx.db.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
