import { createServerSideHelpers } from "@trpc/react-query/server";

import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { db } from "~/server/db";

export const getServerSidePropsHelper = () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });

export default getServerSidePropsHelper;
