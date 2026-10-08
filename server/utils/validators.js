export const validatePassword = (password = "") => {
  const missing = [];
  if (password.length < 8) missing.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) missing.push("one capital letter");
  if (!/[0-9]/.test(password)) missing.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("one special symbol");
  return missing; // empty array = valid
};

export const isValidEmail = (email = "") =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(
    email
  );