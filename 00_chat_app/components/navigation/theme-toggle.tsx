"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {mounted && theme && (
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-accent"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {/* show sun on light, moon on dark */}
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      )}
    </>
  );
}
