"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";
import { useRef, useCallback, useState, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
}

const MAX_CHARACTERS = 1000;

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
}: Props) {
  const t = useTranslations();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);
  const isOverLimit = value.length > MAX_CHARACTERS;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isLoading) {
          onSubmit();
        }
      }
    },
    [value, isLoading, onSubmit],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      el.style.height = Math.min(scrollHeight, 200) + "px";
      setIsMultiline(scrollHeight > 32);
    }
  }, []);

  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-2 md:px-4 pt-3 pb-5">
        <div
          className={`relative flex bg-white border border-gray-200 px-5 pr-2.5 py-2.5 shadow-sm transition-[border-color,box-shadow,border-radius] focus-within:border-gray-300 focus-within:shadow-md ${
            isMultiline ? "rounded-3xl items-end" : "rounded-full items-center"
          }`}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARACTERS}
            placeholder={t("chat.placeholder")}
            className="w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 min-h-0 max-h-[200px] text-base md:text-base placeholder:text-base placeholder:font-normal"
            rows={1}
          />
          <div className="ml-4 shrink-0">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="default"
                className="size-9 rounded-full"
                onClick={onStop}
              >
                <Square className="size-4" fill="currentColor" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="default"
                className="size-9 rounded-full"
                disabled={!value.trim() || isOverLimit}
                onClick={onSubmit}
              >
                <ArrowUp className="size-4.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
