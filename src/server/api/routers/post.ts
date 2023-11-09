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
  )
    //Yes, the code map(filterUserForClient) is a shorthand way to use the map function when you want to apply a specific transformation or function to each element of an array. In this case, it's using the map function to apply the filterUserForClient function to each element in the array.
    .map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    ///ES AR GAMOGRCHES !!!!!!!!!!!!!!!!!!!!!!!!!
    if (!author?.username) {
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
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      return (await addUserDataToPosts([post]))[0];
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: {
        created_at: "desc",
      },
    });

    return addUserDataToPosts(posts);
  }),

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
