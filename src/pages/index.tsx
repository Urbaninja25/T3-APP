import { useState } from "react";

import { type NextPage } from "next";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

import { api } from "~/utils/api";

import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/componenets/loading";
import toast from "react-hot-toast";
import Link from "next/link";
import { PageLayout } from "~/componenets/layout";

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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />

      {/* !!!! */}
      {input !== "" && !isPosting && (
        <button
          className="focus:shadow-outline m-2 mr-10 h-10 rounded-lg bg-gray-700 px-5 text-gray-100 transition-colors duration-150 hover:bg-gray-800"
          onClick={() => mutate({ content: input })}
        >
          post
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
          {/* next js link component which are more fast and powerful */}
          {/* why on that link we go to slug pag icant figure put ???????? */}
          <Link href={`/@${author.username}`}>
            <span className="text-slate-300">{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin text-gray-400 antialiased">{`· ${dayjs(
              post.created_at,
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

interface FullPost {
  post: {
    id: string;
    created_at: Date; // Add the missing properties
    content: string;
    authorId: string;
  };
  author: {
    id: string;
    username: string;
    imageUrl: string;
  };
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>something went wrong.CALL NUGI FIRST !</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost: FullPost) => (
        <Postview {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  if (!userLoaded) return <div />;

  return (
    <PageLayout>
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
    </PageLayout>
  );
};

export default Home;
