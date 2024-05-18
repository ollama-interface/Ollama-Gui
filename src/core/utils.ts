import axios, { AxiosResponse } from 'axios';
import { core } from '.';

export async function ollamaRequest<R = any>(
	method: 'GET' | 'POST',
	path: string,
	c?: { data?: any },
): Promise<AxiosResponse<R, any>> {
	try {
		const res = await axios({
			method,
			url: `${core.localAPI._value}/${path}`,
			data: c?.data,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		return res;
	} catch (error) {
		core.serverConnected.set(false);
		throw error;
	}
}

export async function ollamaGenerate(
	prompt: string,
	model: string,
	context?: number[],
) {
	try {
		const res = await ollamaRequest('POST', 'api/generate', {
			data: {
				model,
				prompt,
				context,
			},
		});

		return res.data;
	} catch (error) {
		throw error;
	}
}

export interface OllamaResult {
	model: string;
	created_at: string;
	response: string;
	context?: number[];
	done: boolean;
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
	prompt_eval_duration?: number;
	eval_count?: number;
	eval_duration?: number;
}

export function convertTextToJson(inputText: string): OllamaResult[] {
	const lines = inputText.trim().split('\n');
	const jsonArray = [];

	for (const line of lines) {
		const jsonObject = JSON.parse(line);
		jsonArray.push(jsonObject);
	}

	return jsonArray;
}

export const formatBytes = (bytes: number, decimals = 2) => {
	if (!+bytes) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
export function trimWhitespace(str: string): string {
	return str.replace(/^[\s\xA0]+|[\s\xA0]+$/g, '');
}
