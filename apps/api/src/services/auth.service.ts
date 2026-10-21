import { User, UserRole } from '@prisma/client';
import type {
  AuthUserDto,
  AuthResponseData,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@tourist/shared';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import {
  hashPassword,
  verifyPassword,
  generateRandomToken,
  hashToken,
} from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { EmailService, EmailDeliveryResult } from './email.service.js';

export class AuthService {
  /**
   * Sanitizes a Prisma User entity into an external AuthUserDto.
   * Guarantees password hashes and reset tokens are NEVER exposed.
   */
  static formatAuthUser(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Registers a new user.
   * Enforces uniqueness and assigns default TOURIST role (prevents privilege escalation).
   */
  static async register(input: RegisterInput): Promise<AuthResponseData> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw AppError.conflict(
        'An account with this email address already exists.',
        'EMAIL_ALREADY_EXISTS'
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash,
        phoneNumber: input.phoneNumber,
        role: UserRole.TOURIST,
        tokenVersion: 0,
      },
    });

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: this.formatAuthUser(user),
      token,
    };
  }

  /**
   * Authenticates user credentials.
   * Emits generic invalid credentials error to defend against user enumeration.
   */
  static async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: this.formatAuthUser(user),
      token,
    };
  }

  /**
   * Logs out the user and revokes all active session tokens by incrementing tokenVersion.
   */
  static async logout(userId: string): Promise<{ message: string }> {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    return { message: 'Successfully logged out and invalidated active session tokens.' };
  }

  /**
   * Retrieves authenticated user's profile.
   */
  static async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('User profile not found.', 'USER_NOT_FOUND');
    }

    return this.formatAuthUser(user);
  }

  /**
   * Updates authenticated user's profile.
   * Rejects role and security alterations.
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<AuthUserDto> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      },
    });

    return this.formatAuthUser(user);
  }

  /**
   * Changes authenticated user's password.
   * Increments tokenVersion to invalidate existing tokens on other devices.
   */
  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<{ user: AuthUserDto; token: string; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw AppError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const isCurrentValid = await verifyPassword(
      input.currentPassword,
      user.passwordHash
    );

    if (!isCurrentValid) {
      throw AppError.badRequest(
        'The current password provided is incorrect.',
        undefined,
        'INVALID_CURRENT_PASSWORD'
      );
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });

    // Issue a fresh token for the current session
    const token = generateToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tokenVersion: updatedUser.tokenVersion,
    });

    return {
      user: this.formatAuthUser(updatedUser),
      token,
      message: 'Password successfully changed and all other sessions invalidated.',
    };
  }

  /**
   * Initiates password reset flow with secure, expiring token.
   * Generic message returned to prevent user enumeration.
   */
  static async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<{ message: string; delivery: EmailDeliveryResult }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // To prevent email enumeration, return consistent response if user doesn't exist
    if (!user) {
      return {
        message: 'If an account exists with that email address, password reset instructions have been issued.',
        delivery: {
          delivered: false,
          provider: 'none',
          message: 'No matching user account.',
        },
      };
    }

    // Generate cryptographically random token and SHA-256 hash for database
    const rawResetToken = generateRandomToken(32);
    const hashedResetToken = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpires: expiresAt,
      },
    });

    const delivery = await EmailService.sendPasswordResetEmail(
      user.email,
      rawResetToken
    );

    return {
      message: 'If an account exists with that email address, password reset instructions have been issued.',
      delivery,
    };
  }

  /**
   * Resets user password using the expiring token.
   */
  static async resetPassword(
    input: ResetPasswordInput
  ): Promise<{ message: string }> {
    const hashedToken = hashToken(input.token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw AppError.badRequest(
        'Password reset token is invalid or has expired. Please request a new link.',
        undefined,
        'INVALID_OR_EXPIRED_RESET_TOKEN'
      );
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      message: 'Password successfully reset. Please log in with your new credentials.',
    };
  }
}
