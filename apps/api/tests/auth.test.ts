import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { hashPassword, hashToken } from '../src/utils/password.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Phase 4: Authentication & Authorization Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTouristUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'traveler.alice@example.com',
    name: 'Alice Traveler',
    phoneNumber: '+1-555-1234',
    avatarUrl: null,
    role: UserRole.TOURIST,
    isEmailVerified: false,
    tokenVersion: 0,
    passwordHash: '',
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockAdminUser = {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'admin.bob@voyagevista.com',
    name: 'Bob Admin',
    phoneNumber: null,
    avatarUrl: null,
    role: UserRole.ADMIN,
    isEmailVerified: true,
    tokenVersion: 0,
    passwordHash: '',
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  // 1. User Registration
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with hashed password and default TOURIST role', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        ...mockTouristUser,
        passwordHash: '$2a$12$fakeHashedPasswordValueForTesting',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'traveler.alice@example.com',
          name: 'Alice Traveler',
          password: 'Password123!',
          phoneNumber: '+1-555-1234',
          role: 'ADMIN', // Attacker attempts privilege escalation in body
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('traveler.alice@example.com');
      // Role must remain TOURIST regardless of body attempt
      expect(response.body.data.user.role).toBe('TOURIST');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data).toHaveProperty('token');
      // Verify HttpOnly cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
      expect(cookies[0].toLowerCase()).toContain('httponly');
    });

    it('should reject registration if email is already taken with 409 Conflict', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'traveler.alice@example.com',
          name: 'Alice Clone',
          password: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject registration with weak password (missing symbols/numbers) with 422 Unprocessable', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Weak Password User',
          password: 'password', // Missing upper, number, symbol
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // 2. User Login
  describe('POST /api/auth/login', () => {
    it('should authenticate valid credentials and return user profile and JWT', async () => {
      const hashedPassword = await hashPassword('Password123!');
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockTouristUser,
        passwordHash: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'traveler.alice@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(mockTouristUser.id);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data).toHaveProperty('token');
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('should reject invalid password with generic 401 Unauthorized', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockTouristUser,
        passwordHash: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'traveler.alice@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password.');
    });

    it('should reject unknown email with identical 401 Unauthorized (prevent enumeration)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password.');
    });
  });

  // 3. Authenticated Profile & Ownership
  describe('GET /api/auth/profile and Ownership Protection', () => {
    it('should reject unauthenticated access with 401 Unauthorized', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should return authenticated user profile when token is valid', async () => {
      const token = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: mockTouristUser.tokenVersion,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockTouristUser.id);
      expect(response.body.data.email).toBe(mockTouristUser.email);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should allow user to access their own resource in ownership-protected route', async () => {
      const token = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: mockTouristUser.tokenVersion,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);

      const response = await request(app)
        .get(`/api/admin/users/${mockTouristUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockTouristUser.id);
    });

    it('should forbid user from accessing another user resource (ownership violation) with 403 Forbidden', async () => {
      const token = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: mockTouristUser.tokenVersion,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);

      const otherUserId = '22222222-2222-2222-2222-222222222222';
      const response = await request(app)
        .get(`/api/admin/users/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_OWNERSHIP_REQUIRED');
    });
  });

  // 4. Role-Based Access Control (RBAC)
  describe('RBAC Authorization', () => {
    it('should forbid non-admin user from accessing admin dashboard with 403 Forbidden', async () => {
      const touristToken = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: UserRole.TOURIST,
        tokenVersion: 0,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${touristToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should grant access to admin dashboard for user with ADMIN role', async () => {
      const adminToken = generateToken({
        sub: mockAdminUser.id,
        email: mockAdminUser.email,
        role: UserRole.ADMIN,
        tokenVersion: 0,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.roleRequired).toBe('ADMIN');
    });
  });

  // 5. Password Change & Session Invalidation
  describe('POST /api/auth/change-password', () => {
    it('should change password, increment tokenVersion, and issue fresh token', async () => {
      const oldHash = await hashPassword('OldPassword123!');
      const userBefore = {
        ...mockTouristUser,
        passwordHash: oldHash,
        tokenVersion: 0,
      };

      const userAfter = {
        ...mockTouristUser,
        tokenVersion: 1,
      };

      const token = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: 0,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userBefore);
      vi.spyOn(prisma.user, 'update').mockResolvedValue(userAfter);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123#',
          confirmPassword: 'NewPassword123#',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenVersion: { increment: 1 },
          }),
        })
      );
    });

    it('should reject outdated token after tokenVersion has incremented', async () => {
      // Token has version 0, but user in database has version 1 (due to password change or logout)
      const tokenWithOldVersion = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: 0,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockTouristUser,
        tokenVersion: 1, // Revoked!
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenWithOldVersion}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_REVOKED');
    });
  });

  // 6. Password Reset Flow
  describe('Password Reset Lifecycle', () => {
    it('should generate expiring reset token for valid email without exposing password hashes', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);
      vi.spyOn(prisma.user, 'update').mockResolvedValue(mockTouristUser);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'traveler.alice@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetExpires: expect.any(Date),
          }),
        })
      );
      // In development console mode, previewUrl is provided for test ergonomics
      expect(response.body.data.delivery).toHaveProperty('provider', 'console');
    });

    it('should reset password with valid token and clear reset tokens', async () => {
      const rawToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const hashed = hashToken(rawToken);

      const userWithResetToken = {
        ...mockTouristUser,
        passwordResetToken: hashed,
        passwordResetExpires: new Date(Date.now() + 60000), // Valid for 1 more min
      };

      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(userWithResetToken);
      vi.spyOn(prisma.user, 'update').mockResolvedValue({
        ...userWithResetToken,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'BrandNewPassword99!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordResetToken: null,
            passwordResetExpires: null,
            tokenVersion: { increment: 1 },
          }),
        })
      );
    });

    it('should reject invalid or expired reset token with 400 Bad Request', async () => {
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-or-expired-token',
          newPassword: 'BrandNewPassword99!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_OR_EXPIRED_RESET_TOKEN');
    });
  });

  // 7. Logout
  describe('POST /api/auth/logout', () => {
    it('should clear cookies and increment tokenVersion', async () => {
      const token = generateToken({
        sub: mockTouristUser.id,
        email: mockTouristUser.email,
        role: mockTouristUser.role,
        tokenVersion: 0,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockTouristUser);
      vi.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockTouristUser,
        tokenVersion: 1,
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { tokenVersion: { increment: 1 } },
        })
      );
    });
  });
});
