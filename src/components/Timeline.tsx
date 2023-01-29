import Image from "next/image";
import { api, RouterInputs, RouterOutputs } from "../utils/api";
import { CreateTweet } from "./CreateTweet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { useEffect, useState } from "react";
import { AiFillHeart } from "react-icons/ai";
import {
  InfiniteData,
  QueryClient,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "1m",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dh",
    M: "1M",
    MM: "%dM",
    y: "1y",
    yy: "%dy",
  },
});

const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const handleScroll = () => {
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;

    const scrolled = (winScroll / height) * 100;

    setScrollPosition(scrolled);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollPosition;
};

function updateCache({
  client,
  variables,
  data,
  action,
  input,
}: {
  client: QueryClient;
  variables: RouterInputs["example"]["like"];
  data: {
    userId: string;
  };
  action: "like" | "unlike";
  input: RouterInputs["example"]["timeline"];
}) {
  client.setQueryData(
    [
      ["example", "timeline"],
      {
        type: "infinite",
        input,
      },
    ],
    (oldData) => {
      const newData = oldData as InfiniteData<
        RouterOutputs["example"]["timeline"]
      >;

      const value = action === "like" ? 1 : -1;
      const newTweets = newData.pages.map((page) => {
        return {
          tweets: page.tweets.map((tweet) => {
            if (tweet.id === variables.tweetId) {
              return {
                ...tweet,
                likes: action === "like" ? [...tweet.likes, data.userId] : [],
                _count: {
                  likes: tweet._count.likes + value,
                },
              };
            }

            return tweet;
          }),
        };
      });

      return {
        ...newData,
        pages: newTweets,
      };
    }
  );
}

function Tweet({
  tweet,
  client,
  input,
}: {
  tweet: RouterOutputs["example"]["timeline"]["tweets"][number];
  client: QueryClient;
  input: RouterInputs["example"]["timeline"];
}) {
  const likeMutation = api.example.like.useMutation({
    onSuccess: (data, variables) => {
      console.log("LIKED");
      updateCache({
        client,
        data,
        variables,
        action: "like",
        input,
      });
    },
  });
  const unlikeMutation = api.example.unlike.useMutation({
    onSuccess: (data, variables) => {
      updateCache({
        client,
        data,
        variables,
        action: "unlike",
        input,
      });
    },
  });

  const hasLiked = tweet.likes.length > 0;

  return (
    <div className="mb-4 border-b-2 border-gray-500">
      <div className="flex p-2">
        {tweet.author.image && (
          <Image
            src={tweet.author.image}
            alt={`${tweet.author.name}'s profile picture`}
            width={50}
            height={50}
            className=" rounded-full"
          />
        )}
        <div className="ml-2">
          <div className="flex items-center">
            <p className="font-bold">
              <Link href={`/${tweet.author.name}`}>{tweet.author.name}</Link>
            </p>
            <p className="text-sm text-gray-400">
              {" "}
              - {dayjs(tweet.createdAt).fromNow()}
            </p>
          </div>
          <div>{tweet.text}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 p-2">
        <AiFillHeart
          color={hasLiked ? "red" : "gray"}
          size="1.5rem"
          onClick={() => {
            if (!hasLiked) {
              likeMutation.mutateAsync({ tweetId: tweet.id });
              return;
            }
            unlikeMutation.mutateAsync({ tweetId: tweet.id });
          }}
        />
        <span className="text-sm text-gray-500">{tweet._count.likes}</span>
      </div>
    </div>
  );
}

const LIMIT = 10;

export function Timeline({
  where = {},
}: {
  where?: RouterInputs["example"]["timeline"]["where"];
}) {
  const scrollPosition = useScrollPosition();

  const { data, hasNextPage, fetchNextPage, isFetching } =
    api.example.timeline.useInfiniteQuery(
      {
        where,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const tweets = data?.pages.flatMap((page) => page.tweets) ?? [];

  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollPosition > 90 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [scrollPosition, hasNextPage, isFetching, fetchNextPage]);

  return (
    <div>
      <CreateTweet />
      <div className="border-2 border-b-0 border-gray-500">
        {tweets.map((tweet) => {
          return (
            <Tweet
              input={{
                where,
                limit: LIMIT,
              }}
              key={tweet.id}
              tweet={tweet}
              client={queryClient}
            />
          );
        })}

        {!hasNextPage && <p>No more items to load</p>}
      </div>
    </div>
  );
}
