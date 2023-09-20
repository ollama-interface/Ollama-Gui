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
import { useToast } from '@/components/ui/use-toast';
import { OLLAMA_COMMAND, core } from '@/core';
import { ClipboardCopyIcon } from '@radix-ui/react-icons';
import { useSimple } from 'simple-core-state';

interface ISideInfoSheetProps {
  loading: boolean;
}
export const SideInfoSheet: React.FC<ISideInfoSheetProps> = ({ loading }) => {
  const { toast } = useToast();
  const url = useSimple(core.localAPI);
  const convs = useSimple(core.conversations);

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
              <p className="break-words">{OLLAMA_COMMAND}</p>
              <Button
                size="sm"
                className="absolute bottom-0 right-0"
                variant="link"
                onClick={() => {
                  navigator.clipboard.writeText(OLLAMA_COMMAND);
                }}
              >
                Copy
              </Button>
            </code>
            <a className="italic text-sm text-neutral-800 mt-2">
              We need to run this, otherwise the website can't access your
              ollama server that is running on <strong>your</strong> machine.
            </a>
            <div className="mt-6 mb-6 justify-start flex">
              <Button
                onClick={() => {
                  toast({
                    title: 'Copied to clipboard',
                    description: 'Past it somewhere save like a txt file',
                  });
                  navigator.clipboard.writeText(JSON.stringify(convs));
                }}
              >
                <ClipboardCopyIcon className="mr-2" />
                Copy Conversations Data
              </Button>
            </div>
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
