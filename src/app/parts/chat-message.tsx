import { useCallback, useEffect, useRef } from "react";
import { ConversationMessage } from "@/core/types";
import { marked } from "marked";
import { twMerge } from "tailwind-merge";
import { ResponseMetrics } from "./response-metrics";
import { useSimple } from "simple-core-state";
import { core } from "@/core";
import { open } from "@tauri-apps/plugin-shell";

interface ChatMessageProps extends ConversationMessage {}
export const ChatMessage = (props: ChatMessageProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const show_metrics = useSimple(core.show_metrics);

  const parseText = useCallback(async () => {
    const p = await marked.parse(props.message);
    if (contentRef?.current) {
      contentRef.current.innerHTML = p;

      // Add click handlers to links
      const links = contentRef.current.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          const href = link.getAttribute("href");
          if (href) {
            try {
              await open(href);
            } catch (error) {
              console.error("Failed to open link:", error);
            }
          }
        });
      });

      // Add copy buttons to code blocks
      const preBlocks = contentRef.current.querySelectorAll("pre");
      preBlocks.forEach((pre) => {
        const codeBlock = pre.querySelector("code");
        if (codeBlock) {
          const wrapper = document.createElement("div");
          wrapper.className = "code-block-wrapper";

          const copyButton = document.createElement("button");
          copyButton.className = "copy-button";
          copyButton.textContent = "Copy";
          copyButton.type = "button";

          copyButton.addEventListener("click", async () => {
            const code = codeBlock.textContent || "";
            try {
              await navigator.clipboard.writeText(code);
              copyButton.textContent = "Copied!";
              setTimeout(() => {
                copyButton.textContent = "Copy";
              }, 2000);
            } catch (error) {
              console.error("Failed to copy code:", error);
            }
          });

          pre.parentNode?.insertBefore(wrapper, pre);
          wrapper.appendChild(copyButton);
          wrapper.appendChild(pre);
        }
      });
    }
  }, [props.message]);

  useEffect(() => {
    parseText();
  }, [parseText]);

  return (
    <div
      className={twMerge(
        "w-full flex flex-col px-4 mb-6",
        props.ai_replied ? "items-start" : "items-end",
      )}
    >
      <p className="text-xs text-gray-500 mb-2">
        {props.ai_replied ? "From: AI" : "From: You"}
      </p>
      <div
        className={twMerge(
          "px-4 py-2 rounded-3xl w-fit",
          props.ai_replied
            ? "bg-gray-200 text-gray-900 max-w-2xl"
            : "bg-blue-500 text-white max-w-xs",
        )}
      >
        <div
          className="text-[14px] leading-relaxed markdown-content"
          ref={contentRef}
        ></div>
        {props.ai_replied && props.metrics && show_metrics && (
          <ResponseMetrics
            total_duration={props.metrics.total_duration}
            load_duration={props.metrics.load_duration}
            prompt_eval_count={props.metrics.prompt_eval_count}
            prompt_eval_duration={props.metrics.prompt_eval_duration}
            eval_count={props.metrics.eval_count}
            eval_duration={props.metrics.eval_duration}
          />
        )}
      </div>
    </div>
  );
};
