"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function AlertDialog({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props}>{children}</Dialog>
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />
}

function AlertDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent showCloseButton={false} className={cn("max-w-md", className)} {...props}>
      {children}
    </DialogContent>
  )
}

function AlertDialogHeader({ ...props }: React.ComponentProps<"div">) {
  return <DialogHeader {...props} />
}

function AlertDialogFooter({ ...props }: React.ComponentProps<"div">) {
  return <DialogFooter {...props} />
}

function AlertDialogTitle({ ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...props} />
}

function AlertDialogDescription({ ...props }: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription {...props} />
}

function AlertDialogAction({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { onClick?: () => void }) {
  return (
    <DialogClose asChild>
      <Button className={className} onClick={onClick} {...props}>
        {children}
      </Button>
    </DialogClose>
  )
}

function AlertDialogCancel({ className, children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <DialogClose asChild>
      <Button variant="outline" className={className} {...props}>
        {children}
      </Button>
    </DialogClose>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}
