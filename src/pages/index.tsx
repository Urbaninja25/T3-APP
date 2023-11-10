import { useState } from "react";

import { type NextPage } from "next";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

import { api } from "~/utils/api";

import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/componenets/loading";
import toast from "react-hot-toast";

import { PageLayout } from "~/componenets/layout";
import { PostView } from "~/componenets/postView";

const CreatePostWizard = () => {
  const [input, setInput] = useState("");
  const { user } = useUser();

  const ctx = api.useUtils();

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
        <PostView {...fullPost} key={fullPost.post.id} />
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
