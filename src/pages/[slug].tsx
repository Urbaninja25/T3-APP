import Head from "next/head";
import { type NextPage } from "next";
import { api } from "~/utils/api";
import { createSSGHelpers } from "@trpc/react/ssg";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { db } from "~/server/db";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>,
) {
  const ssg = createSSGHelpers({
    router: appRouter,
    ctx: db,
    transformer: superjson,
  });
  const id = context.params?.id as string;
  /*
   * Prefetching the `post.byId` query here.
   * `prefetchQuery` does not return the result - if you need that, use `fetchQuery` instead.
   */
  await ssg.prefetchQuery("post.byId", {
    id,
  });
  // Make sure to return { props: { trpcState: ssg.dehydrate() } }
  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}
const ProfilePage: NextPage = () => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: "urbaninja25",
  });
  if (isLoading) return <div> LOADING NU SHEMCEM </div>;
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <main className="flex justify-center">
        <div>{data.username}</div>
      </main>
    </>
  );
};

export default ProfilePage;
