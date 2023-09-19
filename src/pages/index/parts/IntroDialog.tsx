import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { core } from '@/core';
import { useEffect, useRef } from 'react';

export const IntroDialog = (p: { onClose: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.click();
  }, []);

  return (
    <Dialog
      onOpenChange={(e) => {
        if (!e) {
          core.visited.set(true);
          p.onClose();
        }
      }}
    >
      <DialogTrigger className="hidden" ref={ref}></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-2">
            Welcome to Ollama Web Interface
          </DialogTitle>
          <DialogDescription>
            This is a web interface for your locally running Ollama server, This
            is an open-source project and there will be no data send or shared
            with anyone and its just you, in case you want to host it fully on
            your machine, you can clone the repo and run it your yourself!
          </DialogDescription>

          <DialogDescription className="mt-8 text-neutral-950 font-semibold">
            Please check 'Settings & Info' for configuring Ollama.
          </DialogDescription>
        </DialogHeader>
        <Button
          className="mt-2"
          onClick={() => {
            core.visited.set(true);
            p.onClose();
          }}
        >
          Close and don't show.
        </Button>
      </DialogContent>
    </Dialog>
  );
};
