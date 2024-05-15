import ReactMarkdown from 'react-markdown';

export type Props = React.ComponentProps<typeof ReactMarkdown>;

export function Markdown(props: Props) {
	return <ReactMarkdown {...props} />;
}
