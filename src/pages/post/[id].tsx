
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/componenets/layout";
import { PostView } from "~/componenets/postView";
import { getServerSidePropsHelper } from "~/server/helpers/ssgHelper";

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>,
) {
  const ssg = getServerSidePropsHelper();

  // ?????????
  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.post.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}
export default function SinglePostPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { id } = props;
  const { data } = api.post.getById.useQuery({
    id,
  });
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
}


