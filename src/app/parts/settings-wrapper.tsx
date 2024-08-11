import { Button } from "@/components/ui/button";
import { core } from "@/core";
import { ReactNode, useState } from "react";
import { useSimpleEvent } from "simple-core-state";

export const SettingsWrapper = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  useSimpleEvent(core._events.trigger_settings, () => {
    setOpen(true);
  });
  return (
    <div className="h-full w-full relative">
      {open && (
        <div className="absolute h-full w-full bg-white z-10">
          <div className="p-4">
            <p>Settings</p>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
