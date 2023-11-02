import { createServerSideHelpers } from "@trpc/react-query/server";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import Head from "next/head";
import { db } from "~/server/db";

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>,
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });
  const slug = context.params?.slug as string;
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");
  await helpers.profile.getUserByUsername.prefetch({ username });
  // Make sure to return { props: { trpcState: helpers.dehydrate() } }

  return {
    props: {
      trpcState: helpers.dehydrate(),
      username,
    },
  };
}

export default function ProfileViewPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { username } = props;

  const userQuery = api.profile.getUserByUsername.useQuery({ username });
  if (userQuery.status !== "success") {
    // won't happen since the query has been prefetched return <div> LOADING NU SHEMCEM </div>;
    return <>Loading...NU SHEMCEM</>;
  }

  if (!props) return <div>404</div>;
  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <main className="flex justify-center">
        <div>{props.username}</div>
      </main>
    </>
  );
}
