import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { core, createNewConversation } from '@/core';
import { ModelTypes } from '@/core/types';
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
          <SelectValue placeholder="Select a Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Conversations</SelectLabel>
            {/* <SelectItem value={'session'}>Session Mode</SelectItem> */}
            {Object.entries(conversations)?.map((item, index) => (
              <SelectItem key={index} value={item[0]}>
                <div className="flex flex-row items-center">
                  <a>{item[0]}</a>
                  {/* <a className="ml-4">{item[1].ctx?.length}</a> */}
                </div>
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
