import { Play } from "lucide-react";
import Image from "next/image";
import React from "react";

const SongsCategory = ({ title, songs, handlePlaySong }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar py-2">
        {songs.slice(0, 10).map((song, index) => (
          <div
            key={`${song.title}-${index}`}
            onClick={() => handlePlaySong(song)}
            className="bg-[#181818] cursor-pointer group w-[180px] relative hover:bg-[#282828] rounded-lg flex-shrink-0"
          >
            <div className="relative w-full aspect-square mb-2">
              <Image
                src={`/covers/${song.title}.${song.type}`}
                alt={song.title}
                fill
                className="rounded-t-lg object-cover"
                sizes="200px"
              />
              <div className="hidden group-hover:block absolute z-10 bottom-2 right-2">
                <button className="mt-2 bg-green-500 text-white rounded-full p-2">
                  <Play size={20} fill="white" />
                </button>
              </div>
            </div>
            <div className="px-2 pb-4">
              <h3 className="font-semibold">{song.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-1">
                {song.artist}
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">
                {song.genre} - {song.release_date}
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">{song.album}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongsCategory;
