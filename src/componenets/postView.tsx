import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/router";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["post"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  const router = useRouter();

  const handlePostClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const isUsernameLink = (event.target as HTMLElement).closest(
      ".username-link",
    );
    if (!isUsernameLink) {
      await router.push(`/post/${post.id}`);
    }
  };

  return (
    <div
      key={post.id}
      className="flex gap-3 border-b border-slate-400 p-4"
      onClick={handlePostClick}
    >
      <Image
        src={author.imageUrl}
        className="h-14 w-14 rounded-full"
        alt={`@${author.username}'s profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className=" flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`} className="username-link">
            <span>{`@${author.username} `}</span>
          </Link>
          <Link href={`/post/${post.id} `} className="post-link">
            <span className="font-thin">{` · ${dayjs(
              post.created_at,
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl" style={{ cursor: "pointer" }}>
          {post.content}
        </span>
      </div>
    </div>
  );
};
