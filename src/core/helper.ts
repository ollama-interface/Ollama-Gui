import { trimWhitespace } from ".";

export function generateRandomString(length: number): string {
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const num = Math.floor(Math.random() * 10);
    randomString += num.toString();
  }
  return randomString;
}

export function extractTextAndCodeBlocks(
  inputString: string
): { content: string; type: "text" | "code" }[] {
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
        matches.push({ content: textBeforeCodeBlock, type: "text" });
      }
    }

    // Add the code block to the array
    matches.push({
      content: trimWhitespace(codeBlock),
      type: "code",
      who: "ollama",
    });

    // Update the current index
    currentIndex = index + match.length;
    return match;
  });

  // Add any remaining text after the last code block
  if (currentIndex < inputString.length) {
    const textAfterLastCodeBlock = inputString.substring(currentIndex).trim();
    if (textAfterLastCodeBlock.length > 0) {
      matches.push({ content: textAfterLastCodeBlock, type: "text" });
    }
  }

  return matches as any;
}

export function generateRandomId(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const generateIdNumber = (input_length: number) => {
  let result = "";
  let chars = "0123456789";
  for (let i = 0; i < input_length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
