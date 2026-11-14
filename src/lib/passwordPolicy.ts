export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function getPasswordRequirements(
  password: string,
): PasswordRequirement[] {
  return [
    {
      label: "8 to 128 characters",
      met: password.length >= 8 && password.length <= 128,
    },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function validatePassword(password: string): true | string {
  return getPasswordRequirements(password).every(
    (requirement) => requirement.met,
  )
    ? true
    : "Choose a password that meets every requirement";
}
