import mongoose from "mongoose";
import { jest } from "@jest/globals";
import { User } from "../../models/user.model.js";

describe("User Model", () => {
  it("should create a user successfully", async () => {
    const userData = {
      fullName: "John Doe",
      imageUrl: "http://example.com/image.jpg",
      clerkId: "clerk123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.fullName).toBe(userData.fullName);
    expect(savedUser.imageUrl).toBe(userData.imageUrl);
    expect(savedUser.clerkId).toBe(userData.clerkId);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it("should require fullName, imageUrl, and clerkId", async () => {
    const user = new User({});
    let error;

    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.fullName).toBeDefined();
    expect(error.errors.imageUrl).toBeDefined();
    expect(error.errors.clerkId).toBeDefined();
  });

  it("should enforce unique clerkId", async () => {
    const userData = {
      fullName: "Jane Doe",
      imageUrl: "http://example.com/image2.jpg",
      clerkId: "clerk123",
    };

    await new User(userData).save();

    const duplicateUser = new User(userData);
    let error;

    try {
      await duplicateUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });
});
