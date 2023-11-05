import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="overflow-none flex h-screen  justify-center">
      {/* about overflow-y-scroll :---This class adds a vertical scrollbar to the element when the content overflows its container vertically. In other words, it enables vertical scrolling if the content inside the element is taller than the element itself. */}
      <div className="flex h-full w-full flex-col overflow-y-scroll border-x border-slate-400 md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};
