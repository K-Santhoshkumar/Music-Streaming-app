import mongoose from "mongoose";
import { connectDB } from "../../lib/db.js";
import { jest } from "@jest/globals";

describe("Database Connection Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("connectDB connects using MONGODB_URI env", async () => {
    const testUri = "mongodb://localhost:27017/testdb";
    process.env.MONGODB_URI = testUri;
    const connectSpy = jest
      .spyOn(mongoose, "connect")
      .mockResolvedValue(mongoose);
    await connectDB();
    expect(connectSpy).toHaveBeenCalledWith(testUri);
    connectSpy.mockRestore();
  });

  it("connectDB exits process on failure", async () => {
    const error = new Error("fail");
    const connectSpy = jest.spyOn(mongoose, "connect").mockRejectedValue(error);
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(() => undefined);
    await connectDB();
    expect(exitSpy).toHaveBeenCalledWith(1);
    connectSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
