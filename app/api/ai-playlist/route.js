import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { trendingNew, englishSongs, madeForYou } from "@/constant/constant";

const allSongs = [...trendingNew, ...madeForYou, ...englishSongs];

export async function POST(req) {
  const { prompt } = await req.json();

  const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const songList = allSongs.map((s) => ({
    title: s.title,
    artist: s.artist,
    genre: s.genre || "unknown",
    mood: s.mood || "unknown",
    actors: s.actors || "unknown",
  }));

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a music recommender. Only return an array of song titles. User wants: ${prompt} Here are all songs: ${JSON.stringify(
      songList
    )}`,
  });

  return NextResponse.json(
    JSON.parse(response.text.replace("```json", "").replace("```", "").trim())
  );
}
