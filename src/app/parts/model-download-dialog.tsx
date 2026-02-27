import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/core/utils";

interface ModelDownloadDialogProps {
  isOpen: boolean;
  modelName: string;
  isDownloading: boolean;
  progress: number;
  status: string;
  completed?: number;
  total?: number;
  onClose: () => void;
  onCancel?: () => void;
}

export const ModelDownloadDialog = ({
  isOpen,
  modelName,
  isDownloading,
  progress,
  status,
  completed,
  total,
  onClose,
  onCancel,
}: ModelDownloadDialogProps) => {
  const [speed, setSpeed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const lastCompletedRef = useRef<number>(0);

  useEffect(() => {
    if (isDownloading && completed !== undefined) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
        lastCompletedRef.current = completed;
      }

      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      const bytesDownloaded = completed - lastCompletedRef.current;

      if (elapsedSeconds > 0) {
        setSpeed(bytesDownloaded / elapsedSeconds);
      }
    } else if (!isDownloading) {
      startTimeRef.current = 0;
      lastCompletedRef.current = 0;
    }
  }, [completed, isDownloading]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Downloading Model</DialogTitle>
          <DialogDescription>Downloading {modelName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{status}</span>
              <span className="text-sm text-gray-600">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {completed !== undefined && total !== undefined && (
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Downloaded: {formatBytes(completed)} / {formatBytes(total)}
              </div>
              {completed > 0 && total > 0 && (
                <div>Speed: {formatBytes(speed)}/s</div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {isDownloading && onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDownloading}
              className="flex-1"
            >
              {isDownloading ? "Downloading..." : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
