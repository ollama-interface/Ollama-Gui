import { useCallback, useEffect, useRef } from "react";
import { ConversationMessage } from "@/core/types";
import { marked } from "marked";
import { twMerge } from "tailwind-merge";

interface ChatMessageProps extends ConversationMessage {}
export const ChatMessage = (props: ChatMessageProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const parseText = useCallback(async () => {
    const p = await marked.parse(props.message);
    contentRef.current.innerHTML = p;
  }, [props.message]);

  useEffect(() => {
    parseText();
  }, []);

  return (
    <div
      className={twMerge(
        "w-full flex flex-row relative px-4",
        props.ai_replied ? "" : "justify-end"
      )}
    >
      {props?.ai_replied ? (
        <div className="absolute top-[-10px]">
          <p className="text-xs">From: AI</p>
        </div>
      ) : (
        <></>
      )}
      <div
        className={twMerge(
          "mb-10 px-4 py-2 rounded-full w-fit",
          props.ai_replied ? "pl-0" : "bg-white"
        )}
      >
        <div
          className={twMerge(
            "text-[14px]",
            props.ai_replied ? "" : "justify-end items-end"
          )}
          ref={contentRef}
        ></div>
      </div>
    </div>
  );
};
