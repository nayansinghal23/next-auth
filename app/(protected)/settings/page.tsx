"use client";
import { useCurrentUser } from "@/hooks/user-current-user";
import { signOut } from "next-auth/react";

const Settings = () => {
  const user = useCurrentUser();
  const onClick = () => {
    signOut();
  };

  return (
    <div className="bg-white p-10 rounded-xl">
      <button onClick={onClick} type="submit">
        Sign out
      </button>
    </div>
  );
};

export default Settings;
