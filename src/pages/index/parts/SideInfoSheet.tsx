import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { OLLAMA_COMMAND, core } from '@/core';
import { ClipboardCopyIcon } from '@radix-ui/react-icons';
import { useSimple } from 'simple-core-state';

interface ISideInfoSheetProps {
  loading: boolean;
}
export const SideInfoSheet: React.FC<ISideInfoSheetProps> = ({ loading }) => {
  const url = useSimple(core.localAPI);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          Settings & Info
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Welcome to Ollama Web Interface</SheetTitle>
          <SheetDescription>
            Thank you for visiting this website, I made this because there is no
            web chat interface I have found at the time building this.
          </SheetDescription>
        </SheetHeader>

        <div className="h-100%">
          <Label className="mb-1 font-medium text-neutral-900 mr-1">
            Ollama:
          </Label>
          <a
            href="https://ollama.ai/"
            className="text-sm  underline underline-offset-4"
          >
            https://ollama.ai/
          </a>
          <div className="flex flex-col mt-4">
            <Label className="mb-1 font-medium text-neutral-900">
              Ollama remote address:
            </Label>
            <Input
              disabled={loading}
              type="text"
              placeholder="Ollama url"
              value={url}
              onChange={(e) => core.localAPI.set(e.currentTarget.value)}
            />
            <Label className="mt-6 mb-1 font-medium text-neutral-900">
              Serve command for ollama:
            </Label>
            <code className="relative rounded bg-neutral-200 px-[0.5rem] py-[0.5rem] font-mono text-sm font-semibold pb-8">
              {OLLAMA_COMMAND}
            </code>
            <div className="flex justify-end mt-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(OLLAMA_COMMAND);
                }}
              >
                <ClipboardCopyIcon className="mr-2" />
                Copy
              </Button>
            </div>
            <a className="italic text-sm text-neutral-800 mt-2">
              We need to run this, otherwise the website can't access your
              ollama server that is running on <strong>your</strong> machine.
            </a>
          </div>
          <div
            style={{ height: 'calc(100% - 455px)' }}
            className="flex flex-col justify-end"
          >
            <a
              href="https://twitter.com/twanluttik"
              className="mt-10 text-sm font-semibold hover:opacity-60 tracking-tight"
            >
              Twan Luttik - X (Twitter)
            </a>
            <a
              href="https://github.com/TwanLuttik/ollama-web-ui"
              className="mt-2 text-sm underline hover:opacity-60"
            >
              https://github.com/TwanLuttik/ollama-web-ui
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
