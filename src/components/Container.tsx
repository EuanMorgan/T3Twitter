import React from "react";

const Container = ({
  children,
  classNames = "",
}: {
  children: React.ReactNode;
  classNames?: string;
}) => {
  return (
    <div className={`m-auto max-w-xl bg-slate-100 ${classNames}`}>
      {children}
    </div>
  );
};

export default Container;
