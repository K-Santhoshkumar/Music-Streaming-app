import { jest } from "@jest/globals";
import { Message } from "../../models/message.model.js";

describe("Message Model", () => {
  it("should create a message successfully", async () => {
    const messageData = {
      senderId: "sender123",
      receiverId: "receiver123",
      content: "Hello World",
    };

    const message = new Message(messageData);
    const savedMessage = await message.save();

    expect(savedMessage.senderId).toBe(messageData.senderId);
    expect(savedMessage.receiverId).toBe(messageData.receiverId);
    expect(savedMessage.content).toBe(messageData.content);
    expect(savedMessage._id).toBeDefined();
    expect(savedMessage.createdAt).toBeDefined();
    expect(savedMessage.updatedAt).toBeDefined();
  });

  it("should require senderId, receiverId, and content", async () => {
    const message = new Message({});
    let error;

    try {
      await message.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.senderId).toBeDefined();
    expect(error.errors.receiverId).toBeDefined();
    expect(error.errors.content).toBeDefined();
  });
});
