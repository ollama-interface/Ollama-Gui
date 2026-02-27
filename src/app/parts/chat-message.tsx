import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationMessage } from "@/core/types";
import { marked } from "marked";
import { twMerge } from "tailwind-merge";
import { ResponseMetrics } from "./response-metrics";
import { useSimple } from "simple-core-state";
import { core } from "@/core";
import { open } from "@tauri-apps/plugin-shell";
import { ToolCallsDisplay } from "./tool-call-display";
import { QueryResultsTable } from "./query-results-table";

interface ChatMessageProps extends ConversationMessage {}
export const ChatMessage = (props: ChatMessageProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const show_metrics = useSimple(core.show_metrics);
  const [showRawResults, setShowRawResults] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);

  const parseText = useCallback(async () => {
    const p = await marked.parse(props.message);
    if (contentRef?.current) {
      contentRef.current.innerHTML = p;

      // Check if content is multi-line
      const lineHeight = parseInt(
        window.getComputedStyle(contentRef.current).lineHeight,
      );
      const height = contentRef.current.scrollHeight;
      const lines = Math.ceil(height / lineHeight);
      setIsMultiLine(lines > 1);

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
        "w-full flex flex-col px-4 mb-3",
        props.ai_replied ? "items-start" : "items-end",
      )}
    >
      <p className="text-xs text-gray-500 mb-1">
        {props.ai_replied ? "From: AI" : "From: You"}
      </p>
      <div
        className={twMerge(
          "px-3 py-0.5 w-fit",
          props.ai_replied
            ? "bg-gray-200 text-gray-900 max-w-2xl"
            : "bg-blue-500 text-white max-w-xs",
        )}
        style={{
          borderRadius:
            (props.ai_replied && props.metrics && show_metrics) || isMultiLine
              ? "12px"
              : "9999px",
        }}
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
      {props.ai_replied && props.tool_calls && props.tool_calls.length > 0 && (
        <div className="mt-3 w-full max-w-2xl">
          <ToolCallsDisplay
            toolCalls={props.tool_calls}
            results={props.tool_results}
          />
        </div>
      )}
      {props.ai_replied &&
        props.tool_results &&
        props.tool_results.length > 0 && (
          <div className="mt-4 w-full max-w-4xl space-y-3">
            {props.tool_results.map((result, idx) => {
              // Try to parse the result content as JSON to extract table data
              let tableData: Record<string, any>[] | null = null;
              try {
                const content = result.content;
                // Look for JSON array in the result
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  tableData = JSON.parse(jsonMatch[0]);
                }
              } catch (e) {
                // Not JSON, will show raw results instead
              }

              return (
                <div key={idx} className="space-y-2">
                  {tableData &&
                  Array.isArray(tableData) &&
                  tableData.length > 0 ? (
                    <QueryResultsTable
                      data={tableData}
                      title={`${result.tool_name} Results`}
                    />
                  ) : null}
                </div>
              );
            })}

            <button
              onClick={() => setShowRawResults(!showRawResults)}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span>{showRawResults ? "▼" : "▶"}</span>
              {showRawResults ? "Hide Raw Results" : "Show Raw Results"}
            </button>
            {showRawResults && (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden shadow-lg">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Raw JSON Response
                  </span>
                  <button
                    onClick={() => {
                      const text = JSON.stringify(props.tool_results, null, 2);
                      navigator.clipboard.writeText(text);
                    }}
                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="font-mono text-sm leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(props.tool_results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
