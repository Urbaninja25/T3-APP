import type { InferGetServerSidePropsType } from "next";
import { api } from "~/utils/api";
import Head from "next/head";

import { PageLayout } from "~/componenets/layout";
import Image from "next/image";

import { LoadingPage } from "~/componenets/loading";
import { PostView } from "~/componenets/postView";
import { getServerSidePropsHelper } from "~/server/helpers/ssgHelper";
import type { GetServerSidePropsContext } from "next";

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>,
) {
  const ssg = getServerSidePropsHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
}
const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.post.getPostsByUserId.useQuery({
    userId: props.userId,
  });
  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has not posted</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function ProfileViewPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { username } = props;
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });
  if (!data) return <div>404</div>;

  if (isLoading) {
    // won't happen since the query has been prefetched return <div> LOADING NU SHEMCEM </div>;
    return <>Loading...NU SHEMCEM</>;
  }

  if (!props) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{username}</title>
      </Head>
      <PageLayout>
        <div>
          <div className="relative h-36  bg-slate-600">
            <Image
              src={data.imageUrl}
              alt={`${data.username ?? "unknown"}'s profile pic`}
              width={128}
              height={128}
              className="  absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-2  "
            />
          </div>
          <div className="h-[64px]"></div>
          <div className="p-4 text-2xl font-bold">{`@${props.username}`}</div>
          <div className="w-full border-b border-slate-400" />
        </div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
}

// //?????
// export const getStaticPaths = () => {
//   return { paths: [], fallback: "blocking" };
// };
