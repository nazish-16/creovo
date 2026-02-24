"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CodeBlock, CodeBlockCopyButton } from "../ai-elements/code-block";
import { FrameType } from "@/types/project";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { Code2Icon, DownloadIcon } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

const CodeExportDialog = ({
  frames,
  theme_style,
  projectName,
}: {
  frames: FrameType[];
  theme_style?: string;
  projectName?: string;
}) => {
  const [selectedFrameId, setSelectedFrameId] = useState<string>(
    frames?.[0]?.id || ""
  );

  const selectedFrame = frames?.find((f) => f.id === selectedFrameId) || frames?.[0];
  const fullHtml = selectedFrame
    ? getHTMLWrapper(selectedFrame.htmlContent, selectedFrame.title, theme_style)
    : "";

  const downloadAll = () => {
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFrame?.title || "screen"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>Project Code: {projectName}</DialogTitle>
          <Button variant="outline" size="sm" onClick={downloadAll} className="gap-2">
            <DownloadIcon className="size-4" />
            Download HTML
          </Button>
        </DialogHeader>
        <div className="flex flex-1 overflow-hidden gap-4">
          <div className="w-64 border-r pr-4">
            <h3 className="text-sm font-semibold mb-2 px-2 uppercase tracking-wider text-muted-foreground">Screens</h3>
            <ScrollArea className="h-full pb-8">
              <div className="flex flex-col gap-1">
                {frames?.map((frame) => (
                  <Button
                    key={frame.id}
                    variant={selectedFrameId === frame.id ? "secondary" : "ghost"}
                    className="justify-start font-normal truncate"
                    onClick={() => setSelectedFrameId(frame.id)}
                  >
                    {frame.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <ScrollArea className="h-full">
               <CodeBlock
                className="w-full h-auto"
                code={fullHtml}
                language="html"
                showLineNumbers
              >
                <CodeBlockCopyButton className="fixed top-20 right-12 z-50 bg-muted!" />
              </CodeBlock>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeExportDialog;
