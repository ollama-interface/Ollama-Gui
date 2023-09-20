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
  ollamaRequest,
} from '@/core';

import dayjs from 'dayjs';
import { SideInfoSheet } from './parts/SideInfoSheet';
import { useSimple } from 'simple-core-state';
import CodeEditor from '@uiw/react-textarea-code-editor';

import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { IntroDialog } from './parts/IntroDialog';
import { SelectConversation } from './parts/SelectConversation';
import { SelectModel } from './parts/SelectModel';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfirmChatClear } from './parts/ConfirmChatClear';

function extractTextAndCodeBlocks(
  inputString: string
): { content: string; type: 'text' | 'code' }[] {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const matches = [];
  let currentIndex = 0;

  inputString.replace(codeBlockRegex, (match, codeBlock, index) => {
    // Add the text before the code block to the array
    if (index > currentIndex) {
      const textBeforeCodeBlock = inputString
        .substring(currentIndex, index)
        .trim();
      if (textBeforeCodeBlock.length > 0) {
        matches.push({ content: textBeforeCodeBlock, type: 'text' });
      }
    }

    // Add the code block to the array
    matches.push({ content: codeBlock, type: 'code', who: 'ollama' });

    // Update the current index
    currentIndex = index + match.length;
    return match;
  });

  // Add any remaining text after the last code block
  if (currentIndex < inputString.length) {
    const textAfterLastCodeBlock = inputString.substring(currentIndex).trim();
    if (textAfterLastCodeBlock.length > 0) {
      matches.push({ content: textAfterLastCodeBlock, type: 'text' });
    }
  }

  return matches as any;
}

const HomePage: React.FC = () => {
  const { toast } = useToast();
  const chatRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  const model = useSimple(core.model);
  const visited = useSimple(core.visited);
  const API_URL = useSimple(core.localAPI);
  const conversations = useSimple(core.conversations);
  const currentConversation = useSimple(core.current_conversation);

  const [showDialog, setShowDialog] = useState(false);
  const [showChatClearDialog, setShowChatClearDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txt, setTxt] = useState('');

  const getAvailableModels = async () => {
    try {
      const res = await ollamaRequest('GET', 'api/tags');
      if (res?.data?.models) {
        toast({
          variant: 'default',
          color: 'green',
          title: 'Connected',
          description: 'Connection has been esteblished',
        });
        core.installed_models.set(res.data.models);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed',
          description: 'No models has been found',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description:
          'Your ollama is not running, please start your ollama server and refresh the page',
      });
    }
  };

  const removeConv = useCallback(() => {
    setShowChatClearDialog(true);
  }, []);

  const submitPrompt = useCallback(async () => {
    try {
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

      // Request promopt
      const res = await allomaGenerate(
        txt,
        model,
        conversations[currentConversation].ctx
      );
      const convertedToJson: OllamaReturnObj[] = convertTextToJson(res);

      const txtMsg = convertedToJson.map((item) => item.response).join('');
      const currentHistory = conversations[currentConversation].chatHistory;

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

    if (promptRef?.current !== null) {
      console.log('xxx');
      setTimeout(() => {
        promptRef.current?.focus();
      }, 0);
    }
  }, [
    txt,
    history,
    chatRef,
    promptRef,
    model,
    conversations,
    currentConversation,
  ]);

  const initPageLoad = () => {
    if (visited === false) {
      setShowDialog(true);
    } else {
      getAvailableModels();
    }
  };

  const deleteConversation = useCallback(() => {
    const cc = { ...conversations };
    delete cc[currentConversation];
    core.conversations.set(cc);

    // Select a new conversation
    const nextId = Object.entries(cc)[0][0] || 'session';
    core.current_conversation.set(nextId);
  }, [currentConversation, conversations]);

  useEffect(() => {
    getAvailableModels();
  }, [API_URL]);

  useEffect(() => {
    initPageLoad();
  }, []);

  return (
    <div className=" h-full w-full flex flex-col justify-center items-center">
      {showDialog && (
        <IntroDialog
          onClose={() => {
            setShowDialog(false);
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

      <div className="flex flex-row mb-2 w-[100%] p-4">
        <Input
          ref={promptRef}
          autoFocus
          value={txt}
          disabled={loading}
          placeholder="Prompt"
          className="mr-2"
          onChange={(e) => setTxt(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitPrompt();
            }
          }}
        />
        <Button
          disabled={loading}
          onClick={() => submitPrompt()}
          className="flex-shrink-0"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>

        <SelectConversation loading={loading} />
        <Tooltip>
          <TooltipTrigger className="">
            <Button
              disabled={currentConversation === 'session'}
              variant={'destructive'}
              size={'default'}
              className="w-10 p-0 px-2 ml-2"
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
      </div>
      <div className="h-full w-full flex flex-row overflow-hidden">
        <div ref={chatRef} className="w-full overflow-y-scroll px-4">
          {conversations[currentConversation]?.chatHistory?.map(
            (item, index) => (
              <div
                key={index}
                className={`relative w-full flex ${
                  item.who === 'ollama' ? 'justify-end' : ''
                }`}
              >
                {item.who === 'me' && (
                  <p className="mr-2 mt-2.5 text-neutral-400">You</p>
                )}
                <div
                  className={`right-0 flex flex-col mb-10 bg-neutral-50 border-solid border-neutral-200 border rounded-xl p-2 w-[80%]`}
                >
                  {item.txt?.map((txtItem, txtIndex) => {
                    if (txtItem.type === 'text') {
                      return (
                        <p key={txtIndex} className="text-left">
                          {txtItem.content}
                        </p>
                      );
                    } else if (txtItem.type === 'code') {
                      return (
                        <CodeEditor
                          key={txtIndex}
                          className="bg-neutral-800 rounded-md my-2"
                          language="javascript"
                          value={txtItem.content}
                          data-color-mode="dark"
                          style={{
                            fontSize: 12,
                            fontFamily:
                              'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                          }}
                        />
                      );
                    }
                  })}

                  <p className="absolute bottom-[20px] text-xs text-neutral-500">
                    {dayjs(item.created_at).format('HH:MM:ss')}
                  </p>
                </div>
                {item.who === 'ollama' && (
                  <p className="ml-2 mt-2.5 text-neutral-400">Ollama</p>
                )}
              </div>
            )
          )}
          {loading && (
            <Skeleton className="w-full h-[20px] rounded-full mt-2" />
          )}
          {history?.length === 0 && !loading && (
            <p className="text-neutral-600">No message</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
