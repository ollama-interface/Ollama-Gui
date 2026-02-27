export interface CollectionItem {
  id: string;
  type: "link" | "code";
  content: string;
  label?: string;
  messageId: string;
}

export const extractCollectionsFromMessages = (
  messages: Array<{ id: string; message: string }>
): CollectionItem[] => {
  const items: CollectionItem[] = [];
  const seenUrls = new Set<string>();
  const seenCode = new Set<string>();

  messages.forEach((msg) => {
    // Extract links using regex
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s)]+/g;
    let match;

    while ((match = linkRegex.exec(msg.message)) !== null) {
      const label = match[1] || match[0];
      const url = match[2] || match[0];

      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        items.push({
          id: `link-${items.length}`,
          type: "link",
          content: url,
          label: label,
          messageId: msg.id,
        });
      }
    }

    // Extract code blocks using regex
    const codeRegex = /```(?:\w+)?\n([\s\S]*?)```/g;

    while ((match = codeRegex.exec(msg.message)) !== null) {
      const code = match[1].trim();
      const codeHash = code.substring(0, 50);

      if (!seenCode.has(codeHash)) {
        seenCode.add(codeHash);
        items.push({
          id: `code-${items.length}`,
          type: "code",
          content: code,
          messageId: msg.id,
        });
      }
    }
  });

  return items;
};
