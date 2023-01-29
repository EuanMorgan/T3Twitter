import { signIn, useSession } from "next-auth/react";
import React from "react";
import Container from "./Container";

const LoggedOutBanner = () => {
  const { data: session } = useSession();

  if (session) return null;

  return (
    <div className="fixed bottom-0 w-full bg-primary p-4">
      <Container classNames="bg-transparent  text-white flex justify-between">
        <p>Do not miss out</p>
        <div>
          <button
            className="e px-4 py-2 shadow-md"
            onClick={() => signIn("discord")}
          >
            Sign in
          </button>
        </div>
      </Container>
    </div>
  );
};

export default LoggedOutBanner;
