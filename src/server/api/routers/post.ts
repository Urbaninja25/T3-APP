import { clerkClient } from "@clerk/nextjs";
//დააკვირდი როგორ აკეთებ არა User ის იმპორტს არამედ მისი type ის
import type { User } from "@clerk/nextjs/dist/types/server";
// import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

//ton of info ს გვიბრუნებს users ქვემოთ  about user ჩვენ კიდე არ გვაინტერესებ ამდენი რამე ამიტომ მაქ აქ ეს ფუნქცია რომელიც server side filtering ს გააკეთებს ამ შემთხვევაში
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
        userId: posts.map((post) => post.authorId as string),

        limit: 100,
      })
    ).map(filterUserForClient);

    //დავამატეთ null check for username as well
    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      //პირველი null ჩექი რაც ქვემოთ return ში author ს და author.usrname ს გადააკეთებდ from sting|null to sting
      if (!author || !author.username) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author or username for post not found",
        });
      }

      //აქ გადავაკეთეთ author ესე რადგან username type ყოფილიყო სტრინგი და არა string|null ი
      return {
        post,
        author: {
          ...author,
          username: author.username,
        },
      };
    });
  }),
});
