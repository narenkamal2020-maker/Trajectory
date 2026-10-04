import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../../config/oracle';

export interface User {
  USER_ID: string;
  EMAIL: string;
  PASSWORD_HASH: string;
  FULL_NAME: string;
  AVATAR_URL?: string;
  IS_ACTIVE: number;
  USER_ROLE: 'USER' | 'ADMIN';
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
}

export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      `SELECT * FROM TRAJECTORY_USERS WHERE EMAIL = :email AND IS_ACTIVE = 1`,
      { email }
    );
    return (result.rows?.[0] as User) ?? null;
  },

  async findById(userId: string): Promise<User | null> {
    const result = await query<User>(
      `SELECT * FROM TRAJECTORY_USERS WHERE USER_ID = :userId AND IS_ACTIVE = 1`,
      { userId }
    );
    return (result.rows?.[0] as User) ?? null;
  },

  async create(data: CreateUserData): Promise<User> {
    const userId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO TRAJECTORY_USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, CREATED_AT, UPDATED_AT)
       VALUES (:userId, :email, :passwordHash, :fullName, :createdAt, :updatedAt)`,
      { userId, email: data.email, passwordHash: data.passwordHash, fullName: data.fullName, createdAt: now, updatedAt: now }
    );
    return (await this.findById(userId))!;
  },

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await execute(
      `UPDATE TRAJECTORY_USERS SET AVATAR_URL = :avatarUrl, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId`,
      { avatarUrl, userId }
    );
  },
};
