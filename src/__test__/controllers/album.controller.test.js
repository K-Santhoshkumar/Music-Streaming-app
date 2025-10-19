import request from "supertest";
import express from "express";
import {
  getAllAlbums,
  getAlbumById,
} from "../../controllers/album.controller.js";
import { Album } from "../../models/album.model.js";
import { Song } from "../../models/song.model.js";
import mongoose from "mongoose";
import { jest } from "@jest/globals";

const app = express();
app.use(express.json());

app.get("/albums", getAllAlbums);
app.get("/albums/:albumId", getAlbumById);

describe("Album Controller", () => {
  let albumId;

  beforeEach(async () => {
    const album = await Album.create({
      title: "Test Album",
      artist: "Test Artist",
      imageUrl: "http://example.com/album.jpg",
      releaseYear: 2023,
    });
    albumId = album._id;

    const s1 = await Song.create({
      title: "Song 1",
      artist: "Test Artist",
      imageUrl: "http://example.com/song1.jpg",
      audioUrl: "http://example.com/song1.mp3",
      duration: 180,
      albumId: albumId,
    });
    const s2 = await Song.create({
      title: "Song 2",
      artist: "Test Artist",
      imageUrl: "http://example.com/song2.jpg",
      audioUrl: "http://example.com/song2.mp3",
      duration: 200,
      albumId: albumId,
    });
    await Album.findByIdAndUpdate(albumId, {
      $set: { songs: [s1._id, s2._id] },
    });
  });

  it("should get all albums", async () => {
    const response = await request(app).get("/albums");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("title");
    expect(response.body[0]).toHaveProperty("artist");
  });

  it("should get album by id with populated songs", async () => {
    const response = await request(app).get(`/albums/${albumId}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Test Album");
    expect(response.body.artist).toBe("Test Artist");
    expect(Array.isArray(response.body.songs)).toBe(true);
    expect(response.body.songs.length).toBe(2);
    expect(response.body.songs[0]).toHaveProperty("title");
    expect(response.body.songs[0]).toHaveProperty("artist");
  });

  it("should return 404 for non-existent album", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const response = await request(app).get(`/albums/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Album not found");
  });
});
