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
import { useSimple } from 'simple-core-state';
import { TryConnect } from '../helper';
import { Badge } from '@/components/ui/badge';

interface ISideInfoSheetProps {
  loading: boolean;
}

export const SideInfoSheet: React.FC<ISideInfoSheetProps> = ({ loading }) => {
  const { toast } = useToast();
  const url = useSimple(core.localAPI);
  const convs = useSimple(core.conversations);
  const ollamaConnected = useSimple(core.server_connected);

  const clearConversations = () => {
    core.conversations.set({
      session: { chatHistory: [], ctx: [], model: 'llama2' },
    });
    core.current_conversation.set('session');
    toast({
      title: 'Conversation has been cleared',
      description:
        'All conversations has been cleared and you can start from fresh.',
    });
  };

  const importConversations = async () => {
    const data = await navigator.clipboard.readText();
    if (!data) {
      return;
    }

    core.conversations.set(JSON.parse(data));
    core.current_conversation.set('session');

    toast({
      title: 'Successfully imported',
      description: 'All of your conversation has been imported',
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap dark:text-white">
          Settings & Info
        </Button>
      </SheetTrigger>
      <SheetContent className="border-neutral-100 dark:border-neutral-900">
        <SheetHeader>
          <SheetTitle>Welcome to Ollama Web Interface</SheetTitle>
          <SheetDescription>
            Thank you for visiting this website, I made this because there is no
            web chat interface I have found at the time building this.
          </SheetDescription>
        </SheetHeader>

        <div className="h-100%">
          <Label className="mb-1 font-medium text-neutral-900 dark:text-neutral-100 mr-1">
            Ollama:
          </Label>
          <a
            href="https://ollama.ai/"
            className="text-sm  underline underline-offset-4 dark:text-white"
          >
            https://ollama.ai/
          </a>
          <div className="flex flex-col mt-4">
            <Label className="mb-1 font-medium text-neutral-900 dark:text-neutral-100">
              Ollama remote address:
            </Label>

            <Input
              disabled={ollamaConnected || loading}
              type="text"
              className="dark:text-white"
              placeholder="Ollama url"
              value={url}
              onChange={(e) => core.localAPI.set(e.currentTarget.value)}
            />
            <div className="mb-4 mt-2 fkex">
              <Button size="sm" onClick={TryConnect} disabled={ollamaConnected}>
                Connect
              </Button>
              <Button
                className="ml-2"
                size="sm"
                variant="secondary"
                onClick={() => {
                  core.server_connected.set(false);
                }}
                disabled={!ollamaConnected}
              >
                Disconnect
              </Button>
              {ollamaConnected && (
                <Badge
                  className="ml-2 bg-green-200 hover:bg-green-200 text-green-700"
                  variant="secondary"
                >
                  Connected
                </Badge>
              )}
            </div>
            <Label className="mt-6 mb-1 font-medium text-neutral-900 dark:text-neutral-100">
              Serve command for ollama:
            </Label>
            <code className="relative rounded bg-neutral-200 dark:text-white dark:bg-neutral-800 px-[0.5rem] py-[0.5rem] font-mono text-sm font-semibold pb-8">
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
            <a className="italic text-sm text-neutral-800 dark:text-neutral-200 mt-2">
              We need to run this, otherwise the website can't access your
              ollama server that is running on <strong>your</strong> machine.
            </a>
            <div className="mt-6 justify-start flex flex-col">
              <Label className="font-medium">
                You can import & export data by copy your data{' '}
              </Label>
              <div className="mt-2">
                <Button
                  className="w-fit"
                  onClick={() => {
                    toast({
                      title: 'Copied to clipboard',
                      description: 'Past it somewhere save like a txt file',
                    });
                    navigator.clipboard.writeText(JSON.stringify(convs));
                  }}
                >
                  Export
                </Button>
                <Button className="w-fit ml-2" onClick={importConversations}>
                  Import
                </Button>
              </div>
            </div>
            <Button
              onClick={clearConversations}
              variant="destructive"
              className="mt-6 w-fit"
            >
              Reset Conversations
            </Button>
          </div>
          <div
            style={{ height: 'calc(100% - 455px)' }}
            className="flex flex-col justify-end"
          >
            <a
              href="https://twitter.com/twanluttik"
              className="mt-10 text-sm font-semibold hover:opacity-60 tracking-tight dark:text-white"
            >
              Twan Luttik - X (Twitter)
            </a>
            <a
              href="https://github.com/ollama-interface/Ollama-Gui"
              className="mt-2 text-sm underline hover:opacity-60 dark:text-white"
            >
              https://github.com/ollama-interface/Ollama-Gui
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
