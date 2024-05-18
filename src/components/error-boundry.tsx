import { Component, ReactNode } from 'react';

export type Props = {
	fallback: ReactNode;
	children: ReactNode;
};

export class ErrorBoundary extends Component<Props, { hasError?: boolean }> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_error: unknown) {
		return { hasError: true };
	}

	componentDidCatch(error: unknown, info: unknown) {
		console.log(error, info);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return this.props.fallback;
		}

		return this.props.children;
	}
}
