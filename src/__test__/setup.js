import { jest } from "@jest/globals";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Mock external services
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock("@clerk/express", () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
  requireAuth: jest.fn((req, res, next) => {
    req.auth = { userId: "test-user-id" };
    next();
  }),
}));

// Mock Socket.IO
jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

// Increase default timeout for heavier integration tests
jest.setTimeout(120000);

// Disable MD5 check for mongodb-memory-server on Windows cache issues
process.env.MONGOMS_DISABLE_MD5_CHECK = "1";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Clean DB between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  jest.clearAllMocks();
});

// Mock external services
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    close: jest.fn(),
  })),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    clerkId: "test-clerk-id",
    fullName: "Test User",
    imageUrl: "http://example.com/test.jpg",
    ...overrides,
  }),

  createMockSong: (overrides = {}) => ({
    title: "Test Song",
    artist: "Test Artist",
    imageUrl: "http://example.com/song.jpg",
    audioUrl: "http://example.com/song.mp3",
    duration: 180,
    ...overrides,
  }),

  createMockAlbum: (overrides = {}) => ({
    title: "Test Album",
    artist: "Test Artist",
    imageUrl: "http://example.com/album.jpg",
    releaseYear: 2023,
    songs: [],
    ...overrides,
  }),

  createMockMessage: (overrides = {}) => ({
    senderId: "sender-id",
    receiverId: "receiver-id",
    content: "Test message",
    ...overrides,
  }),

  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    auth: { userId: "test-user-id" },
    files: {},
    ...overrides,
  }),

  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  createMockNext: () => jest.fn(),
};
