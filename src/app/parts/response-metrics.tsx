import { Zap } from "lucide-react";

interface ResponseMetricsProps {
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

const formatDuration = (nanoseconds?: number): string => {
  if (!nanoseconds) return "0ms";
  const ms = nanoseconds / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatTokensPerSecond = (tokens?: number, duration?: number): string => {
  if (!tokens || !duration) return "0 tokens/s";
  const seconds = duration / 1_000_000_000;
  const tokensPerSecond = tokens / seconds;
  return `${tokensPerSecond.toFixed(1)} tokens/s`;
};

export const ResponseMetrics = ({
  total_duration,
  load_duration,
  prompt_eval_count,
  prompt_eval_duration,
  eval_count,
  eval_duration,
}: ResponseMetricsProps) => {
  const hasMetrics =
    total_duration ||
    load_duration ||
    prompt_eval_duration ||
    eval_duration ||
    prompt_eval_count ||
    eval_count;

  if (!hasMetrics) return null;

  return (
    <div className="mt-2 pt-2 pb-2 border-t border-gray-300 text-xs text-gray-600">
      <div className="flex flex-wrap gap-3">
        {total_duration && (
          <span>
            <strong>Total:</strong> {formatDuration(total_duration)}
          </span>
        )}
        {load_duration && (
          <span>
            <strong>Load:</strong> {formatDuration(load_duration)}
          </span>
        )}
        {prompt_eval_duration && (
          <span>
            <strong>Prompt eval:</strong> {formatDuration(prompt_eval_duration)}
          </span>
        )}
        {eval_duration && (
          <span>
            <strong>Output eval:</strong> {formatDuration(eval_duration)}
          </span>
        )}
        {(prompt_eval_count || eval_count) && (
          <span>
            <strong>Tokens:</strong> {prompt_eval_count || 0} in,{" "}
            {eval_count || 0} out
          </span>
        )}
        {eval_duration && eval_count && (
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-yellow-600" />
            <strong>Speed:</strong>{" "}
            {formatTokensPerSecond(eval_count, eval_duration)}
          </span>
        )}
      </div>
    </div>
  );
};
