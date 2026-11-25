"use client";

import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center text-sm font-medium text-foreground",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted w-9 text-xs font-medium",
        week: "flex w-full mt-1",
        day: "size-9 text-center text-sm p-0 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-full p-0 font-normal aria-selected:opacity-100",
        ),
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:bg-muted-surface [&>button]:font-semibold",
        outside: "text-muted opacity-40",
        disabled: "text-muted opacity-30",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />),
      }}
      {...props}
    />
  );
}
