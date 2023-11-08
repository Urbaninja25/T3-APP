import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

// !!!!
import type { Post } from "@prisma/client";
// !!!!!!!!!
const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post: { authorId: string }) => post.authorId),
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
};

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
    // !!!!!!!!!!!!!
    return addUserDataToPosts(posts);
  }),
  // !!!!!!!!!!!!!!!!!
  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{ created_at: "desc" }],
        })
        // !!!!!!!აქ posts უკვე ხელმისაწვდომია და returned value არი ამიტომ გამოდის ეს then ში function without  posts parameter.its already there
        .then(addUserDataToPosts),
    ),

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
