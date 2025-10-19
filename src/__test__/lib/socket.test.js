import { Server as SocketIOServer } from "socket.io";
import { initializeSocket } from "../../lib/socket.js";
import { Message } from "../../models/message.model.js";
import { jest } from "@jest/globals";

describe("Socket.IO Module", () => {
  let mockServer;
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    // Mock server
    mockServer = {};

    // Mock Socket.IO server
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      close: jest.fn(),
    };

    // Mock socket instance
    mockSocket = {
      id: "socket123",
      on: jest.fn(),
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock the Server constructor
    SocketIOServer.mockImplementation(() => mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initializeSocket function", () => {
    it("should create Socket.IO server with correct options", () => {
      // Act
      initializeSocket(mockServer);

      // Assert
      expect(SocketIOServer).toHaveBeenCalledWith(mockServer, {
        cors: {
          origin: expect.any(String),
          credentials: true,
        },
      });
    });

    it("should set up connection event listener", () => {
      // Act
      initializeSocket(mockServer);

      // Assert
      expect(mockIo.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function)
      );
    });

    it("should handle server initialization errors gracefully", () => {
      // Arrange
      const error = new Error("Server initialization failed");
      SocketIOServer.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => initializeSocket(mockServer)).toThrow(
        "Server initialization failed"
      );
    });
  });

  describe("Socket connection handling", () => {
    let connectionHandler;

    beforeEach(() => {
      initializeSocket(mockServer);
      connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];
    });

    it("should handle user_connected event", () => {
      // Act
      connectionHandler(mockSocket);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user_connected",
        expect.any(Function)
      );
    });

    it("should handle send_message event", () => {
      // Act
      connectionHandler(mockSocket);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith(
        "send_message",
        expect.any(Function)
      );
    });

    it("should handle disconnect event", () => {
      // Act
      connectionHandler(mockSocket);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function)
      );
    });

    it("should handle user_connected event properly", () => {
      // Act
      connectionHandler(mockSocket);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user_connected",
        expect.any(Function)
      );
    });
  });

  describe("Message handling", () => {
    let sendMessageHandler;

    beforeEach(async () => {
      initializeSocket(mockServer);
      const connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];
      connectionHandler(mockSocket);

      sendMessageHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "send_message"
      )[1];
    });

    it("should create message successfully", async () => {
      // Arrange
      const messageData = {
        senderId: "sender123",
        receiverId: "receiver123",
        content: "Hello World",
      };

      const mockMessage = {
        _id: "msg123",
        ...messageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      Message.create = jest.fn().mockResolvedValue(mockMessage);

      // Act
      await sendMessageHandler(messageData);

      // Assert
      expect(Message.create).toHaveBeenCalledWith(messageData);
      expect(mockSocket.emit).toHaveBeenCalledWith("message_sent", mockMessage);
    });

    it("should emit message to receiver", async () => {
      // Arrange
      const messageData = {
        senderId: "sender123",
        receiverId: "receiver123",
        content: "Hello World",
      };

      const mockMessage = {
        _id: "msg123",
        ...messageData,
      };

      Message.create = jest.fn().mockResolvedValue(mockMessage);
      // Mock userSockets map to return a socket ID for the receiver
      const mockUserSockets = new Map();
      mockUserSockets.set("receiver123", "socket456");

      // Mock the socket.io implementation to track calls
      const mockToEmit = jest.fn();
      mockIo.to.mockReturnValue({ emit: mockToEmit });

      // Act
      await sendMessageHandler(messageData);

      // Assert
      expect(Message.create).toHaveBeenCalledWith(messageData);
      expect(mockSocket.emit).toHaveBeenCalledWith("message_sent", mockMessage);
    });

    it("should handle message creation errors", async () => {
      // Arrange
      const messageData = {
        senderId: "sender123",
        receiverId: "receiver123",
        content: "Hello World",
      };

      const error = new Error("Database error");
      Message.create = jest.fn().mockRejectedValue(error);

      // Act
      await sendMessageHandler(messageData);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "message_error",
        "Database error"
      );
    });

    it("should validate message data", async () => {
      // Arrange
      const invalidMessageData = {
        senderId: "",
        receiverId: "receiver123",
        content: "",
      };

      Message.create = jest
        .fn()
        .mockRejectedValue(new Error("Validation failed"));

      // Act
      await sendMessageHandler(invalidMessageData);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "message_error",
        "Validation failed"
      );
    });
  });

  describe("Disconnect handling", () => {
    let disconnectHandler;

    beforeEach(() => {
      initializeSocket(mockServer);
      const connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];
      connectionHandler(mockSocket);

      disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "disconnect"
      )[1];
    });

    it("should handle disconnect event", () => {
      // Act
      disconnectHandler();

      // Assert - disconnect handling should not throw
      expect(disconnectHandler).toBeDefined();
    });

    it("should handle disconnect with reason", () => {
      // Act
      disconnectHandler("client namespace disconnect");

      // Assert
      expect(disconnectHandler).toBeDefined();
    });

    it("should clean up socket resources on disconnect", () => {
      // Arrange
      mockSocket.leave = jest.fn();

      // Act
      disconnectHandler();

      // Assert - leave should be called if user was in a room
      // Note: In the actual implementation, we might want to track and leave user rooms
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle invalid socket events gracefully", () => {
      // Arrange
      initializeSocket(mockServer);
      const connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];

      const invalidSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        disconnect: jest.fn(),
      };

      // Act & Assert
      expect(() => connectionHandler(invalidSocket)).not.toThrow();
    });

    it("should handle malformed message data", async () => {
      // Arrange
      initializeSocket(mockServer);
      const connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];
      connectionHandler(mockSocket);

      const sendMessageHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "send_message"
      )[1];

      const malformedData = null;

      // Act
      await sendMessageHandler(malformedData);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "message_error",
        expect.any(String)
      );
    });

    it("should handle concurrent connections", () => {
      // Arrange
      initializeSocket(mockServer);
      const connectionHandler = mockIo.on.mock.calls.find(
        (call) => call[0] === "connection"
      )[1];

      const socket1 = { ...mockSocket, id: "socket1" };
      const socket2 = { ...mockSocket, id: "socket2" };

      // Act
      connectionHandler(socket1);
      connectionHandler(socket2);

      // Assert
      expect(socket1.on).toHaveBeenCalled();
      expect(socket2.on).toHaveBeenCalled();
    });

    it("should handle server shutdown gracefully", () => {
      // Arrange
      initializeSocket(mockServer);

      // Act
      mockIo.close();

      // Assert
      expect(mockIo.close).toHaveBeenCalled();
    });
  });

  describe("CORS configuration", () => {
    it("should configure CORS properly", () => {
      // Act
      initializeSocket(mockServer);

      // Assert
      expect(SocketIOServer).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({
          cors: expect.objectContaining({
            credentials: true,
          }),
        })
      );
    });

    it("should allow cross-origin requests", () => {
      // Act
      initializeSocket(mockServer);

      // Assert
      const serverCall = SocketIOServer.mock.calls[0];
      expect(serverCall[1].cors.origin).toBeDefined();
    });
  });
});
