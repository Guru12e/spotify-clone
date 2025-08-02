"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Home,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  List,
} from "lucide-react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { trendingNew, englishSongs, madeForYou } from "@/constant/constant";
import SongsCategory from "./SongsCategory";

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const searchInputRef = useRef(null);
  const audioRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [isCurrentSong, setIsCurrentSong] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songQueue, setSongQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const songs = [...trendingNew, ...madeForYou, ...englishSongs];
  const [filteredSongs, setFilteredSongs] = useState([]);

  useEffect(() => {
    const likedSongs = localStorage.getItem("likedSongs");
    if (likedSongs) {
      const parsedSongs = JSON.parse(likedSongs);
      setLikedSongs(parsedSongs);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
      audioRef.current.volume = volume;
    }
  }, [isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const setAudioDuration = () => setDuration(audio.duration);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", setAudioDuration);
      audio.addEventListener("ended", playNextSong);
      return () => {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", setAudioDuration);
        audio.removeEventListener("ended", playNextSong);
      };
    }
  }, [isCurrentSong]);

  const handlePlaySong = (song) => {
    if (audioRef.current) {
      const songPath = `/songs/${song.title}.mp3`;
      setIsCurrentSong(song);
      const songIndex = songs.indexOf(song);
      let updatedQueue;
      if (songIndex !== -1) {
        updatedQueue = songs
          .slice(songIndex + 1)
          .concat(songs.slice(0, songIndex));
      } else {
        updatedQueue = [...songs];
      }
      setSongQueue(updatedQueue);
      audioRef.current.src = songPath;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playNextSong = () => {
    if (songQueue.length > 1) {
      const nextSong = songQueue[0];
      setSongQueue((prev) => prev.slice(1));
      handlePlaySong(nextSong);
    } else {
      setIsPlaying(false);
      setIsCurrentSong(null);
      setSongQueue([]);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredSongs([]);
    } else {
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(query.toLowerCase()) ||
          song.artist.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredSongs([]);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  return (
    <div className="h-screen bg-[#0f0e0e] text-white flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="backdrop-blur-sm flex items-center gap-5 px-4 py-2 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="w-10 aspect-square relative">
              <Image
                src="/images/logo.png"
                alt="Spotify"
                fill
                className="object-cover rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 flex items-center gap-4 justify-center w-full">
            <Link
              href="/"
              className="text-white bg-[#1a1a1a]/80 p-3 rounded-full hover:text-white font-semibold"
            >
              <Home size={24} />
            </Link>
            <div className="relative w-96">
              <input
                type="text"
                ref={searchInputRef}
                placeholder="What do you want to play?"
                className="bg-[#1a1a1a]/80 text-white rounded-full px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-white pl-10"
                onChange={handleSearchChange}
                value={searchQuery}
              />
              <Search
                size={20}
                onClick={() => searchInputRef.current?.focus()}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z" />
                  </svg>
                </button>
              )}
              {filteredSongs.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-full bg-[#181818] rounded-lg shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                  {filteredSongs.map((song, index) => (
                    <div
                      key={index}
                      onClick={() => handlePlaySong(song)}
                      className="px-4 py-2 hover:bg-[#282828] cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-10 h-10 relative">
                        <Image
                          src={`/covers/${song.title}.jpg`}
                          alt={song.title}
                          fill
                          className="object-cover rounded-full"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{song.title}</p>
                        <p className="text-xs text-gray-400">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-black/50 rounded-full px-4 py-2 text-sm font-semibold">
              Upgrade
            </button>
            {session ? (
              <div className="relative">
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="rounded-full bg-gray-800 w-10 h-10 relative flex items-center justify-center text-white font-semibold cursor-pointer"
                >
                  <Image
                    src={session.user.image || "/images/default-avatar.png"}
                    alt="User Avatar"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-max bg-[#181818] text-black rounded-lg shadow-lg">
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left p-4 px-6 cursor-pointer text-md text-gray-400 hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="bg-black/50 rounded-full px-4 py-2 text-sm font-semibold"
                onClick={() => signIn()}
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 mt-2 flex overflow-x-auto no-scrollbar">
          <div className="h-full w-1/5 bg-[#040404] flex flex-col">
            <div className="flex justify-between items-center px-6 py-2">
              <h2 className="text-md font-semibold">Your Favorites</h2>
            </div>
            {likedSongs.length > 0 ? (
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {likedSongs.map((song, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      handlePlaySong(songs.find((s) => s.title === song))
                    }
                    className="px-6 py-2 hover:bg-[#181818] cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-10 h-10 relative">
                      <Image
                        src={`/covers/${song}.jpg`}
                        alt={song}
                        fill
                        className="object-cover rounded-full"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{song}</p>
                      <p className="text-xs text-gray-400">
                        {songs
                          .filter((s) => s.title === song)
                          .map((s) => s.artist)
                          .join(", ")}
                      </p>
                    </div>
                    <Heart
                      size={20}
                      fill={likedSongs.includes(song) ? "red" : "none"}
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (likedSongs.includes(song)) {
                          setLikedSongs(likedSongs.filter((s) => s !== song));
                        } else {
                          setLikedSongs([...likedSongs, song]);
                        }
                        localStorage.setItem(
                          "likedSongs",
                          JSON.stringify(likedSongs)
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No favorite songs found</p>
              </div>
            )}
          </div>
          <div className="p-6 w-4/5 rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#121212]">
            <SongsCategory
              title="Trending Now"
              songs={trendingNew}
              handlePlaySong={handlePlaySong}
            />
            <SongsCategory
              title="Made For You"
              songs={madeForYou}
              handlePlaySong={handlePlaySong}
            />
            <SongsCategory
              title="English Hits"
              songs={englishSongs}
              handlePlaySong={handlePlaySong}
            />
          </div>
        </main>

        <footer className="bg-[#181818] border-t border-gray-800 p-4 flex items-center justify-between relative">
          <div className="flex items-center space-x-4">
            {isCurrentSong && (
              <>
                <Image
                  src={`/covers/${isCurrentSong.title}.${isCurrentSong.type}`}
                  alt="Now Playing"
                  width={56}
                  height={56}
                  className="rounded"
                />
                <div>
                  <p className="font-semibold">{isCurrentSong.title}</p>
                  <p className="text-sm text-gray-400">
                    {isCurrentSong.artist}
                  </p>
                </div>
                <Heart
                  size={20}
                  fill={
                    likedSongs.includes(isCurrentSong.title) ? "red" : "none"
                  }
                  className="text-gray-400 hover:text-white"
                  onClick={() => {
                    let updatedLikedSongs;
                    if (likedSongs.includes(isCurrentSong.title)) {
                      updatedLikedSongs = likedSongs.filter(
                        (song) => song !== isCurrentSong.title
                      );
                    } else {
                      updatedLikedSongs = [...likedSongs, isCurrentSong.title];
                    }
                    setLikedSongs(updatedLikedSongs);
                    localStorage.setItem(
                      "likedSongs",
                      JSON.stringify(updatedLikedSongs)
                    );
                  }}
                />
              </>
            )}
          </div>

          <div className="flex flex-col items-center w-1/2">
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
                </svg>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white text-black rounded-full p-2"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={playNextSong}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
                </svg>
              </button>
            </div>
            <div className="flex items-center w-full mt-2">
              <span className="text-xs text-gray-400 mr-2">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={(currentTime / duration) * 100 || 0}
                onChange={handleProgressChange}
                className="flex-1 h-1 bg-gray-600 rounded-full appearance-none caret-white cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${
                    (currentTime / duration) * 100
                  }%, #4b5563 ${(currentTime / duration) * 100}%)`,
                }}
              />
              <span className="text-xs text-gray-400 ml-2">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="text-gray-400 hover:text-white"
            >
              <List size={16} />
            </button>
            <button className="text-gray-400 hover:text-white">
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${
                  volume * 100
                }%, #4b5563 ${volume * 100}%)`,
              }}
            />
          </div>

          {showQueue && songQueue.length > 0 && (
            <div className="absolute bottom-20 right-4 bg-[#181818] rounded-lg shadow-lg p-4 w-1/3 h-[70vh] overflow-y-auto no-scrollbar">
              <h3 className="text-sm font-semibold mb-2">Queue</h3>
              {songQueue.map((song, index) => (
                <div
                  key={`${song.title}-${index}`}
                  className="flex items-center gap-2 py-1 hover:bg-[#282828] cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="text-xs text-gray-400">{index + 1}.</span>
                  <Image
                    src={`/covers/${song.title}.${song.type}`}
                    alt={song.title}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div>
                    <p className="text-xs font-semibold">{song.title}</p>
                    <p className="text-xs text-gray-400">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </footer>

        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default Hero;
