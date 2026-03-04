"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@repo/ui/shadcn/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/shadcn/avatar";
import { cn } from "@repo/lib/cn";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  disabled,
}: MentionTextareaProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch available users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  // Detect mentions and show suggestions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
      
      setFilteredUsers(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  }, [value, cursorPosition, users]);

  const insertMention = (user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    // Find the @ symbol position
    const mentionStart = textBeforeCursor.lastIndexOf("@");
    const beforeMention = textBeforeCursor.slice(0, mentionStart);
    
    // Insert mention with a special format: @[Name](userId)
    const mentionText = `@${user.name}`;
    const newValue = beforeMention + mentionText + " " + textAfterCursor;
    const newCursorPos = beforeMention.length + mentionText.length + 1;

    onChange(newValue);
    setShowSuggestions(false);
    
    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition(newCursorPos);
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        return;
      } else if (event.key === "Escape") {
        event.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    
    onKeyDown?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg z-50"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
              Mention someone
            </div>
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm hover:bg-accent transition-colors",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to extract mentions from text
export function extractMentions(text: string, users: User[]): string[] {
  const mentionedUserIds: string[] = [];
  const mentionPattern = /@(\w+(?:\s+\w+)*)/g;
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    const mentionedName = match[1];
    const user = users.find(
      (u) => u.name.toLowerCase() === mentionedName.toLowerCase()
    );
    if (user) {
      mentionedUserIds.push(user.id);
    }
  }

  return mentionedUserIds;
}

// Component to render comment text with highlighted mentions
export function CommentWithMentions({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const parts = content.split(/(@\w+(?:\s+\w+)*)/g);

  return (
    <p className={cn("text-sm text-foreground whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={index}
              className="text-primary font-medium bg-primary/10 px-1 rounded"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}
