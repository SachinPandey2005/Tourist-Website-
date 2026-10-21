import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';

/**
 * Authentication middleware.
 * Extracts and verifies JWT from Bearer Authorization header or signed/unsigned cookies.
 * Verifies active session tokenVersion against the database.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Extract token from Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      // 2. Fallback to HttpOnly cookie
      token = req.cookies.token as string;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    if (!token) {
      return next(
        AppError.unauthorized('Authentication token is required. Please log in.', 'AUTH_TOKEN_MISSING')
      );
    }

    // 3. Verify JWT signature and expiration
    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        return next(
          AppError.unauthorized('Your session has expired. Please log in again.', 'TOKEN_EXPIRED')
        );
      }
      return next(
        AppError.unauthorized('Invalid authentication token.', 'TOKEN_INVALID')
      );
    }

    // 4. Verify user exists and token version is current
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return next(
        AppError.unauthorized('User account associated with this token no longer exists.', 'USER_NOT_FOUND')
      );
    }

    // 5. Invalidation check: If password was changed or user logged out, tokenVersion increments
    if (user.tokenVersion !== payload.tokenVersion) {
      return next(
        AppError.unauthorized(
          'Your session has been revoked or password was changed. Please log in again.',
          'SESSION_REVOKED'
        )
      );
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 * Note: 'USER' role also accepts 'TOURIST' for customer-facing operations.
 */
export function authorize(...allowedRoles: (UserRole | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication is required to perform this action.', 'AUTH_REQUIRED')
      );
    }

    const userRole = req.user.role;
    const isDirectMatch = allowedRoles.includes(userRole);
    // If requirement checks for USER role, treat TOURIST as satisfying it
    const isUserAliasMatch =
      allowedRoles.includes('USER') && userRole === UserRole.TOURIST;

    if (!isDirectMatch && !isUserAliasMatch) {
      return next(
        AppError.forbidden(
          'Access forbidden: You do not possess the required permissions to access this resource.',
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}

/**
 * Resource ownership authorization middleware.
 * Allows access if the authenticated user is an ADMIN or owns the specified target resource.
 */
export function authorizeOwnerOrAdmin(getOwnerIdFromReq: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication is required.', 'AUTH_REQUIRED'));
    }

    const ownerId = getOwnerIdFromReq(req);
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = ownerId !== undefined && req.user.id === ownerId;

    if (!isAdmin && !isOwner) {
      return next(
        AppError.forbidden(
          'Access forbidden: You can only view or manage your own resources.',
          'RESOURCE_OWNERSHIP_REQUIRED'
        )
      );
    }

    next();
  };
}
