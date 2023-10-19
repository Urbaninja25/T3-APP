import { clerkClient } from "@clerk/nextjs";
//დააკვირდი როგორ აკეთებ არა User ის იმპორტს არამედ მისი type ის
import type { User } from "@clerk/nextjs/dist/types/server";
import { z } from "zod";

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
      //The take parameter in the findMany() method of Prisma Client specifies the maximum number of results to return. In the example you provided, the findMany() method will return up to 100 posts.
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId as string),
        //The take and limit keywords are both used to specify the maximum number of results to return from a query. The main difference between the two keywords is that take is used in Prisma Client, while limit is used in other database libraries, such as MySQL and PostgreSQL.
        limit: 100,
      })
    ).map(filterUserForClient);

    //now for each post we grabbing the user that made it using the authorid
    return posts.map((post) => ({
      post,
      author: users.find((user) => user.id === post.authorId),
    }));
  }),
});
