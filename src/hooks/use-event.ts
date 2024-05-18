/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DependencyList, useCallback, useLayoutEffect, useRef } from 'react';

const STATIC_DEPS: DependencyList = [];

export type UseEvent<T extends (...args: any[]) => any> = T & {
	__use_event__: true;
};

/**
 * This is proposal: https://github.com/reactjs/rfcs/pull/220
 *
 * See also: https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 *
 * Example to use:
 * ```tsx
 * function Foo() {
 *   const [text, setText] = useState('');
 *
 *   const handleClick = useEvent(() => {
 *       sendMessage(text);
 *   });
 *
 *   // SendButton has memo HOC wrapper
 *   return <SendButton onClick={handleClick} />;
 * }
 * ```
 */
export function useEvent<T extends (...args: any) => any>(handler: T) {
	const handlerRef = useRef(handler);

	useLayoutEffect(() => {
		handlerRef.current = handler;
	});

	return useCallback((...args: Parameters<T>) => {
		const fn = handlerRef.current;
		return fn(...(args as any[]));
	}, STATIC_DEPS) as UseEvent<T>;
}
