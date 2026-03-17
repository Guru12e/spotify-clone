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
  ChevronDown,
  SkipBack,
  SkipForwardIcon,
  Trash,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { trendingNew, englishSongs, madeForYou } from "@/constant/constant";
import { Mic, MicOff } from "lucide-react";
import SongsCategory from "./SongsCategory";

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const searchInputRef = useRef(null);
  const audioRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSongOpen, setIsSongOpen] = useState(false);
  const { data: session } = useSession();
  const [isCurrentSong, setIsCurrentSong] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songQueue, setSongQueue] = useState([]);
  const [aiPlaylists, setAiPlaylists] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [playedSongs, setPlayedSongs] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const songs = [...trendingNew, ...madeForYou, ...englishSongs];
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const likedSongs = localStorage.getItem("likedSongs");
    if (likedSongs) {
      const parsedSongs = JSON.parse(likedSongs);
      setLikedSongs(parsedSongs);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("aiPlaylists");
    if (saved) setAiPlaylists(JSON.parse(saved));
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);

        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          console.log("VOICE:", text);
          setAiPrompt(text);
          generateAIPlaylist(text);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handlePlaySong = (song) => {
    if (audioRef.current) {
      const songPath = `/songs/${song.title}.mp3`;
      setIsCurrentSong(song);
      setPlayedSongs((prev) => [...prev, song]);

      const songIndex = songs.findIndex((s) => s.title === song.title);
      let updatedQueue = [...songs];
      if (songIndex !== -1) {
        updatedQueue = [
          ...songs.slice(songIndex + 1),
          ...songs.slice(0, songIndex),
        ];
      }
      setSongQueue(updatedQueue);

      audioRef.current.src = songPath;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playNextSong = () => {
    if (songQueue.length > 0) {
      const nextSong = songQueue[0];
      setSongQueue((prev) => prev.slice(1));
      setPlayedSongs((prev) => [...prev, nextSong]);
      handlePlaySong(nextSong);
    } else {
      setIsPlaying(false);
      setIsCurrentSong(null);
      setSongQueue([]);
    }
  };

  const playPreviousSong = () => {
    if (!isCurrentSong) return;

    const currentIndex = songs.findIndex(
      (s) => s.title === isCurrentSong.title,
    );
    const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
    const previousSong = songs[previousIndex];

    setPlayedSongs((prev) => [...prev, isCurrentSong]);
    setSongQueue((prev) => [isCurrentSong, ...prev]);
    handlePlaySong(previousSong);
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

  const generateAIPlaylist = async (input = aiPrompt) => {
    const prompt = input.trim();
    if (!prompt) return;

    setLoadingAI(true);

    const res = await fetch("/api/ai-playlist", {
      method: "POST",
      body: JSON.stringify({ prompt: aiPrompt }),
    });

    const songTitles = await res.json();

    const playlistSongs = songs.filter((s) => songTitles.includes(s.title));

    if (playlistSongs.length === 0) {
      setLoadingAI(false);
      return;
    }

    const newPlaylist = {
      id: "ai_" + Date.now(),
      name: `AI Mix – ${aiPrompt}`,
      songs: playlistSongs,
    };

    let aiPlayListsSongs = [];

    aiPlayListsSongs.push(
      playlistSongs.map((s) => {
        return songs.find((song) => song.title === s.title);
      }),
    );

    const updatedPlaylists = [...aiPlaylists, newPlaylist];
    setAiPlaylists(updatedPlaylists);
    localStorage.setItem("aiPlaylists", JSON.stringify(aiPlayListsSongs));

    setSongQueue(newPlaylist.songs.slice(1));
    handlePlaySong(newPlaylist.songs[0]);

    setAiPrompt("");
    setLoadingAI(false);
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
          song.artist.toLowerCase().includes(query.toLowerCase()),
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
    <div className="h-screen relative bg-[#0f0e0e] text-white flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="backdrop-blur-sm flex items-center gap-3 px-4 py-2 sticky top-0 z-10 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="w-8 md:w-10 aspect-square relative">
              <Image
                src="/images/logo.png"
                alt="Spotify"
                fill
                className="object-cover rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 justify-center w-full">
            <div className="relative w-full md:max-w-[24rem]">
              <input
                type="text"
                ref={searchInputRef}
                placeholder="What do you want to play?"
                className="bg-[#1a1a1a]/80 text-white rounded-full px-3 py-2 md:px-4 md:py-3 w-full focus:outline-none focus:ring-2 focus:ring-white pl-8 md:pl-10 text-sm md:text-base"
                onChange={handleSearchChange}
                value={searchQuery}
              />
              <Search
                size={16}
                onClick={() => searchInputRef.current?.focus()}
                className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="md:w-4 md:h-4"
                  >
                    <path d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z" />
                  </svg>
                </button>
              )}
              {filteredSongs.length > 0 && (
                <div className="absolute top-full mt-2 md:w-full bg-[#181818] hidden md:block rounded-lg shadow-lg max-h-48 md:max-h-60 overflow-y-auto no-scrollbar">
                  {filteredSongs.map((song, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handlePlaySong(song);
                        clearSearch();
                      }}
                      className="px-3 py-1 md:px-4 md:py-2 hover:bg-[#282828] cursor-pointer flex items-center gap-2 md:gap-4"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 relative">
                        <Image
                          src={`/covers/${song.title}.${song.type}`}
                          alt={song.title}
                          fill
                          className="object-cover rounded-full"
                          sizes="(max-width: 768px) 32px, 40px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-semibold">
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-400">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {filteredSongs.length > 0 && (
              <div className="absolute md:hidden top-full mt-2 w-screen md:w-full py-3 bg-[#181818] rounded-lg shadow-lg max-h-[50vh] overflow-y-auto flex flex-col items-center no-scrollbar">
                <div className="flex-1 w-full">
                  {filteredSongs.map((song, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handlePlaySong(song);
                        clearSearch();
                      }}
                      className="px-3 py-1 w-full md:px-4 md:py-2 hover:bg-[#282828] cursor-pointer flex items-center gap-2 md:gap-4"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 relative">
                        <Image
                          src={`/covers/${song.title}.${song.type}`}
                          alt={song.title}
                          fill
                          className="object-cover rounded-full"
                          sizes="(max-width: 768px) 32px, 40px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-semibold">
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-400">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="bg-black/50 hidden md:block rounded-full px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-semibold">
              Upgrade
            </button>
            {session ? (
              <div className="relative">
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="rounded-full bg-gray-800 w-8 h-8 md:w-10 md:h-10 relative flex items-center justify-center text-white font-semibold cursor-pointer"
                >
                  <Image
                    src={session.user.image || "/images/default-avatar.png"}
                    alt="User Avatar"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-32 md:w-max bg-[#181818] text-black rounded-lg shadow-lg">
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left p-2 md:p-4 px-4 md:px-6 cursor-pointer text-xs md:text-md text-gray-400 hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="bg-black/50 rounded-full px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-semibold"
                onClick={() => signIn()}
              >
                Sign in
              </button>
            )}
          </div>
          <div className="relative w-full md:max-w-md group">
            <div
              className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 rounded-xl border border-white/10 shadow-lg 
                  focus-within:border-green-500 transition-all duration-300"
            >
              <Search size={18} className="text-gray-400" />

              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tell AI what type of playlist you want..."
                className="bg-transparent flex-1 outline-none text-sm text-white placeholder-gray-500"
              />

              {!loadingAI ? (
                <button
                  onClick={
                    aiPrompt.trim() !== ""
                      ? () => generateAIPlaylist()
                      : () => {
                          if (!recognitionRef.current)
                            return alert("Voice not supported");
                          listening
                            ? recognitionRef.current.stop()
                            : recognitionRef.current.start();
                        }
                  }
                  className="bg-green-500 hover:bg-green-400 text-black px-4 py-1 rounded-lg text-sm font-semibold"
                >
                  {aiPrompt.trim() !== "" ? (
                    <SendHorizontal size={18} />
                  ) : listening ? (
                    <Mic size={18} className="text-black" />
                  ) : (
                    <MicOff size={18} className="text-black" />
                  )}
                </button>
              ) : (
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 mt-2 flex flex-col md:flex-row overflow-x-auto no-scrollbar">
          <div className="h-auto md:h-full w-full py-5 md:w-1/5 bg-[#040404] flex flex-col">
            <div className="flex justify-between items-center px-4 md:px-6 py-2">
              <h2 className="text-3xl font-bold">Your Favorites</h2>
            </div>
            {likedSongs.length > 0 ? (
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {likedSongs.map((song, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      handlePlaySong(songs.find((s) => s.title === song))
                    }
                    className="px-4 md:px-6 py-1 md:py-2 hover:bg-[#181818] cursor-pointer flex items-center gap-2 md:gap-4"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 relative">
                      <Image
                        src={`/covers/${song}.${
                          songs.find((s) => s.title === song)?.type
                        }`}
                        alt={song}
                        fill
                        className="object-cover rounded-full"
                        sizes="(max-width: 768px) 32px, 40px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-semibold">{song}</p>
                      <p className="text-xs text-gray-400">
                        {songs
                          .filter((s) => s.title === song)
                          .map((s) => s.artist)
                          .join(", ")}
                      </p>
                    </div>
                    <Heart
                      size={16}
                      className="md:w-5 md:h-5 text-gray-400 hover:text-white"
                      fill={likedSongs.includes(song) ? "red" : "none"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (likedSongs.includes(song)) {
                          setLikedSongs(likedSongs.filter((s) => s !== song));
                        } else {
                          setLikedSongs([...likedSongs, song]);
                        }
                        localStorage.setItem(
                          "likedSongs",
                          JSON.stringify(likedSongs),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No favorite songs found</p>
              </div>
            )}
            <div className="px-6 mt-4">
              <h3 className="text-xl font-bold mb-2">AI Playlists</h3>

              {aiPlaylists.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSongQueue(p.songs.slice(1));
                    handlePlaySong(p.songs[0]);
                  }}
                  className="cursor-pointer flex gap-2 items-center bg-[#111] hover:bg-[#222] p-3 rounded-lg mb-2"
                >
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.songs?.length} songs
                    </p>
                  </div>
                  <Trash
                    size={16}
                    className="text-gray-400 w-5 h-5 hover:text-white ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedPlaylists = aiPlaylists.filter(
                        (playlist) => playlist.id !== p.id,
                      );
                      setAiPlaylists(updatedPlaylists);
                      localStorage.setItem(
                        "aiPlaylists",
                        JSON.stringify(updatedPlaylists),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 md:p-6 w-full md:w-4/5 rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#121212]">
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

        <footer className="bg-[#181818] border-t border-gray-800 p-2 md:p-4 flex flex-col md:flex-row items-center justify-between relative">
          <div className="flex md:hidden items-center py-2 w-full px-2 space-x-2 md:space-x-4 mb-2 md:mb-0">
            {isCurrentSong && !isSongOpen && (
              <div className="flex w-full justify-between cursor-pointer">
                <div
                  onClick={() => setIsSongOpen(!isSongOpen)}
                  className="flex-1 py-2 flex items-center space-x-2"
                >
                  <Image
                    src={`/covers/${isCurrentSong.title}.${isCurrentSong.type}`}
                    alt="Now Playing"
                    width={40}
                    height={40}
                    className="rounded md:w-14 md:h-14"
                  />
                  <div>
                    <p className="font-semibold text-sm md:text-base">
                      {isCurrentSong.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isCurrentSong.album}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart
                    size={20}
                    className="md:w-5 md:h-5 text-white"
                    fill={
                      likedSongs.includes(isCurrentSong.title) ? "red" : "none"
                    }
                    onClick={() => {
                      let updatedLikedSongs;
                      if (likedSongs.includes(isCurrentSong.title)) {
                        updatedLikedSongs = likedSongs.filter(
                          (song) => song !== isCurrentSong.title,
                        );
                      } else {
                        updatedLikedSongs = [
                          ...likedSongs,
                          isCurrentSong.title,
                        ];
                      }
                      setLikedSongs(updatedLikedSongs);
                      localStorage.setItem(
                        "likedSongs",
                        JSON.stringify(updatedLikedSongs),
                      );
                    }}
                  />
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white rounded-full p-1 md:p-2"
                  >
                    {isPlaying ? (
                      <Pause size={20} className="md:w-6 md:h-6" />
                    ) : (
                      <Play size={20} className="md:w-6 md:h-6" />
                    )}
                  </button>
                  <button onClick={playNextSong} className="text-white">
                    <SkipForwardIcon size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-2 md:space-x-4 mb-2 md:mb-0">
            {isCurrentSong && (
              <>
                <Image
                  src={`/covers/${isCurrentSong.title}.${isCurrentSong.type}`}
                  alt="Now Playing"
                  width={40}
                  height={40}
                  className="rounded md:w-14 md:h-14"
                />
                <div>
                  <p className="font-semibold text-sm md:text-base">
                    {isCurrentSong.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isCurrentSong.artist}
                  </p>
                </div>
                <Heart
                  size={16}
                  className="md:w-5 md:h-5 text-gray-400 hover:text-white"
                  fill={
                    likedSongs.includes(isCurrentSong.title) ? "red" : "none"
                  }
                  onClick={() => {
                    let updatedLikedSongs;
                    if (likedSongs.includes(isCurrentSong.title)) {
                      updatedLikedSongs = likedSongs.filter(
                        (song) => song !== isCurrentSong.title,
                      );
                    } else {
                      updatedLikedSongs = [...likedSongs, isCurrentSong.title];
                    }
                    setLikedSongs(updatedLikedSongs);
                    localStorage.setItem(
                      "likedSongs",
                      JSON.stringify(updatedLikedSongs),
                    );
                  }}
                />
              </>
            )}
          </div>

          <div className="hidden md:flex flex-col items-center w-full md:w-1/2">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={playPreviousSong}
                className="text-gray-400 hover:text-white"
              >
                <SkipBack size={20} className="md:w-6 md:h-6" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white text-black rounded-full p-1 md:p-2"
              >
                {isPlaying ? (
                  <Pause size={20} className="md:w-6 md:h-6" />
                ) : (
                  <Play size={20} className="md:w-6 md:h-6" />
                )}
              </button>
              <button
                onClick={playNextSong}
                className="text-gray-400 hover:text-white"
              >
                <SkipForwardIcon size={20} className="md:w-6 md:h-6" />
              </button>
            </div>
            <div className="hidden md:flex items-center w-full mt-1 md:mt-2">
              <span className="text-xs text-gray-400 mr-1 md:mr-2">
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
              <span className="text-xs text-gray-400 ml-1 md:ml-2">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="text-gray-400 hover:text-white"
            >
              <List size={14} className="md:w-4 md:h-4" />
            </button>
            <button className="text-gray-400 hover:text-white">
              {volume === 0 ? (
                <VolumeX size={14} className="md:w-4 md:h-4" />
              ) : (
                <Volume2 size={14} className="md:w-4 md:h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-16 md:w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${
                  volume * 100
                }%, #4b5563 ${volume * 100}%)`,
              }}
            />
          </div>

          {showQueue && songQueue.length > 0 && (
            <div className="absolute bottom-16 md:bottom-20 right-2 md:right-4 bg-[#181818] rounded-lg shadow-lg p-2 md:p-4 w-[90%] md:w-1/3 h-[50vh] md:h-[70vh] overflow-y-auto no-scrollbar">
              <h3 className="text-xs md:text-sm font-semibold mb-2">Queue</h3>
              {aiPlaylists.concat(songQueue).map((song, index) => (
                <div
                  key={`${song.title}-${index}`}
                  className="flex items-center gap-2 py-1 hover:bg-[#282828] cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="text-xs text-gray-400">{index + 1}.</span>
                  <Image
                    src={`/covers/${song.title}.${song.type}`}
                    alt={song.title}
                    width={24}
                    height={24}
                    className="rounded md:w-8 md:h-8"
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
      {isSongOpen && isCurrentSong && (
        <div className="fixed w-screen h-[90vh] bottom-0 flex md:hidden flex-col justify-between left-0 right-0 bg-[#181818] p-4 md:p-6 z-20">
          <ChevronDown
            size={35}
            className="text-white cursor-pointer bg-white/40 rounded-full p-1"
            onClick={() => setIsSongOpen(false)}
          />

          <div className="flex flex-col justify-center">
            <div className="flex flex-col items-center space-x-4">
              <div className="w-[35vw] mx-auto aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={`/covers/${isCurrentSong.title}.${isCurrentSong.type}`}
                  alt={isCurrentSong.title}
                  fill
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-lg font-semibold">{isCurrentSong.title}</p>
                <p className="text-md text-gray-400">{isCurrentSong.artist}</p>
                <p className="text-sm text-gray-500">
                  {isCurrentSong.album} - {isCurrentSong.release_date}
                </p>
              </div>
              <div className="w-[70vw] mx-auto flex items-center mt-12">
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
              </div>
              <div className="flex items-center justify-between mx-auto w-[70vw] mt-6">
                <span className="text-xs text-gray-400 mr-1 md:mr-2">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs text-gray-400 ml-1 md:ml-2">
                  {formatTime(duration)}
                </span>
              </div>
              <div className="flex justify-center flex-col mt-6 items-center w-[70vw] mx-auto">
                <div className="w-[70vw] items-center flex justify-between space-x-4">
                  <div className="flex-1"></div>
                  <div className="flex flex-1 items-center space-x-4">
                    <button
                      onClick={playPreviousSong}
                      className="text-gray-400 hover:text-white"
                    >
                      <SkipBack
                        size={25}
                        fill="white"
                        className="border-white"
                      />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-white text-black rounded-full p-1 md:p-2"
                    >
                      {isPlaying ? (
                        <Pause
                          size={25}
                          fill="black"
                          className="md:w-6 md:h-6"
                        />
                      ) : (
                        <Play
                          size={25}
                          fill="black"
                          className="md:w-6 md:h-6"
                        />
                      )}
                    </button>
                    <button
                      onClick={playNextSong}
                      className="text-gray-400 hover:text-white"
                    >
                      <SkipForwardIcon
                        size={25}
                        fill="white"
                        className="border-white"
                      />
                    </button>
                  </div>
                  <div className="flex-1 flex justify-end w-full">
                    <Heart
                      size={25}
                      className="text-gray-400 hover:text-white"
                      fill={
                        likedSongs.includes(isCurrentSong.title)
                          ? "red"
                          : "none"
                      }
                      onClick={() => {
                        let updatedLikedSongs;
                        if (likedSongs.includes(isCurrentSong.title)) {
                          updatedLikedSongs = likedSongs.filter(
                            (song) => song !== isCurrentSong.title,
                          );
                        } else {
                          updatedLikedSongs = [
                            ...likedSongs,
                            isCurrentSong.title,
                          ];
                        }
                        setLikedSongs(updatedLikedSongs);
                        localStorage.setItem(
                          "likedSongs",
                          JSON.stringify(updatedLikedSongs),
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-max mt-8 p-4 bg-[#282828] rounded-lg">
            <h1 className="text-white text-lg font-bold mb-4">Up Next</h1>
            <div className="space-y-2 overflow-y-auto h-[120px] no-scrollbar">
              {songQueue.length > 0 ? (
                songQueue.map((song, index) => (
                  <div
                    key={`${song.title}-${index}`}
                    onClick={() => handlePlaySong(song)}
                    className="flex items-center gap-3 p-2 hover:bg-[#383838] rounded-md cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <Image
                      src={`/covers/${song.title}.${song.type}`}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{song.title}</p>
                      <p className="text-xs text-gray-400">{song.artist}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center">
                  No songs in queue
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
