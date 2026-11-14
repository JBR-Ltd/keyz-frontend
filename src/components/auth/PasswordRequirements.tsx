import { CheckIcon, XIcon } from "lucide-react";
import { getPasswordRequirements } from "@/lib/passwordPolicy";

interface PasswordRequirementsProps {
  password: string;
}

export default function PasswordRequirements({
  password,
}: PasswordRequirementsProps) {
  return (
    <div aria-live="polite" className="grid gap-2 sm:grid-cols-2">
      {getPasswordRequirements(password).map((requirement) => (
        <p
          key={requirement.label}
          className={`flex items-center gap-2 font-body text-xs ${
            requirement.met ? "text-primary" : "text-muted"
          }`}
        >
          {requirement.met ? (
            <CheckIcon
              aria-hidden="true"
              className="text-emerald-600"
              size={15}
            />
          ) : (
            <XIcon aria-hidden="true" size={15} />
          )}
          {requirement.label}
        </p>
      ))}
    </div>
  );
}
