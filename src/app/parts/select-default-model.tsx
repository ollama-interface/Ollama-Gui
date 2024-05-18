import { memo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { state } from '../state';
import { ReloadIcon } from '@radix-ui/react-icons';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from '@/components/ui/select';
import { P, match } from 'ts-pattern';

export const SelectModelsContent = memo(function SelectModelsContent() {
	const models = useAtomValue(state.app.models);
	return (
		<SelectContent>
			<SelectGroup>
				{match(models)
					.with({ status: 'loading' }, () => (
						<SelectLabel className="flex w-full items-center justify-center">
							<ReloadIcon className="h-4 w-4 animate-spin" />
						</SelectLabel>
					))
					.with(
						{ status: 'loaded', value: P.when((x) => x.count() > 0) },
						({ value }) => {
							return value
								.map((item) => (
									<SelectItem key={item.name} value={item.name}>
										<div className="flex flex-row items-center">
											{item.name}
										</div>
									</SelectItem>
								))
								.toArray();
						},
					)
					.otherwise(() => (
						<SelectLabel>No models loaded</SelectLabel>
					))}
			</SelectGroup>
		</SelectContent>
	);
});

export type Props = {
	onValueChange?: (value: string) => void;
};

export const SelectDefaultModel = memo(function SelectDefaultModel(
	props: Props,
) {
	const [model, setModel] = useAtom(state.app.model);

	const handleValueChange = props.onValueChange ?? setModel;

	return (
		<Select value={model} onValueChange={handleValueChange}>
			<SelectTrigger className="w-full whitespace-nowrap ">
				{model ?? 'Select a Model'}
			</SelectTrigger>
			<SelectModelsContent />
		</Select>
	);
});
