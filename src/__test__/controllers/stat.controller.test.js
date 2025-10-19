import request from "supertest";
import express from "express";
import { getStats } from "../../controllers/stat.controller.js";
import { Song } from "../../models/song.model.js";
import { Album } from "../../models/album.model.js";
import { User } from "../../models/user.model.js";
import { jest } from "@jest/globals";

const app = express();
app.use(express.json());

app.get("/stats", getStats);

describe("Stat Controller", () => {
  beforeEach(async () => {
    await Song.insertMany([
      {
        title: "Song 1",
        artist: "Artist A",
        imageUrl: "url1",
        audioUrl: "audio1",
        duration: 180,
      },
      {
        title: "Song 2",
        artist: "Artist A",
        imageUrl: "url2",
        audioUrl: "audio2",
        duration: 200,
      },
      {
        title: "Song 3",
        artist: "Artist B",
        imageUrl: "url3",
        audioUrl: "audio3",
        duration: 220,
      },
    ]);

    await Album.insertMany([
      {
        title: "Album 1",
        artist: "Artist A",
        imageUrl: "album1",
        releaseYear: 2023,
      },
      {
        title: "Album 2",
        artist: "Artist B",
        imageUrl: "album2",
        releaseYear: 2023,
      },
    ]);

    await User.insertMany([
      { clerkId: "user1", fullName: "User 1", imageUrl: "user1" },
      { clerkId: "user2", fullName: "User 2", imageUrl: "user2" },
      { clerkId: "user3", fullName: "User 3", imageUrl: "user3" },
    ]);
  });

  it("should get correct stats", async () => {
    const response = await request(app).get("/stats");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalSongs");
    expect(response.body).toHaveProperty("totalAlbums");
    expect(response.body).toHaveProperty("totalUsers");
    expect(response.body).toHaveProperty("totalArtists");

    expect(response.body.totalSongs).toBe(3);
    expect(response.body.totalAlbums).toBe(2);
    expect(response.body.totalUsers).toBe(3);
    expect(response.body.totalArtists).toBe(2); // Artist A and Artist B
  });
});
