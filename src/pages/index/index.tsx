import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  OllamaReturnObj,
  allomaGenerate,
  convertTextToJson,
  core,
  extractTextAndCodeBlocks,
  formatBytes,
} from '@/core';

import { SideInfoSheet } from './parts/SideInfoSheet';
import { useSimple } from 'simple-core-state';

import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { SelectModel } from './parts/SelectModel';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfirmChatClear } from './parts/ConfirmChatClear';
import { ModeToggle } from '@/components/mode-toggle';
import { IntroCard } from './parts/IntroCard';
import { Badge } from '@/components/ui/badge';
import { ConversationBlock } from './parts/ConversationBlock';
import { UpdateModelsAvailability, checkIsRunningUpdate } from './helper';
import { Sidebar } from './parts/Sidebar';

const HomePage: React.FC = () => {
  const { toast } = useToast();
  const chatRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  const model = useSimple(core.model);
  const visited = useSimple(core.visited);
  const ollamaConnected = useSimple(core.server_connected);
  const conversations = useSimple(core.conversations);
  const currentConversation = useSimple(core.current_conversation);

  const [showIntroCard, setShowIntroCard] = useState(false);
  const [showChatClearDialog, setShowChatClearDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txt, setTxt] = useState('');

  const removeConv = useCallback(() => {
    setShowChatClearDialog(true);
  }, []);

  const submitPrompt = useCallback(async () => {
    try {
      if (txt === '') return;
      setLoading(true);

      // Push my question to the history
      const ch = conversations[currentConversation].chatHistory;
      ch.push({
        created_at: new Date(),
        txt: [{ content: txt, type: 'text' }],
        who: 'me',
      });

      core.conversations.updatePiece(currentConversation, {
        ...conversations[currentConversation],
        chatHistory: ch,
      });

      setTxt('');

      // request the prompt
      const res = await allomaGenerate(
        txt,
        model,
        conversations[currentConversation].ctx
      );

      // We neet to convert the NDJSOn to json format
      const convertedToJson: OllamaReturnObj[] = convertTextToJson(res);

      // we need to convert our data set into one string
      const txtMsg = convertedToJson.map((item) => item.response).join('');

      const currentHistory = [
        ...conversations[currentConversation].chatHistory,
      ];

      // TODO: Make function that converts a piece of string into data blocks of types of text we show, so like code or a ordered list and etc...
      if (txtMsg.includes('```')) {
        const codeBlocks = extractTextAndCodeBlocks(txtMsg);
        if (!codeBlocks) {
        } else {
          currentHistory.push({
            created_at: new Date(),
            txt: codeBlocks,
            who: 'ollama',
          });
        }
      } else {
        currentHistory.push({
          txt: [{ content: txtMsg, type: 'text' }],
          who: 'ollama',
          created_at: new Date(),
        });
      }

      if (chatRef.current) {
        chatRef.current.scrollTo(0, chatRef.current.scrollHeight * 2);
      }

      setLoading(false);
      core.conversations.updatePiece(currentConversation, {
        model: model,
        chatHistory: currentHistory,
        ctx: convertedToJson[convertedToJson.length - 1].context,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description:
          'Something went wrong sending the promt, Check Info & Help',
      });

      setLoading(false);
    }

    // After its done, we need to auto focus since we disable the input whole its processing the request.
    if (promptRef?.current !== null) {
      setTimeout(() => {
        promptRef.current?.focus();
      }, 0);
    }
  }, [txt, chatRef, promptRef, model, conversations, currentConversation]);

  const initPageLoad = () => {
    if (visited === false) {
      setShowIntroCard(true);
    } else {
      UpdateModelsAvailability();
    }
  };

  const deleteConversation = useCallback(() => {
    // shallow copy
    const cc = { ...conversations };

    // Don't delete the session object but clear instead
    if (currentConversation === 'session') {
      cc['session'] = {
        chatHistory: [],
        ctx: [],
        model: model,
      };
    } else {
      // all other conversations will be removed
      delete cc[currentConversation];
    }

    // Update the core
    core.conversations.set(cc);

    // Select a new conversation
    const nextId = Object.entries(cc)[0][0] || 'session';
    core.current_conversation.set(nextId);
  }, [currentConversation, conversations, model]);

  useEffect(() => {
    if (ollamaConnected) {
      try {
        UpdateModelsAvailability();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Something went wrong',
          description: error as string,
        });
      }
    } else {
      core.installed_models.reset();
    }
  }, [ollamaConnected]);

  useEffect(() => {
    checkIsRunningUpdate();
    initPageLoad();
  }, []);

  return (
    <div className="flex flex-row h-full">
      <Sidebar loading={loading} />
      <div className="dark:bg-black h-full w-full flex flex-col justify-center items-center">
        {showIntroCard && (
          <IntroCard
            onClose={(e) => {
              if (e) core.visited.set(true);
              setShowIntroCard(false);
            }}
          />
        )}
        {showChatClearDialog && (
          <ConfirmChatClear
            onClose={(e) => {
              setShowChatClearDialog(false);
              if (e) {
                deleteConversation();
              }
            }}
          />
        )}

        <div className="flex flex-col w-full pb-[5px] mt-2">
          <div className="flex justify-center">
            {ollamaConnected && (
              <Badge
                className="bg-green-200 hover:bg-green-200 text-green-700"
                variant="secondary"
              >
                Connected
              </Badge>
            )}

            <div className="flex flex-row ml-2">
              <p className="text-black dark:text-white mr-1">
                Conversation size:
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {formatBytes(
                  new Blob([
                    JSON.stringify(
                      conversations[currentConversation]
                    ).toString(),
                  ]).size
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-row ] w-full p-4 pt-2">
            <Input
              ref={promptRef}
              autoFocus
              value={txt}
              disabled={!ollamaConnected || loading}
              placeholder="Prompt"
              className="mr-2 dark:text-zinc-300  outline-none hold:outline-none"
              onChange={(e) => setTxt(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitPrompt();
                }
              }}
            />
            <Button
              disabled={txt === '' || !ollamaConnected || loading}
              onClick={() => submitPrompt()}
              className="flex-shrink-0"
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>

            {/* <SelectConversation loading={loading} /> */}

            <Tooltip>
              <TooltipTrigger className="">
                <Button
                  disabled={loading}
                  size="default"
                  className="w-10 p-0 px-2 ml-2 bg-red-400 hover:bg-red-400 dark:bg-red-500 dark:hover:bg-red-500 dark:text-white hover:opacity-60"
                  onClick={removeConv}
                >
                  <TrashIcon height={21} width={21} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Delete Conversation</p>
              </TooltipContent>
            </Tooltip>

            <SelectModel loading={loading} />
            <SideInfoSheet loading={loading} />
            <ModeToggle />
          </div>
        </div>

        <div className="h-full w-full flex flex-row overflow-hidden">
          <div ref={chatRef} className="w-full overflow-y-scroll px-4">
            <ConversationBlock
              conversations={conversations}
              currentConversation={currentConversation}
              loading={loading}
            />
            {loading && (
              <Skeleton className="w-full h-[20px] rounded-full mt-2" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
