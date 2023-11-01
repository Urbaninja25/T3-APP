import Head from "next/head";
import { type NextPage } from "next";
import { api } from "~/utils/api";

const ProfilePage: NextPage = () => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: "urbaninja25",
  });
  if (isLoading) return <div> loading nu shemeci </div>;
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
