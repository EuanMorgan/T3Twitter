import { useRouter } from "next/router";
import React from "react";
import { Timeline } from "../components/Timeline";

const UserPage = () => {
  const router = useRouter();
  return (
    <Timeline
      where={{
        author: {
          name: router.query.name as string,
        },
      }}
    />
  );
};

export default UserPage;
