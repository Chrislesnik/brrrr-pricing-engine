"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Laptop,
  Moon,
  Sun,
  Home,
  Landmark,
  ClipboardCheck,
  FolderArchive,
  Handshake,
  LifeBuoy,
  Sparkles,
  FileText,
  Calculator,
  GraduationCap,
  HelpCircle,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command";

interface AppCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppCommandDialog({
  open,
  onOpenChange,
}: AppCommandDialogProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search resources, documents, and settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/resources"))}
          >
            <Home className="mr-2 h-4 w-4" />
            Resource Hub
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/whats-new"))
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            What&apos;s New
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/documents"))
            }
          >
            <FolderArchive className="mr-2 h-4 w-4" />
            Document Library
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Loan Programs">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources#loan-programs"))
            }
          >
            <Landmark className="mr-2 h-4 w-4" />
            Browse Loan Programs
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Underwriting">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources#underwriting"))
            }
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Underwriting Guidelines
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Documents & Forms">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push("/resources/documents?folder=applications")
              )
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Application Forms
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push("/resources/documents?folder=rate-sheets")
              )
            }
          >
            <Calculator className="mr-2 h-4 w-4" />
            Rate Sheets
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Partner Resources">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/broker-guide"))
            }
          >
            <Handshake className="mr-2 h-4 w-4" />
            Broker Guide
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/submission-process"))
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Submission Process
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Help & Training">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/getting-started"))
            }
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Getting Started
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/faqs"))
            }
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQs
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/resources/contact"))
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Contact Support
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem
            onSelect={() => runCommand(() => setTheme("light"))}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light Theme
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("dark"))}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark Theme
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("system"))}
          >
            <Laptop className="mr-2 h-4 w-4" />
            System Theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
