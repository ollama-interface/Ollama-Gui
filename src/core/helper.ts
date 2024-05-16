import { trimWhitespace } from '.';
import { core } from './core';
import { ModelTypes } from './types';

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateRandomString(length: number): string {
	let randomString = '';
	for (let i = 0; i < length; i++) {
		const num = randomInt(1, 15);
		randomString += num.toString(16);
	}
	return randomString;
}

export const createNewConversation = (model?: ModelTypes) => {
	const id = generateRandomString(8);
	core.conversations.patchObject({
		[id]: { chatHistory: [], ctx: [], model: model ?? 'llama2' },
	});
	return id;
};

export function extractTextAndCodeBlocks(
	inputString: string,
): { content: string; type: 'text' | 'code' }[] {
	const codeBlockRegex = /```([\s\S]*?)```/g;
	const matches = [];
	let currentIndex = 0;

	inputString.replace(codeBlockRegex, (match, codeBlock, index) => {
		// Add the text before the code block to the array
		if (index > currentIndex) {
			const textBeforeCodeBlock = inputString
				.substring(currentIndex, index)
				.trim();
			if (textBeforeCodeBlock.length > 0) {
				matches.push({ content: textBeforeCodeBlock, type: 'text' });
			}
		}

		// Add the code block to the array
		matches.push({
			content: trimWhitespace(codeBlock),
			type: 'code',
			who: 'ollama',
		});

		// Update the current index
		currentIndex = index + match.length;
		return match;
	});

	// Add any remaining text after the last code block
	if (currentIndex < inputString.length) {
		const textAfterLastCodeBlock = inputString.substring(currentIndex).trim();
		if (textAfterLastCodeBlock.length > 0) {
			matches.push({ content: textAfterLastCodeBlock, type: 'text' });
		}
	}

	return matches as any;
}
