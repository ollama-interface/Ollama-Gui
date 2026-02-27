import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, core } from "@/core";
import { ReactNode, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useSimple, useSimpleEvent } from "simple-core-state";

type Inputs = {
  host: string;
};

export const SettingsWrapper = ({ children }: { children: ReactNode }) => {
  const host_url = useSimple(core.server_host);
  const [open, setOpen] = useState(false);
  useSimpleEvent(core._events.trigger_settings, () => {
    setOpen(true);
  });

  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm<Inputs>({ values: { host: host_url } });

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    console.log("1223m", data);
  };

  const clearDatabase = async () => {
    await actions.flushDatbase();
    core.conversations.reset();
    core.focused_conv_data.reset();
    core.focused_conv_id.reset();
    core.focused_conv_meta.reset();
  };

  return (
    <div className="h-full w-full relative">
      {open && (
        <div className="absolute h-full w-full bg-white z-20 ">
          <div className="p-4">
            <div className="flex-row flex mb-2">
              <p className="font-bold text-lg">Settings</p>
              <Button
                className=""
                variant="link"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              {isDirty && (
                <div className="flex flex-row mb-2">
                  <Button
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      handleSubmit(onSubmit);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => reset({ host: host_url })}
                  >
                    Reset
                  </Button>
                </div>
              )}

              <div>
                <p>Ollama remote address</p>
                <Controller
                  name="host"
                  control={control}
                  rules={{ maxLength: 20, minLength: 1 }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input value={value} onChange={onChange} onBlur={onBlur} />
                  )}
                />
              </div>
            </form>
            <div className="mt-10">
              <p className="mb-1">Clear all conversations and messages</p>
              <Button variant="destructive" onClick={clearDatabase}>
                Clear data
              </Button>
            </div>
            <div className="flex flex-col">
              <p>Build by:</p>
              <div className="flex-col flex items-start">
                <p
                  className="cursor-pointer hover:opacity-50 active:opacity-30"
                  onClick={() => window.open("https://x.com/twanluttik")}
                >
                  Twan Luttik - x.com
                </p>

                <p
                  className="cursor-pointer hover:opacity-50"
                  onClick={() =>
                    window.open(
                      "https://github.com/ollama-interface/Ollama-Gui"
                    )
                  }
                >
                  code - github.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
