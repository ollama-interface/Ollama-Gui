import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";

export const SideInfoSheet: React.FC = () => {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" className="whitespace-nowrap">
					Info & Help
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Welcome to Ollama Chat Box</SheetTitle>
					<SheetDescription>
						Thank you for visiting this website, I made this because there is no
						web chat interface I have found at the time building this.
					</SheetDescription>
					<div className="">
						<a className="mr-1 text-sm font-bold text-neutral-800">
							Download link:
						</a>
						<a
							href="https://ollama.ai/"
							className="text-sm  underline underline-offset-4"
						>
							https://ollama.ai/
						</a>
						<div className="flex flex-col mt-4">
							<a className="mt-4 text-sm mb-2">Serve command for ollama:</a>
							<code className="relative rounded bg-neutral-200 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold pb-8">
								{`OLLAMA_ORIGINS=https://ollama-web-ui.vercel.app ollama serve`}
							</code>
							<div className="flex justify-end mt-2">
								<Button
									onClick={() => {
										navigator.clipboard.writeText(
											"OLLAMA_ORIGINS=https://ollama-web-ui.vercel.app ollama serve"
										);
									}}
								>
									<ClipboardCopyIcon className="mr-2" />
									Copy
								</Button>
							</div>
							<a className="italic text-sm text-neutral-500 mt-6">
								We need to run this, otherwise the website can't access your
								ollama server on <strong>your</strong> machine
							</a>
						</div>
					</div>
					<SheetFooter className="pt-20 flex flex-col">
						<a
							href="https://twitter.com/twanluttik"
							className="font-medium  underline  text-sm"
						>
							Twan Luttik - X (Twitter)
						</a>
					</SheetFooter>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
};
