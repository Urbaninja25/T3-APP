import { clerkClient } from "@clerk/nextjs";
//დააკვირდი როგორ აკეთებ არა User ის იმპორტს არამედ მისი type ის
import type { User } from "@clerk/nextjs/dist/types/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
  };
};

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      // impliment ordering so new posts come first
      orderBy: {
        created_at: "desc",
      },
    });

    const users = (
      await clerkClient.users.getUserList({
        // syntax is Clerk-specific syntax. It is used to filter a list of users by the author IDs of a list of posts. It is not a standard JavaScript syntax.
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
      // !!!!!!!!!!!!!
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const post = await ctx.db.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
