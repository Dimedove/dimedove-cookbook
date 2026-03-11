"use client";

import { useComposedRefs } from "@/lib/composition";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const DATA_TOP_SCROLL = "data-top-scroll";
const DATA_BOTTOM_SCROLL = "data-bottom-scroll";
const DATA_TOP_BOTTOM_SCROLL = "data-top-bottom-scroll";

const scrollerVariants = cva("", {
  variants: {
    orientation: {
      vertical: [
        "overflow-y-auto",
        "data-[top-scroll=true]:[mask-image:linear-gradient(0deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[bottom-scroll=true]:[mask-image:linear-gradient(180deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[top-bottom-scroll=true]:[mask-image:linear-gradient(#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
      ],
    },
    hideScrollbar: {
      true: "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      false: "",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    hideScrollbar: false,
  },
});

interface ScrollerProps
  extends VariantProps<typeof scrollerVariants>,
    React.ComponentPropsWithoutRef<"div"> {
  size?: number;
  offset?: number;
  asChild?: boolean;
}

const Scroller = React.forwardRef<HTMLDivElement, ScrollerProps>(
  (props, forwardedRef) => {
    const {
      orientation = "vertical",
      hideScrollbar,
      className,
      size = 40,
      offset = 0,
      style,
      asChild,
      ...scrollerProps
    } = props;

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const composedRef = useComposedRefs(forwardedRef, containerRef);

    React.useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      function onScroll() {
        if (!container) return;

        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        const hasTopScroll = scrollTop > offset;
        const hasBottomScroll =
          scrollTop + clientHeight + offset < scrollHeight;
        const isVerticallyScrollable = scrollHeight > clientHeight;

        if (hasTopScroll && hasBottomScroll && isVerticallyScrollable) {
          container.setAttribute(DATA_TOP_BOTTOM_SCROLL, "true");
          container.removeAttribute(DATA_TOP_SCROLL);
          container.removeAttribute(DATA_BOTTOM_SCROLL);
        } else {
          container.removeAttribute(DATA_TOP_BOTTOM_SCROLL);
          if (hasTopScroll) container.setAttribute(DATA_TOP_SCROLL, "true");
          else container.removeAttribute(DATA_TOP_SCROLL);
          if (hasBottomScroll && isVerticallyScrollable)
            container.setAttribute(DATA_BOTTOM_SCROLL, "true");
          else container.removeAttribute(DATA_BOTTOM_SCROLL);
        }
      }

      onScroll();
      container.addEventListener("scroll", onScroll);
      window.addEventListener("resize", onScroll);

      return () => {
        container.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }, [offset]);

    const composedStyle = React.useMemo<React.CSSProperties>(
      () => ({
        "--scroll-shadow-size": `${size}px`,
        ...style,
      }),
      [size, style],
    );

    const ScrollerPrimitive = asChild ? Slot : "div";

    return (
      <ScrollerPrimitive
        data-slot="scroller"
        {...scrollerProps}
        ref={composedRef}
        style={composedStyle}
        className={cn(
          scrollerVariants({ orientation, hideScrollbar, className }),
        )}
      />
    );
  },
);
Scroller.displayName = "Scroller";

export { Scroller };
