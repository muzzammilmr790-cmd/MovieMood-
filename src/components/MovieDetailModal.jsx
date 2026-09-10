import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTION = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const STREAM_SERVERS = [
  {
    id: 'vidsrc_pm',
    name: 'Server 1',
    label: 'VidSrc PM',
    badge: 'HD 1080p (Fast)',
    getUrl: (id) => `https://vidsrc.pm/embed/movie/${id}`,
  },
  {
    id: 'autoembed',
    name: 'Server 2',
    label: 'AutoEmbed Co',
    badge: 'Multi-Subtitles (CC)',
    getUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
  },
  {
    id: 'vidsrc_su',
    name: 'Server 3',
    label: 'VidSrc SU',
    badge: 'Mirror',
    getUrl: (id) => `https://vidsrc.su/embed/movie/${id}`,
  },
];

const MovieDetailModal = ({ movieId, onClose, onSelectMovie }) => {
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaMode, setMediaMode] = useState('backdrop'); // 'backdrop' | 'trailer' | 'stream'
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  useEffect(() => {
    if (!movieId) return;
    setMediaMode('backdrop');
    setSelectedServerIndex(0);

    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const endpoint = `${API_BASE_URL}/movie/${movieId}?append_to_response=videos,credits,recommendations,similar`;
        const response = await fetch(endpoint, API_OPTION);

        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }

        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error(`Error fetching movie details:`, error);
        setErrorMessage('Unable to load movie details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  // Handle ESC key to close modal & lock background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!movieId) return null;

  // Videos & Trailer
  const videos = movie?.videos?.results || [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip')) ||
    videos.find((v) => v.site === 'YouTube');

  // Filter Crew
  const crew = movie?.credits?.crew || [];
  const getUniqueCrewNames = (filterFn) => {
    const matched = crew.filter(filterFn);
    const uniqueNames = [];
    const seen = new Set();
    for (const member of matched) {
      if (!seen.has(member.name)) {
        seen.add(member.name);
        uniqueNames.push(member.name);
      }
    }
    return uniqueNames;
  };

  const directors = getUniqueCrewNames((c) => c.job === 'Director');
  const writers = getUniqueCrewNames((c) => ['Screenplay', 'Writer', 'Story', 'Co-Writer'].includes(c.job));
  const producers = getUniqueCrewNames((c) => ['Producer', 'Executive Producer'].includes(c.job)).slice(0, 3);
  const composers = getUniqueCrewNames((c) => ['Original Music Composer', 'Music', 'Music Director'].includes(c.job));

  // Cast members (top 12)
  const cast = movie?.credits?.cast?.slice(0, 12) || [];

  // Recommendations & Similar movies
  const recommendations = (movie?.recommendations?.results?.length > 0
    ? movie.recommendations.results
    : movie?.similar?.results || []
  ).filter((m) => m.poster_path).slice(0, 8);

  const formatRuntime = (mins) => {
    if (!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-dark-100 border border-light-100/10 shadow-2xl text-white hide-scrollbar my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 size-10 rounded-full bg-primary/80 hover:bg-primary text-light-100 hover:text-white flex items-center justify-center border border-light-100/20 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <Spinner />
            <p className="text-light-200 font-medium animate-pulse">Loading movie details...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-10 text-center space-y-4">
            <p className="text-red-400 text-lg font-medium">{errorMessage}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : movie && (
          <div className="flex flex-col">
            {/* Hero Media Section (Streaming Player, Trailer Player, or Backdrop Hero) */}
            {mediaMode === 'stream' ? (
              <div className="flex flex-col bg-black rounded-t-2xl overflow-hidden border-b border-light-100/10">
                {/* Streaming Server Selector Header */}
                <div className="bg-primary/95 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-light-100/10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-light-100">
                      Select Server:
                    </span>
                  </div>

                  {/* Server Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {STREAM_SERVERS.map((server, idx) => {
                      const isActive = selectedServerIndex === idx;
                      return (
                        <button
                          key={server.id}
                          onClick={() => setSelectedServerIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-white/30 scale-105'
                              : 'bg-dark-100 hover:bg-dark-100/80 text-light-200 hover:text-white border border-light-100/15'
                          }`}
                        >
                          <span>{server.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-sm font-medium ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-primary text-light-200'
                            }`}
                          >
                            {server.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Video Stream Iframe */}
                <div className="relative w-full aspect-video max-h-[460px] bg-black flex items-center justify-center">
                  <iframe
                    key={`stream-${selectedServerIndex}-${movieId}`}
                    src={STREAM_SERVERS[selectedServerIndex].getUrl(movieId)}
                    title={`${movie.title} Stream`}
                    className="w-full h-full border-0 relative z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Stream Bottom Control / Tips Bar */}
                <div className="bg-primary/90 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-light-100/10">
                  <div className="flex items-center gap-2 text-xs text-light-200 font-medium">
                    <svg className="size-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>💡 <b>Subtitles (CC):</b> Click the red 💬 speech bubble icon inside the player to choose subtitles in your language.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={STREAM_SERVERS[selectedServerIndex].getUrl(movieId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105"
                    >
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </a>

                    {trailer && (
                      <button
                        onClick={() => setMediaMode('trailer')}
                        className="bg-dark-100 hover:bg-dark-100/80 text-light-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-light-100/20 hover:border-red-500/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <svg className="size-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                        Trailer
                      </button>
                    )}
                    <button
                      onClick={() => setMediaMode('backdrop')}
                      className="bg-dark-100 hover:bg-dark-100/80 text-light-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-light-100/20 hover:border-purple-400/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Backdrop
                    </button>
                  </div>
                </div>
              </div>
            ) : mediaMode === 'trailer' && trailer ? (
              <div>
                <div className="relative w-full aspect-video max-h-[440px] bg-black overflow-hidden rounded-t-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
                    title={`${movie.title} Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                {/* Control bar beneath trailer */}
                <div className="bg-primary/90 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-light-100/10">
                  <span className="text-xs text-light-200 flex items-center gap-1.5 font-medium">
                    <svg className="size-4 text-red-500 fill-current" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                    Official Trailer
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMediaMode('stream')}
                      className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-400/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/30 hover:scale-105"
                    >
                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Stream Movie
                    </button>
                    <button
                      onClick={() => setMediaMode('backdrop')}
                      className="bg-dark-100 hover:bg-dark-100/80 text-light-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-light-100/20 hover:border-purple-400/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View Backdrop
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-72 sm:h-88 md:h-96 overflow-hidden rounded-t-2xl group">
                {movie.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280/${movie.backdrop_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-b from-[#1a1836] to-dark-100 flex items-center justify-center">
                    <span className="text-light-200 text-lg">No Backdrop Image Available</span>
                  </div>
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-linear-to-t from-dark-100 via-dark-100/50 to-transparent" />
                <div className="absolute inset-0 bg-black/30 backdrop-brightness-90" />

                {/* Hero Action Buttons in Center of Backdrop */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 gap-3.5">
                  {/* Primary: Stream Full Movie */}
                  <button
                    onClick={() => setMediaMode('stream')}
                    className="group/btn relative flex items-center gap-3 px-6 py-3 rounded-full bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-2xl shadow-purple-600/50 border border-white/30 hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-hidden"
                  >
                    <span className="absolute -inset-1 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 opacity-70 blur-md group-hover/btn:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative size-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="size-4.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="relative tracking-wide">Stream Movie Now</span>
                  </button>

                  {/* Secondary: Watch Trailer */}
                  {trailer && (
                    <button
                      onClick={() => setMediaMode('trailer')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-light-100/25 hover:border-red-500/50 text-light-100 hover:text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <svg className="size-4 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                      Watch Official Trailer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Movie Title & Quick Info Header */}
            <div className="p-6 sm:p-8 pb-0 flex flex-col sm:flex-row gap-5 items-start sm:items-center border-b border-light-100/10">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                    : '/no-movie.png'
                }
                alt={movie.title}
                className="w-24 sm:w-28 rounded-xl shadow-2xl border-2 border-light-100/20 shrink-0"
              />
              <div className="flex-1 space-y-2">
                {movie.tagline && (
                  <p className="text-light-200 italic text-sm sm:text-base font-medium drop-shadow-sm">
                    "{movie.tagline}"
                  </p>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-100 font-medium">
                  {movie.release_date && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md text-white border border-light-100/10">
                      {movie.release_date.split('-')[0]}
                    </span>
                  )}
                  {movie.runtime > 0 && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md text-white border border-light-100/10">
                      {formatRuntime(movie.runtime)}
                    </span>
                  )}
                  {movie.original_language && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md uppercase text-light-100 border border-light-100/10">
                      {movie.original_language}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-md">
                    <img src="star.svg" alt="Rating" className="size-4" />
                    <span className="text-yellow-400 font-bold">
                      {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                    {movie.vote_count > 0 && (
                      <span className="text-gray-400 text-xs">
                        ({movie.vote_count.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMediaMode('stream');
                      const modalEl = document.querySelector('.hide-scrollbar');
                      if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md ${
                      mediaMode === 'stream'
                        ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white ring-1 ring-white/30'
                        : 'bg-indigo-600/80 hover:bg-indigo-600 text-white hover:scale-105'
                    }`}
                  >
                    <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{mediaMode === 'stream' ? 'Now Playing Stream' : 'Stream Full Movie'}</span>
                  </button>

                  {trailer && (
                    <button
                      onClick={() => {
                        setMediaMode('trailer');
                        const modalEl = document.querySelector('.hide-scrollbar');
                        if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                        mediaMode === 'trailer'
                          ? 'bg-red-600/90 text-white border-red-500'
                          : 'bg-dark-100 hover:bg-dark-100/80 text-light-100 border-light-100/20 hover:border-red-500/40 hover:scale-105'
                      }`}
                    >
                      <svg className="size-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                      <span>{mediaMode === 'trailer' ? 'Playing Trailer' : 'Trailer'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Genres */}
              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-purple-900/50 to-indigo-900/50 text-light-100 border border-purple-500/30 shadow-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview / Storyline */}
              {movie.overview && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    Storyline
                  </h3>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Key Crew Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                  Key Crew
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {directors.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Director</p>
                      <p className="text-sm font-bold text-white mt-1">{directors.join(', ')}</p>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Screenplay / Story</p>
                      <p className="text-sm font-bold text-white mt-1">{writers.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                  {producers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Producer(s)</p>
                      <p className="text-sm font-bold text-white mt-1">{producers.join(', ')}</p>
                    </div>
                  )}
                  {composers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Music Composer</p>
                      <p className="text-sm font-bold text-white mt-1">{composers.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cast & Characters Section */}
              {cast.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    Top Cast
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 hide-scrollbar">
                    {cast.map((actor) => (
                      <div
                        key={actor.id || actor.name}
                        className="flex flex-col items-center text-center min-w-[100px] max-w-[110px] shrink-0 group"
                      >
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-light-100/20 group-hover:border-purple-400 transition-all duration-200 shadow-md bg-primary/80">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${actor.profile_path}`}
                              alt={actor.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-100 text-light-200 text-xs font-bold">
                              {actor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white mt-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {actor.name}
                        </p>
                        <p className="text-[11px] text-gray-100 line-clamp-2 mt-0.5 leading-tight">
                          {actor.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations & Similar Movies Section */}
              {recommendations.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                    Recommended & Similar Movies
                  </h3>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => onSelectMovie && onSelectMovie(rec.id)}
                        className="group relative cursor-pointer bg-primary/70 rounded-xl p-2.5 border border-light-100/5 hover:border-purple-500/50 hover:bg-primary transition-all duration-300 hover:scale-[1.03] shadow-md flex flex-col justify-between"
                      >
                        <div className="relative aspect-2/3 rounded-lg overflow-hidden mb-2">
                          <img
                            src={`https://image.tmdb.org/t/p/w342/${rec.poster_path}`}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold text-yellow-400">
                            <img src="star.svg" alt="star" className="size-3" />
                            <span>{rec.vote_average ? rec.vote_average.toFixed(1) : 'N/A'}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {rec.title}
                          </p>
                          <p className="text-[11px] text-gray-100 mt-0.5">
                            {rec.release_date ? rec.release_date.split('-')[0] : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailModal;
