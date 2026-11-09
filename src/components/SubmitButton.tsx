"use client";
import { useFormStatus } from "react-dom";

type Props = { children: React.ReactNode; className?: string; pendingText?: string; confirm?: string; name?: string; value?: string; "data-testid"?: string; formAction?: (f: FormData) => void | Promise<void> };

/**
 * Submit-Button für Server-Actions. Name/Wert des geklickten Buttons werden als verstecktes Feld ins
 * Formular geschrieben, weil der „Submitter“ bei Server-Action-Formularen nicht zuverlässig übertragen wird.
 */
export function SubmitButton({ children, className = "btn-primary", pendingText, confirm, name, value, formAction, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      formAction={formAction}
      data-testid={rest["data-testid"]}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        const form = e.currentTarget.form;
        if (form && name) {
          let hidden = form.querySelector<HTMLInputElement>("input[data-submitter]");
          if (!hidden) {
            hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.dataset.submitter = "1";
            form.appendChild(hidden);
          }
          hidden.name = name;
          hidden.value = value ?? "";
        }
      }}
    >
      {pending ? (pendingText ?? "…") : children}
    </button>
  );
}
