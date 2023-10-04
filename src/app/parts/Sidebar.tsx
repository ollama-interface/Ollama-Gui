import { Button } from '@/components/ui/button';
import { core, createNewConversation } from '@/core';
import React, { useState } from 'react';
import { useSimple } from 'simple-core-state';

interface ISidebarProps {
  loading: boolean;
}

export const Sidebar: React.FC<ISidebarProps> = (props) => {
  const [currentEdit, setCurrentEdit] = useState('');
  const convs = useSimple(core.conversations);
  const currentConv = useSimple(core.current_conversation);

  const newConv = () => {
    const id = createNewConversation();
    core.current_conversation.set(id);
    setCurrentEdit(id);
  };

  return (
    <div className="p-4 pt-3 w-[350px]">
      <Button
        disabled={props.loading}
        className="w-full dark:text-white"
        variant="outline"
        onClick={newConv}
      >
        Create new conversation
      </Button>
      <div className="mt-2 overflow-y-auto h-[calc(100%-30px)]">
        <div>
          {Object.entries(convs).map((item, index) => {
            return (
              <div
                className={`${
                  currentConv === item[0]
                    ? 'bg-neutral-200 dark:bg-neutral-800'
                    : 'bg-neutral-100 dark:bg-neutral-900'
                } p-2 hover:bg-neutral-200 mb-2 rounded-md select-none cursor-pointer text-black dark:text-white`}
                onClick={() => {
                  core.current_conversation.set(item[0]);
                }}
                onDoubleClick={() => {
                  setCurrentEdit(item[0]);
                }}
                key={index}
              >
                {currentEdit !== item[0] ? (
                  <p>{item[1]?.name || item[0]}</p>
                ) : (
                  <input
                    onKeyDown={(e) => {
                      if (e.code === 'Escape') {
                        setCurrentEdit('');
                      }

                      if (e.code === 'Enter') {
                        setCurrentEdit('');
                      }
                    }}
                    autoFocus
                    className="bg-transparent"
                    value={item[1]?.name || ''}
                    onChange={(e) => {
                      core.conversations.patchObject({
                        [item[0] as any]: {
                          ...item[1],
                          name: e.currentTarget.value,
                        },
                      });
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
