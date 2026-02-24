"use client";

import { useEffect, useState } from "react";
import { X, Type, Palette, Maximize, Layout, ArrowUp, ArrowDown, Layers, Move, AlignCenter, AlignLeft, AlignRight, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PropertiesPanelProps = {
  selectedElement: any;
  onUpdate: (updates: { classes?: string[]; text?: string }) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function PropertiesPanel({
  selectedElement,
  onUpdate,
  onDelete,
  onClose,
}: PropertiesPanelProps) {
  const [text, setText] = useState("");
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    if (selectedElement) {
      setText(selectedElement.innerText || "");
      setClasses(selectedElement.classes || []);
    }
  }, [selectedElement]);

  const handleClassToggle = (className: string) => {
    const newClasses = classes.includes(className)
      ? classes.filter((c) => c !== className)
      : [...classes, className];
    setClasses(newClasses);
    onUpdate({ classes: newClasses });
  };

  const handleExclusiveClass = (newClass: string, prefix: string) => {
    const newClasses = classes.filter(c => !c.startsWith(prefix));
    if (!classes.includes(newClass)) newClasses.push(newClass);
    setClasses(newClasses);
    onUpdate({ classes: newClasses });
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    onUpdate({ text: newText });
  };

  if (!selectedElement) return null;

  return (
    <div className="absolute right-4 top-20 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[calc(100vh-120px)] animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Layout className="size-4 text-blue-500" />
          <h3 className="font-bold text-sm">Properties: <span className="text-blue-500 uppercase">{selectedElement.tagName}</span></h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
          <X className="size-4" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-10">
          <TabsTrigger value="content" className="text-xs gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-full">
            <Type className="size-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-full">
            <Palette className="size-3.5" /> Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-full">
            <Maximize className="size-3.5" /> Layout
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <TabsContent value="content" className="m-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Text Content</Label>
              <Input
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            
            <div className="space-y-4">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Alignment</Label>
              <div className="flex gap-2">
                <Button variant={classes.includes('text-left') || (!classes.includes('text-center') && !classes.includes('text-right')) ? "default" : "outline"} size="icon-sm" onClick={() => handleExclusiveClass('text-left', 'text-')}>
                  <AlignLeft className="size-4" />
                </Button>
                <Button variant={classes.includes('text-center') ? "default" : "outline"} size="icon-sm" onClick={() => handleExclusiveClass('text-center', 'text-')}>
                  <AlignCenter className="size-4" />
                </Button>
                <Button variant={classes.includes('text-right') ? "default" : "outline"} size="icon-sm" onClick={() => handleExclusiveClass('text-right', 'text-')}>
                  <AlignRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Font Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'font-sans', name: 'Sans (Inter)', class: 'font-sans' },
                  { id: 'font-heading', name: 'Heading (Grotesk)', class: 'font-heading' },
                  { id: 'font-serif', name: 'Serif (Playfair)', class: 'font-serif' },
                  { id: 'font-mono', name: 'Mono (JetBrains)', class: 'font-mono' },
                ].map((f) => (
                  <Button
                    key={f.id}
                    variant={classes.includes(f.class) ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 text-[10px] justify-start px-2", f.class)}
                    onClick={() => handleExclusiveClass(f.class, 'font-')}
                  >
                    {f.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t font-mono text-[10px] opacity-60">
                <div className="flex justify-between"><span>Tag Name:</span><span>{selectedElement.tagName}</span></div>
                <div className="flex justify-between"><span>Inner Text Length:</span><span>{text.length} chars</span></div>
             </div>
          </TabsContent>

          <TabsContent value="style" className="m-0 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shadows</Label>
                  <div className="space-y-1">
                    {['shadow-none', 'shadow-sm', 'shadow-md', 'shadow-xl', 'shadow-2xl'].map(s => (
                      <Button
                        key={s}
                        variant={classes.includes(s) ? "default" : "outline"}
                        size="sm"
                        className="w-full h-8 text-[10px] justify-start px-2"
                        onClick={() => handleExclusiveClass(s, 'shadow-')}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rounding</Label>
                  <div className="space-y-1">
                    {['rounded-none', 'rounded-md', 'rounded-2xl', 'rounded-full'].map(r => (
                      <Button
                        key={r}
                        variant={classes.includes(r) ? "default" : "outline"}
                        size="sm"
                        className="w-full h-8 text-[10px] justify-start px-2"
                        onClick={() => handleExclusiveClass(r, 'rounded-')}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Opacity</Label>
                <div className="flex flex-wrap gap-2">
                  {['opacity-100', 'opacity-75', 'opacity-50', 'opacity-25'].map(o => (
                    <Button
                      key={o}
                      variant={classes.includes(o) ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-[10px] rounded-md px-2"
                      onClick={() => handleExclusiveClass(o, 'opacity-')}
                    >
                      {o.replace('opacity-', '')}%
                    </Button>
                  ))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="layout" className="m-0 space-y-4">
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Positioning</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={classes.includes('relative') ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1 text-[10px]"
                      onClick={() => handleExclusiveClass('relative', 'absolute')} 
                    >
                      Relative
                    </Button>
                    <Button 
                      variant={classes.includes('absolute') ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1 text-[10px]"
                      onClick={() => handleExclusiveClass('absolute', 'relative')} 
                    >
                      Absolute
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Layers (Z-Index)</Label>
                  <div className="flex gap-2">
                    {[0, 10, 20, 30, 40, 50].map(z => (
                      <Button
                        key={z}
                        variant={classes.includes(`z-${z}`) ? "default" : "outline"}
                        size="icon-sm"
                        className="size-7 rounded-md text-[10px]"
                        onClick={() => handleExclusiveClass(`z-${z}`, 'z-')}
                      >
                        {z}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                   <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground italic text-blue-500">Manual Dragging</Label>
                   <p className="text-[10px] text-muted-foreground">
                      Click and drag the element inside the frame while in edit mode to move it manually.
                   </p>
                </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="p-4 border-t bg-muted/30 flex flex-col gap-3">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-destructive/80">Danger Zone</Label>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full h-8 text-[11px] gap-2 bg-destructive/10 text-destructive hover:bg-destructive/10! hover:border hover:border-destructive/30! border-destructive/20"
              >
                <Trash2Icon className="size-3.5" /> Delete Element
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-destructive/20 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">Delete Element?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This will remove the selected <span className="font-bold text-foreground">"{selectedElement.tagName}"</span> from the screen. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted font-medium">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-lg shadow-destructive/20"
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5">
          <Move className="size-3" /> Drag elements to reposition.
        </p>
      </div>
    </div>
  );
}
