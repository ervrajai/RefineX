export const passwordPolicyRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,15}$/;

export const passwordRequirements = [
  "8 to 15 characters",
  "At least one uppercase letter",
  "At least one special character",
];

export function validatePassword(password) {
  return passwordPolicyRegex.test(password);
}
