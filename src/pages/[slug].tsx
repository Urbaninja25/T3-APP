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

//The getServerSideProps function fetches the user data for the given slug and returns the data as props for the ProfileViewPage component.
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>,
) {
  ////The createServerSideHelpers function creates a set of helpers that can be used to prefetch and fetch data from the API. The
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });
  const slug = context.params?.slug as string;
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  // The helpers.profile.getUserByUsername.prefetch function prefetches the user data for the given username.
  //Prefetching the profile.getUserByUsername` query.
  //`prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.

  await helpers.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      //The helpers.dehydrate function dehydrates the TRPC state, which can be used to rehydrate the state on the client.
      trpcState: helpers.dehydrate(),
      username,
    },
  };
}

//The ProfileViewPage component uses the api.profile.getUserByUsername.useQuery hook to fetch the user data for the given username. If the data is not yet available, the component renders a loading indicator. If the data is not available, the component renders a 404 page. Otherwise, the component renders the profile page.
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
        <title>{username}</title>
      </Head>
      <main className="flex justify-center">
        <div>{props.username}</div>
      </main>
    </>
  );
}
