import bcrypt from 'bcryptjs';

/**
 * Password hashing. We use bcryptjs (the pure-JS implementation of the bcrypt
 * algorithm) instead of the native `bcrypt` package, to avoid requiring a C++
 * build toolchain on Windows. Same algorithm and salting; documented in README.
 */
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
