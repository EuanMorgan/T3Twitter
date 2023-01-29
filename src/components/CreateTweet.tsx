/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormEvent, useState } from "react";
import { z } from "zod";
import { api } from "../utils/api";

export const tweetSchema = z.object({
  text: z
    .string({
      required_error: "Tweet is required",
    })
    .min(10)
    .max(280),
});

export function CreateTweet() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync } = api.example.create.useMutation({
    onSuccess: () => {
      setText("");
      utils.example.timeline.invalidate();
    },
  });

  const utils = api.useContext();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      tweetSchema.parse({ text });
    } catch (e: any) {
      setError(e.message);
      return;
    }

    await mutateAsync({ text });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mb-4 flex w-full flex-col rounded-md border-2 p-4"
      >
        <textarea
          className="w-full p-4 shadow"
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-md bg-primary px-4 py-2 text-white"
            type="submit"
          >
            Tweet
          </button>
        </div>
      </form>
      {error && JSON.stringify(error)}
    </>
  );
}
