import crypto from "crypto";
import { ComparePassword } from "../types";

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);

      resolve(hash.toString("hex").normalize());
    });
  });
}

// Hashing : If we hash the same password again and again, we get the same hashed string everytime.

// "password-salt" => "2hfc288r24ywe82ws82w"
// "password-newsalt" => "vnrytyv3revyhverygfhh"

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize();
}

export async function comparePassword({
  password,
  salt,
  hashedPassword,
}: ComparePassword) {
  const inputHashedPassword = await hashPassword(password, salt);

  return crypto.timingSafeEqual(
    Buffer.from(inputHashedPassword, "hex"),
    Buffer.from(hashedPassword, "hex")
  );
}
