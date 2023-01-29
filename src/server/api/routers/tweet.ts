import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { tweetSchema } from "../../../components/CreateTweet";
export const tweetRouter = createTRPCRouter({
  create: protectedProcedure.input(tweetSchema).mutation(({ ctx, input }) => {
    const { prisma, session } = ctx;
    const { text } = input;
    const userId = session.user.id;
    return prisma.tweet.create({
      data: {
        text,
        authorId: userId,
      },
    });
  }),

  timeline: publicProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).default(10),
        where: z
          .object({
            author: z
              .object({
                id: z.string().optional(),
                name: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { cursor, limit, where } = input;

      const userId = ctx.session?.user?.id;

      const tweets = await prisma.tweet.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
          author: {
            select: {
              name: true,
              image: true,
              id: true,
            },
          },
          likes: {
            where: {
              userId,
            },
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (tweets.length > limit) {
        const nextItem = tweets.pop() as (typeof tweets)[number];
        nextCursor = nextItem.id;
      }
      return { tweets, nextCursor };
    }),

  like: protectedProcedure
    .input(
      z.object({
        tweetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const { prisma } = ctx;
      const { tweetId } = input;
      return prisma.like.create({
        data: {
          tweetId,
          userId,
        },
      });
    }),

  unlike: protectedProcedure
    .input(
      z.object({
        tweetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const { prisma } = ctx;
      const { tweetId } = input;
      return prisma.like.delete({
        where: {
          tweetId_userId: {
            tweetId,
            userId,
          },
        },
      });
    }),
});
