"use client";
import { useFormStatus } from "react-dom";

type Props = { children: React.ReactNode; className?: string; pendingText?: string; confirm?: string; name?: string; value?: string; "data-testid"?: string; formAction?: (f: FormData) => void | Promise<void> };

export function SubmitButton({ children, className = "btn-primary", pendingText, confirm, name, value, formAction, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={pending}
      formAction={formAction}
      data-testid={rest["data-testid"]}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? (pendingText ?? "…") : children}
    </button>
  );
}
