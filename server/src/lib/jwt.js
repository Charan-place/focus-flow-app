import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
const EXPIRES = '90d';

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET); // throws if invalid/expired
}
