import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";

import Image from "next/image";

import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["post"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
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
