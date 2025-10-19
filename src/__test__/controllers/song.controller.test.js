import request from "supertest";
import express from "express";
import {
  getAllSongs,
  getFeaturedSongs,
  getMadeForYouSongs,
  getTrendingSongs,
} from "../../controllers/song.controller.js";
import { Song } from "../../models/song.model.js";
import { jest } from "@jest/globals";

const app = express();
app.use(express.json());

app.get("/songs", getAllSongs);
app.get("/songs/featured", getFeaturedSongs);
app.get("/songs/made-for-you", getMadeForYouSongs);
app.get("/songs/trending", getTrendingSongs);

describe("Song Controller", () => {
  beforeEach(async () => {
    const songs = [];
    for (let i = 1; i <= 10; i++) {
      songs.push({
        title: `Song ${i}`,
        artist: `Artist ${i}`,
        imageUrl: `http://example.com/song${i}.jpg`,
        audioUrl: `http://example.com/song${i}.mp3`,
        duration: 180 + i,
      });
    }
    await Song.insertMany(songs);
  });

  it("should get all songs sorted by createdAt descending", async () => {
    const response = await request(app).get("/songs");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(10);
    // Check if sorted by createdAt descending (newest first)
    const createdAts = response.body.map((s) =>
      new Date(s.createdAt).getTime()
    );
    const isDesc = createdAts.every(
      (t, idx, arr) => idx === 0 || t <= arr[idx - 1]
    );
    expect(isDesc).toBe(true);
  });

  it("should get featured songs (6 random)", async () => {
    const response = await request(app).get("/songs/featured");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(6);
    // Check projection (only specific fields)
    expect(response.body[0]).toHaveProperty("_id");
    expect(response.body[0]).toHaveProperty("title");
    expect(response.body[0]).toHaveProperty("artist");
    expect(response.body[0]).toHaveProperty("imageUrl");
    expect(response.body[0]).toHaveProperty("audioUrl");
    expect(response.body[0]).not.toHaveProperty("duration");
  });

  it("should get made for you songs (4 random)", async () => {
    const response = await request(app).get("/songs/made-for-you");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });

  it("should get trending songs (4 random)", async () => {
    const response = await request(app).get("/songs/trending");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });
});
