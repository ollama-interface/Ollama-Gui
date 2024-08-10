import { Button } from "@/components/ui/button";
import { actions, generateRandomId } from "@/core";

export const Sidebar = () => {
  const newConversation = () => {
    actions.createConversation({
      id: generateRandomId(5),
      created_at: new Date(),
      model: "llama3",
      title: "Somethign",
    });
  };
  return (
    <div className="w-[300px] border-left-1 border-solid border-l-neutral-500">
      <div className="p-4">
        <Button onClick={newConversation} variant="outline">
          New Conversation
        </Button>
      </div>
    </div>
  );
};
