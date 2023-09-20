import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import React, { useEffect, useRef, useState } from 'react';

interface IConfirmSwitchModelProps {
  onClose: (switchModel: boolean, resetChat?: boolean) => void;
}

export const ConfirmSwitchModel: React.FC<IConfirmSwitchModelProps> = ({
  onClose,
}) => {
  const someRef = useRef<HTMLButtonElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (someRef.current) someRef.current.click();
  }, []);

  return (
    <AlertDialog
      onOpenChange={(e) => {
        if (!e) {
          onClose(false);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button ref={someRef} className="hidden" variant="outline">
          Show Dialog
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-white">
            Are you sure you want to switch
          </AlertDialogTitle>
          <AlertDialogDescription>
            Swithcing to a different model could make the conversation out of
            place maybe?
          </AlertDialogDescription>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              onCheckedChange={(e) => {
                setConfirmReset(e as boolean);
              }}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white"
            >
              Reset conversation history and knowledge
            </label>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="dark:text-white"
            onClick={() => {
              onClose(false, confirmReset);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onClose(true, confirmReset);
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
