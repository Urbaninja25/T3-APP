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
import { PageLayout } from "~/componenets/layout";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

// The getServerSideProps function is used to fetch data on the server and pass it to the component as props. This can be used to improve the performance of the application by prefetching data and rendering the page on the server.
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>,
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });
  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  // The helpers.profile.getUserByUsername.prefetch function prefetches the user data for the given username.
  //Prefetching the profile.getUserByUsername` query.
  //`prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.

  await helpers.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      username,
    },
  };
}

//The ProfileViewPage component will render all of its components on every render, but it will have the username data ready to use. This means that the page will render faster than if the username data had to be fetched from the server on every render.

//BUT BUT BUT
//When you refresh the slug page, the following will happen:

//The existing cache for the page will be deleted.
//The getServerSideProps function will be executed again and the data will be cached.
//The ProfileViewPage component will be rendered.
export default function ProfileViewPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { username } = props;
  const { user } = useUser();
  // ???????????????
  // const userQuery = api.profile.getUserByUsername.useQuery({ username });
  // if (userQuery.status !== "success") {
  //   // won't happen since the query has been prefetched return <div> LOADING NU SHEMCEM </div>;
  //   return <>Loading...NU SHEMCEM</>;
  // }

  if (!props) return <div>404</div>;

  if (!user) return null;

  return (
    <>
      <Head>
        <title>{username}</title>
      </Head>
      <PageLayout>
        <div className=" relative h-36  bg-slate-600">
          <Image
            src={user.imageUrl}
            alt={`${
              user.username ?? user.externalId ?? "unknown"
            }'s profile pic`}
            width={128}
            height={128}
            className=" absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-2 "
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{`@${props.username}`}</div>
        <div className="w-full border-b border-slate-400" />
      </PageLayout>
    </>
  );
}
