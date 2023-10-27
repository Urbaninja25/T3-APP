import { clerkClient } from "@clerk/nextjs";
//დააკვირდი როგორ აკეთებ არა User ის იმპორტს არამედ მისი type ის
import type { User } from "@clerk/nextjs/dist/types/server";
// import { z } from "zod";
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
    });

    const users = (
      await clerkClient.users.getUserList({
        // ???????????
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

  //ვქმნით ახალ create method ს რომელსაც ctx ში ექნება currentuser
  create: privateProcedure.mutation(async ({ ctx }) => {
    const authorId = ctx.currentUser.id;
  }),
});
