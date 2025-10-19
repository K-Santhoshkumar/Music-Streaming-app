import { jest } from "@jest/globals";
import { Song } from "../../models/song.model.js";
import mongoose from "mongoose";

describe("Song Model", () => {
  it("should create a song successfully", async () => {
    const songData = {
      title: "Test Song",
      artist: "Test Artist",
      imageUrl: "http://example.com/song.jpg",
      audioUrl: "http://example.com/song.mp3",
      duration: 180,
    };

    const song = new Song(songData);
    const savedSong = await song.save();

    expect(savedSong.title).toBe(songData.title);
    expect(savedSong.artist).toBe(songData.artist);
    expect(savedSong.imageUrl).toBe(songData.imageUrl);
    expect(savedSong.audioUrl).toBe(songData.audioUrl);
    expect(savedSong.duration).toBe(songData.duration);
    expect(savedSong.albumId).toBeUndefined();
    expect(savedSong._id).toBeDefined();
    expect(savedSong.createdAt).toBeDefined();
    expect(savedSong.updatedAt).toBeDefined();
  });

  it("should require title, artist, imageUrl, audioUrl, and duration", async () => {
    const song = new Song({});
    let error;

    try {
      await song.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.artist).toBeDefined();
    expect(error.errors.imageUrl).toBeDefined();
    expect(error.errors.audioUrl).toBeDefined();
    expect(error.errors.duration).toBeDefined();
  });

  it("should allow optional albumId", async () => {
    const validObjectId = new mongoose.Types.ObjectId();
    const songData = {
      title: "Test Song",
      artist: "Test Artist",
      imageUrl: "http://example.com/song.jpg",
      audioUrl: "http://example.com/song.mp3",
      duration: 180,
      albumId: validObjectId,
    };

    const song = new Song(songData);
    const savedSong = await song.save();

    expect(savedSong.albumId.toString()).toBe(validObjectId.toString());
  });
});
