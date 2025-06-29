import { z } from "zod";

// Custom error class extending from inbuilt Error class :
export class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid Token!!");
    this.cause = zodError;
  }
}

export class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid User!!");
    this.cause = zodError;
  }
}

export class InvalidStateError extends Error {
  constructor() {
    super("Invalid State!!");
  }
}
