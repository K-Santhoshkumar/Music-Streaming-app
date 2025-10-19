import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import {
  createSong,
  deleteSong,
  createAlbum,
  deleteAlbum,
  checkAdmin,
} from "../../controllers/admin.controller.js";
import { Song } from "../../models/song.model.js";
import { Album } from "../../models/album.model.js";
import cloudinary from "../../lib/cloudinary.js";

const app = express();
app.use(express.json());

// Mock file upload middleware
app.use((req, res, next) => {
  req.files = {
    audioFile: { tempFilePath: "/tmp/audio.mp3" },
    imageFile: { tempFilePath: "/tmp/image.jpg" },
  };
  next();
});

// Mock auth middleware for admin
app.use((req, res, next) => {
  req.auth = { userId: "adminUserId" };
  next();
});

app.post("/admin/songs", createSong);
app.delete("/admin/songs/:id", deleteSong);
app.post("/admin/albums", createAlbum);
app.delete("/admin/albums/:id", deleteAlbum);
app.get("/admin/check", checkAdmin);

describe("Admin Controller", () => {
  let albumId;

  beforeEach(async () => {
    const album = await Album.create({
      title: "Test Album",
      artist: "Test Artist",
      imageUrl: "http://example.com/album.jpg",
      releaseYear: 2023,
    });
    albumId = album._id;
  });

  it("should create a song", async () => {
    const songData = {
      title: "New Song",
      artist: "New Artist",
      albumId: albumId.toString(),
      duration: 180,
    };

    // Mock cloudinary upload
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "http://cloudinary.com/uploaded",
    });

    const response = await request(app).post("/admin/songs").send(songData);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("New Song");
    expect(response.body.artist).toBe("New Artist");

    // Check if song was added to album
    const updatedAlbum = await Album.findById(albumId);
    expect(updatedAlbum.songs.length).toBe(1);
  });

  it("should delete a song", async () => {
    const song = await Song.create({
      title: "Song to Delete",
      artist: "Artist",
      imageUrl: "http://example.com/song.jpg",
      audioUrl: "http://example.com/song.mp3",
      duration: 180,
      albumId: albumId,
    });

    const response = await request(app).delete(`/admin/songs/${song._id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Song deleted successfully");

    const deletedSong = await Song.findById(song._id);
    expect(deletedSong).toBeNull();

    // Check if song was removed from album
    const updatedAlbum = await Album.findById(albumId);
    expect(updatedAlbum.songs.length).toBe(0);
  });

  it("should create an album", async () => {
    const albumData = {
      title: "New Album",
      artist: "New Artist",
      releaseYear: 2024,
    };

    // Mock cloudinary upload
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "http://cloudinary.com/album",
    });

    const response = await request(app).post("/admin/albums").send(albumData);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("New Album");
    expect(response.body.artist).toBe("New Artist");
  });

  it("should delete an album and its songs", async () => {
    await Song.create({
      title: "Song in Album",
      artist: "Artist",
      imageUrl: "http://example.com/song.jpg",
      audioUrl: "http://example.com/song.mp3",
      duration: 180,
      albumId: albumId,
    });

    const response = await request(app).delete(`/admin/albums/${albumId}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Album deleted successfully");

    const deletedAlbum = await Album.findById(albumId);
    expect(deletedAlbum).toBeNull();

    const songsInAlbum = await Song.find({ albumId: albumId });
    expect(songsInAlbum.length).toBe(0);
  });

  it("should check admin status", async () => {
    const response = await request(app).get("/admin/check");

    expect(response.status).toBe(200);
    expect(response.body.admin).toBe(true);
  });
});
