import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { core } from '@/core';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import React, { useCallback, useState } from 'react';
import { useSimple } from 'simple-core-state';
import { ConfirmSwitchModel } from './ConfirmSwitchModel';
import { ModelTypes } from '@/core/types';

const models = [
  {
    name: 'llama2',
  },
  {
    name: 'llama2:13b',
  },
  {
    name: 'llama2:70b',
  },
  {
    name: 'llama2-uncensored',
  },
  {
    name: 'codellama',
  },
  {
    name: 'orca-mini',
  },
  {
    name: 'vicuna',
  },
  {
    name: 'nous-hermes',
  },
  {
    name: 'nous-hermes:13b',
  },
  {
    name: 'wizard-vicuna',
  },
];

interface ISelectConversationProps {
  loading: boolean;
}

export const SelectModel: React.FC<ISelectConversationProps> = ({
  loading,
}) => {
  const model = useSimple(core.model);
  const installedModels = useSimple(core.installed_models);
  const currentConv = useSimple(core.current_conversation);
  const conversations = useSimple(core.conversations);

  const [showWarning, setShowWarning] = useState(false);

  const onConfirmHandler = useCallback(
    (s: boolean, r?: boolean) => {
      if (s) {
        if (r) {
          core.conversations.patchObject({
            [currentConv]: { chatHistory: [], ctx: [], model: model },
          });
        } else {
          core.conversations.patchObject({
            [currentConv]: { ...conversations[currentConv], model: model },
          });
        }
      } else {
        core.model.revert();
      }

      setShowWarning(false);
    },
    [model, currentConv, currentConv]
  );

  return (
    <div className="mx-2">
      {showWarning && <ConfirmSwitchModel onClose={onConfirmHandler} />}
      <Select
        disabled={loading}
        value={model}
        onValueChange={(e) => {
          console.log(e);

          setShowWarning(true);
          // if (currentConv === 'session') setShowWarning(true);
          core.model.set(e as ModelTypes);
          // core.
        }}
      >
        <SelectTrigger className="w-fit whitespace-nowrap">
          <SelectValue placeholder="Select a Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Models</SelectLabel>
            {models.map((item, index) => (
              <SelectItem
                key={index}
                value={item.name}
                disabled={
                  !installedModels.filter((e) => e.name.includes(item.name))
                    ?.length
                }
              >
                <div className="flex flex-row items-center">
                  <a>{item.name}</a>
                  {!installedModels.filter((e) => e.name.includes(item.name))
                    ?.length && (
                    <ExclamationTriangleIcon className="ml-2" color="#e94646" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
