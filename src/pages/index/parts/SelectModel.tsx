import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { core, official_models } from '@/core';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import React, { useCallback, useState } from 'react';
import { useSimple } from 'simple-core-state';
import { ConfirmSwitchModel } from './ConfirmSwitchModel';
import { ModelTypes } from '@/core/types';

interface ISelectConversationProps {
  loading: boolean;
}

export const SelectModel: React.FC<ISelectConversationProps> = ({
  loading,
}) => {
  const model = useSimple(core.model);
  const installedModels = useSimple(core.installed_models);
  const installedUnoffModels = useSimple(core.unofficial_installed_models);
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
        <SelectTrigger className="w-fit whitespace-nowrap dark:text-white">
          <SelectValue placeholder="Select a Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Models</SelectLabel>
            {official_models.map((item, index) => (
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
            {installedUnoffModels.map((item, index) => (
              <SelectItem key={index} value={item.name}>
                <div className="flex flex-row items-center">
                  <a>{item.name}</a>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
