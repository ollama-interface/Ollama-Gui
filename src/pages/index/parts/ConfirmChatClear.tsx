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

import React, { useEffect, useRef } from 'react';

interface IConfirmChatClearProps {
  onClose: (switchModel: boolean) => void;
}

export const ConfirmChatClear: React.FC<IConfirmChatClearProps> = ({
  onClose,
}) => {
  const someRef = useRef<HTMLButtonElement>(null);

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
          <AlertDialogTitle>
            Are you sure you want to delete the conversation
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the conversation and it is irreversible
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onClose(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onClose(true);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
