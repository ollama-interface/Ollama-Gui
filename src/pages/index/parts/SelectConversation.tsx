import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { core, createNewConversation, formatBytes } from '@/core';
import React, { useCallback } from 'react';
import { useSimple } from 'simple-core-state';

interface ISelectConversationProps {
  loading: boolean;
}

export const SelectConversation: React.FC<ISelectConversationProps> = ({
  loading,
}) => {
  const currentConversation = useSimple(core.current_conversation);
  const conversations = useSimple(core.conversations);

  const newConv = () => {
    const id = createNewConversation();
    core.current_conversation.set(id);
  };

  const onSelectHanlder = useCallback(
    (convID: string) => {
      console.log(convID);
      console.log(conversations[convID]);

      core.model.set(conversations[convID].model);
      core.current_conversation.set(convID);
    },
    [conversations, currentConversation]
  );

  return (
    <div className="ml-2">
      <Select
        disabled={loading}
        value={currentConversation}
        onValueChange={onSelectHanlder}
      >
        <SelectTrigger className="w-fit whitespace-nowrap">
          {currentConversation}
        </SelectTrigger>
        <SelectContent className="w-full">
          <SelectGroup className="w-full">
            <SelectLabel>Conversations</SelectLabel>
            {Object.entries(conversations)?.map((item, index) => (
              <SelectItem key={index} value={item[0]}>
                <a>
                  {item[0]} (
                  {formatBytes(
                    new Blob([
                      JSON.stringify(conversations[item[0]]).toString(),
                    ]).size
                  )}
                  )
                </a>
              </SelectItem>
            ))}
            <Button
              className="ml-1 mt-1.5 mb-1"
              size="sm"
              variant="outline"
              onClick={newConv}
            >
              Create new conversation
            </Button>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
