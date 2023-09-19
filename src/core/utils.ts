import Axios from "axios";
import { core } from ".";

export const ollamaRequest = async (
	prompt: string,
	mdl: string,
	ctx?: number[]
) => {
	const res = await Axios.post(
		`${core.localAPI._value}/api/generate`,
		{
			model: mdl,
			prompt: prompt,
			context: ctx,
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	return res.data;
};

export interface OllamaReturnObj {
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

export function convertTextToJson(inputText: string): OllamaReturnObj[] {
	const lines = inputText.trim().split("\n");
	const jsonArray = [];

	for (const line of lines) {
		const jsonObject = JSON.parse(line);
		jsonArray.push(jsonObject);
	}

	return jsonArray;
}
