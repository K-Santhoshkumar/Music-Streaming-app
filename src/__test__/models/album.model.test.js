import { jest } from "@jest/globals";
import { Album } from "../../models/album.model.js";
import mongoose from "mongoose";

describe("Album Model", () => {
  it("should create an album successfully", async () => {
    const albumData = {
      title: "Test Album",
      artist: "Test Artist",
      imageUrl: "http://example.com/album.jpg",
      releaseYear: 2023,
    };

    const album = new Album(albumData);
    const savedAlbum = await album.save();

    expect(savedAlbum.title).toBe(albumData.title);
    expect(savedAlbum.artist).toBe(albumData.artist);
    expect(savedAlbum.imageUrl).toBe(albumData.imageUrl);
    expect(savedAlbum.releaseYear).toBe(albumData.releaseYear);
    expect(savedAlbum.songs).toEqual([]);
    expect(savedAlbum._id).toBeDefined();
    expect(savedAlbum.createdAt).toBeDefined();
    expect(savedAlbum.updatedAt).toBeDefined();
  });

  it("should require title, artist, imageUrl, and releaseYear", async () => {
    const album = new Album({});
    let error;

    try {
      await album.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.artist).toBeDefined();
    expect(error.errors.imageUrl).toBeDefined();
    expect(error.errors.releaseYear).toBeDefined();
  });

  it("should allow adding songs to album", async () => {
    const album = new Album({
      title: "Test Album",
      artist: "Test Artist",
      imageUrl: "http://example.com/album.jpg",
      releaseYear: 2023,
    });

    const savedAlbum = await album.save();
    const validObjectId = new mongoose.Types.ObjectId();
    savedAlbum.songs.push(validObjectId);
    await savedAlbum.save();

    const updatedAlbum = await Album.findById(savedAlbum._id);
    expect(updatedAlbum.songs).toContainEqual(validObjectId);
  });
});
