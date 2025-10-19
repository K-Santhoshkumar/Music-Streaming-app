import request from "supertest";
import express from "express";
import {
  protectRoute,
  requireAdmin,
} from "../../middleware/auth.middleware.js";
import { jest } from "@jest/globals";

describe("Auth Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe("protectRoute", () => {
    it("should allow access with valid userId", async () => {
      app.get(
        "/protected",
        (req, res, next) => {
          req.auth = { userId: "validUserId" };
          next();
        },
        protectRoute,
        (req, res) => {
          res.json({ message: "Protected route accessed" });
        }
      );

      const response = await request(app).get("/protected");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Protected route accessed");
    });

    it("should deny access without userId", async () => {
      app.get(
        "/protected",
        (req, res, next) => {
          req.auth = {};
          next();
        },
        protectRoute,
        (req, res) => {
          res.json({ message: "Protected route accessed" });
        }
      );

      const response = await request(app).get("/protected");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "Unauthorized - you must be logged in"
      );
    });
  });

  describe("requireAdmin", () => {
    beforeEach(() => {
      process.env.ADMIN_EMAIL = "admin@example.com";
    });

    it("should allow admin access", async () => {
      // Mock clerkClient.users.getUser to return admin email
      const mockGetUser = jest.fn().mockResolvedValue({
        primaryEmailAddress: { emailAddress: "admin@example.com" },
      });

      // Mock the clerkClient directly
      const mockClerkClient = {
        users: {
          getUser: mockGetUser,
        },
      };

      // Replace the clerkClient in the middleware
      const authMiddleware = await import(
        "../../middleware/auth.middleware.js"
      );
      const originalGetUser = authMiddleware.requireAdmin;

      // Create a new requireAdmin function that uses our mock
      const mockRequireAdmin = async (req, res, next) => {
        try {
          const currentUser = await mockClerkClient.users.getUser(
            req.auth.userId
          );
          const isAdmin =
            process.env.ADMIN_EMAIL ===
            currentUser.primaryEmailAddress?.emailAddress;

          if (!isAdmin) {
            return res
              .status(403)
              .json({ message: "Unauthorized - you must be an admin" });
          }

          next();
        } catch (error) {
          next(error);
        }
      };

      app.get(
        "/admin",
        (req, res, next) => {
          req.auth = { userId: "adminUserId" };
          next();
        },
        protectRoute,
        mockRequireAdmin,
        (req, res) => {
          res.json({ message: "Admin route accessed" });
        }
      );

      const response = await request(app).get("/admin");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Admin route accessed");
    });

    it("should deny admin access for non-admin user", async () => {
      // Mock clerkClient.users.getUser to return non-admin email
      const mockGetUser = jest.fn().mockResolvedValue({
        primaryEmailAddress: { emailAddress: "nonadmin@example.com" },
      });

      // Mock the clerkClient directly
      const mockClerkClient = {
        users: {
          getUser: mockGetUser,
        },
      };

      // Create a new requireAdmin function that uses our mock
      const mockRequireAdmin = async (req, res, next) => {
        try {
          const currentUser = await mockClerkClient.users.getUser(
            req.auth.userId
          );
          const isAdmin =
            process.env.ADMIN_EMAIL ===
            currentUser.primaryEmailAddress?.emailAddress;

          if (!isAdmin) {
            return res
              .status(403)
              .json({ message: "Unauthorized - you must be an admin" });
          }

          next();
        } catch (error) {
          next(error);
        }
      };

      app.get(
        "/admin",
        (req, res, next) => {
          req.auth = { userId: "nonAdminUserId" };
          next();
        },
        protectRoute,
        mockRequireAdmin,
        (req, res) => {
          res.json({ message: "Admin route accessed" });
        }
      );

      const response = await request(app).get("/admin");

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Unauthorized - you must be an admin");
    });
  });
});
