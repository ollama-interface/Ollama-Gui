import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type Props = {
	onAgree?: () => void;
	onCancel?: () => void;
};

export function ConfirmChatClear(props: Props) {
	return (
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle className="dark:text-neutral-50">
					Are you sure you want to delete the conversation?
				</AlertDialogTitle>
				<AlertDialogDescription>
					This will delete the conversation and it is irreversible
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel
					className="dark:text-neutral-50"
					onClick={props.onCancel}
				>
					Cancel
				</AlertDialogCancel>
				<AlertDialogAction onClick={props.onAgree} variant="destructive">
					Delete
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	);
}
