import { useState } from "react";
import Head from "next/head";
import { type NextPage } from "next";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

import { api } from "~/utils/api";

import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/componenets/loading";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");

      void ctx.post.getAll.invalidate();
    },
    // !!!!!!!!!
    onError: () => {
      toast.error("Failed to post! please try again later or call Nugi");
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full  gap-3 ">
      <Image
        className="h-16 w-16 rounded-full"
        src={user.imageUrl}
        alt="users profile image"
        width={56}
        height={56}
      />
      <input
        placeholder="Type something!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        // !!!!!!!!onKeyDown: This is the React event handler that is called when the user presses a key on the keyboard.

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // e.preventDefault(): This method is called to prevent the default behavior of the Enter key, which is to submit the form.
            e.preventDefault();
            if (input !== "") {
              // mutate({ content: input }): This function is called to create a new post with the content that the user entered.
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />

      {/* !!!! */}
      {input !== "" && !isPosting && (
        <button className="mr-10" onClick={() => mutate({ content: input })}>
          Post
        </button>
      )}
      {isPosting && (
        <div className="mr-10 flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["post"]["getAll"][number];

const Postview = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.imageUrl}
        className="h-14 w-14 rounded-full"
        alt={`${author.username}'s profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1  font-bold ">
          <span className="text-slate-300">{`@${author.username}`}</span>
          <span className="font-thin text-gray-400 antialiased">{`· ${dayjs(
            post.created_at,
          ).fromNow()}`}</span>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>something went wrong.CALL NUGI FIRST !</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <Postview {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

// if you want to render a page on next, you should use NextPage
const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  if (!userLoaded) return <div />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center">
        <div className="h-screen w-full border-x  border-slate-400 md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {isSignedIn && CreatePostWizard()}
            {isSignedIn && <UserButton />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
