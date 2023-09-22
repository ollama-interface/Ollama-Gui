import React, { useEffect, useRef } from 'react';
import {
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface IConfirmModalProps {
  onResponse: (e: boolean) => void;
}

export const ConfirmModal: React.FC<IConfirmModalProps> = (props) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => ref.current?.click(), []);

  return (
    <AlertDialog onOpenChange={props.onResponse}>
      <AlertDialogTrigger ref={ref} className="hidden"></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
