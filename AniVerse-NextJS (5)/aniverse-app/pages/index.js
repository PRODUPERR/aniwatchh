import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── AniList GraphQL ───────────────────────────────────────────
const AL = 'https://graphql.anilist.co';
async function ql(query, variables = {}) {
  const r = await fetch(AL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(r.status);
  const j = await r.json();
  if (j.errors) throw new Error(j.errors[0].message);
  return j.data;
}
function alMap(m) {
  return {
    id: m.id, mal: m.idMal || null,
    title: m.title?.english || m.title?.romaji || 'Unknown',
    img: m.coverImage?.extraLarge || m.coverImage?.large || '',
    banner: m.bannerImage || '',
    score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
    format: m.format || 'TV',
    genres: m.genres || [],
    eps: m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes || 0,
    desc: m.description ? m.description.replace(/<[^>]+>/g, '') : '',
    status: m.status || '',
    season: m.season || '',
    year: m.seasonYear || '',
    studios: m.studios?.nodes?.[0]?.name || '',
  };
}

// ─── Seed data (fallback when APIs unavailable) ────────────────
const SEED = [
  { id: 16498, mal: 14782, title: 'Attack on Titan', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C3jRxJGAIfJi.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg', score: '8.9', format: 'TV', genres: ['Action', 'Drama', 'Fantasy'], eps: 25, desc: 'In a world where humanity hides behind enormous walls from man-eating giants, a young soldier vows revenge after watching his mother get devoured.', status: 'FINISHED', hiSlug: 'attack-on-titan-112' },
  { id: 1535, mal: 1535, title: 'Death Note', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhzos9B3.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535-oe5RoqzqnXqr.jpg', score: '8.7', format: 'TV', genres: ['Mystery', 'Psychological', 'Thriller'], eps: 37, desc: 'A high school prodigy finds a supernatural notebook that kills anyone whose name is written in it, sparking a deadly battle of wits with a genius detective.', status: 'FINISHED', hiSlug: 'death-note-60' },
  { id: 5114, mal: 5114, title: 'Fullmetal Alchemist: Brotherhood', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-m6AOBbJMSPVX.jpg', score: '9.1', format: 'TV', genres: ['Action', 'Adventure', 'Drama', 'Fantasy'], eps: 64, desc: 'Two brothers search for the Philosopher\'s Stone to restore their bodies after a forbidden alchemy ritual goes catastrophically wrong.', status: 'FINISHED', hiSlug: 'fullmetal-alchemist-brotherhood-421' },
  { id: 101922, mal: 38000, title: 'Demon Slayer', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-j4p7fy1RRcbS.jpg', score: '8.7', format: 'TV', genres: ['Action', 'Fantasy', 'Historical'], eps: 26, desc: 'A gentle boy becomes a demon slayer after his family is slaughtered and his sister is transformed into a demon.', status: 'RELEASING', hiSlug: 'demon-slayer-kimetsu-no-yaiba-47' },
  { id: 113415, mal: 40748, title: 'Jujutsu Kaisen', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-USBtAoPY5bDE.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-q2wjEh1WPSKd.jpg', score: '8.7', format: 'TV', genres: ['Action', 'Fantasy', 'Horror'], eps: 24, desc: 'A teenager swallows a cursed talisman and becomes host to a powerful cursed spirit, forcing him into the world of jujutsu sorcerers.', status: 'RELEASING', hiSlug: 'jujutsu-kaisen-1530' },
  { id: 9253, mal: 9253, title: 'Steins;Gate', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-6lfSMnpADPJI.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/9253-UhRBNnNyeHy9.jpg', score: '9.0', format: 'TV', genres: ['Drama', 'Sci-Fi', 'Thriller'], eps: 24, desc: 'A self-proclaimed mad scientist accidentally discovers time travel and must prevent an apocalyptic future while saving those he loves.', status: 'FINISHED', hiSlug: 'steinsgate-3' },
  { id: 11757, mal: 11757, title: 'Sword Art Online', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-hZBsNUU7q6Ns.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11757-Wr6F3R0LVWRV.jpg', score: '7.2', format: 'TV', genres: ['Action', 'Adventure', 'Fantasy', 'Romance'], eps: 25, desc: 'Ten thousand players are trapped inside a VR fantasy MMO where dying in the game means dying in real life.', status: 'FINISHED', hiSlug: 'sword-art-online-159' },
  { id: 99423, mal: 37521, title: 'Vinland Saga', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99423-ARv4Jo3cMlKl.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/99423-iuIF62W7UwQF.jpg', score: '8.8', format: 'TV', genres: ['Action', 'Adventure', 'Historical'], eps: 24, desc: 'A young Viking warrior seeks revenge against the man who murdered his father, entangled in a brutal war for England.', status: 'FINISHED', hiSlug: 'vinland-saga-534' },
  { id: 11061, mal: 11061, title: 'Hunter x Hunter', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-oOKQ7qRhN1JA.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-gEiaNMLDfRhK.jpg', score: '9.0', format: 'TV', genres: ['Action', 'Adventure', 'Fantasy'], eps: 148, desc: 'A boy raised in the wild sets out to find his absent Hunter father, uncovering a dangerous world of monsters, treasure, and human darkness.', status: 'FINISHED', hiSlug: 'hunter-x-hunter-2011-426' },
  { id: 21, mal: 21, title: 'One Piece', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YcayjoPhtGiC.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg', score: '8.7', format: 'TV', genres: ['Action', 'Adventure', 'Comedy'], eps: 1100, desc: 'Monkey D. Luffy and his pirate crew journey across the Grand Line searching for the ultimate treasure — the One Piece.', status: 'RELEASING', hiSlug: 'one-piece-100' },
  { id: 20, mal: 20, title: 'Naruto', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-NarutoKV.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20-CmJBLJPOKvsb.jpg', score: '7.9', format: 'TV', genres: ['Action', 'Adventure', 'Fantasy'], eps: 220, desc: 'An orphaned ninja carrying a demon fox sealed inside him trains relentlessly to become the strongest Hokage his village has ever seen.', status: 'FINISHED', hiSlug: 'naruto-1568' },
  { id: 154587, mal: 52991, title: "Frieren: Beyond Journey's End", img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-PBsLR3r4IzQj.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-J6VhB5R5MkRg.jpg', score: '9.1', format: 'TV', genres: ['Adventure', 'Drama', 'Fantasy', 'Slice of Life'], eps: 28, desc: 'An elven mage who outlived her companions slowly learns to value the fleeting but precious nature of human bonds.', status: 'FINISHED', hiSlug: 'frieren-beyond-journeys-end-18503' },
  { id: 140960, mal: 50265, title: 'Spy x Family', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-MeT19VFWbSEY.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-g6TJmSSyBRMV.jpg', score: '8.5', format: 'TV', genres: ['Action', 'Comedy', 'Slice of Life'], eps: 25, desc: 'A spy assembles a fake family for a critical mission — unaware his adoptive daughter is a telepath and his wife is an assassin.', status: 'FINISHED', hiSlug: 'spy-x-family-17840' },
  { id: 918, mal: 918, title: 'Gintama', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-eSBaOOzSGCLo.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/918-WJz5Hy0HlxW9.jpg', score: '9.0', format: 'TV', genres: ['Action', 'Comedy', 'Sci-Fi'], eps: 201, desc: 'A lazy samurai does odd jobs in an alien-occupied feudal Japan — a non-stop riot of parody, action, and surprisingly touching moments.', status: 'FINISHED', hiSlug: 'gintama-356' },
  { id: 127230, mal: 44511, title: 'Chainsaw Man', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-OyOsXqXfLvS9.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-RFQdtJpzPeyD.jpg', score: '8.5', format: 'TV', genres: ['Action', 'Horror', 'Supernatural'], eps: 12, desc: 'A destitute young man merges with his devil-dog and joins a government squad hunting fiends in a visceral, unpredictable world.', status: 'FINISHED', hiSlug: 'chainsaw-man-17249' },
  { id: 21827, mal: 33352, title: 'Violet Evergarden', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21827-saVdS5LFZHMH.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21827-p6bYdM40WEcb.jpg', score: '8.7', format: 'TV', genres: ['Drama', 'Fantasy', 'Slice of Life'], eps: 13, desc: 'A former soldier who lost her arms becomes an Auto Memory Doll, writing letters for others and slowly learning the meaning of the last words spoken to her.', status: 'FINISHED', hiSlug: 'violet-evergarden-4399' },
  { id: 1, mal: 1, title: 'Cowboy Bebop', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJNtP.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-T3PJUjFJyYTi.jpg', score: '8.7', format: 'TV', genres: ['Action', 'Drama', 'Sci-Fi'], eps: 26, desc: 'A ragtag crew of bounty hunters drift through a future solar system on the spaceship Bebop, each haunted by their unresolved past.', status: 'FINISHED', hiSlug: 'cowboy-bebop-12' },
  { id: 30, mal: 30, title: 'Neon Genesis Evangelion', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx30-Zqb8GUvCMNwb.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/30-IsuQmfLEyR9J.jpg', score: '8.2', format: 'TV', genres: ['Action', 'Mecha', 'Psychological'], eps: 26, desc: 'Traumatized teenagers pilot colossal mechs against interdimensional monsters while the organization controlling them pursues a hidden agenda.', status: 'FINISHED', hiSlug: 'neon-genesis-evangelion-510' },
  { id: 20958, mal: 22319, title: 'Tokyo Ghoul', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20958-Nt7njFRTfWKx.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20958-j3Bc6WMnVGMW.jpg', score: '7.6', format: 'TV', genres: ['Action', 'Drama', 'Horror'], eps: 12, desc: 'A college student is transformed into a half-ghoul after a fatal encounter and must navigate a terrifying hidden world.', status: 'FINISHED', hiSlug: 'tokyo-ghoul-1374' },
  { id: 97940, mal: 34572, title: 'Black Clover', img: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-B8oDWCTGBDJD.jpg', banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/97940-LGBf3jdBLkMb.jpg', score: '7.9', format: 'TV', genres: ['Action', 'Adventure', 'Fantasy'], eps: 170, desc: 'A boisterous orphan born without magic in a magic-filled world refuses to give up on his dream of becoming the Wizard King.', status: 'FINISHED', hiSlug: 'black-clover-9060' },
];

const AM = {};
SEED.forEach(a => AM[a.id] = a);

const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Isekai','Mecha','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];

// ─── Utility ──────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slugify = t => t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
function useLocalStorage(key, def) {
  const [v, setV] = useState(() => {
    if (typeof window === 'undefined') return def;
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  const set = useCallback(val => { setV(val); try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key]);
  return [v, set];
}

export default function Home() {
  // ── Core state ──
  const [page, setPage] = useState('home'); // home | watch
  const [hero, setHero] = useState(SEED[0]);
  const [trending, setTrending] = useState(SEED.slice(0, 8));
  const [seasonal, setSeasonal] = useState(SEED.slice(3, 9));
  const [popular, setPopular] = useState(SEED.slice(0, 8));
  const [topRanked, setTopRanked] = useState(SEED.slice(0, 10));
  const [schedule, setSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeGenre, setActiveGenre] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // ── Watch state ──
  const [curAnime, setCurAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [curEp, setCurEp] = useState(null);
  const [sdMode, setSdMode] = useState('sub');
  const [server, setServer] = useState('hd-1');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [subtitles, setSubtitles] = useState([]);
  const [epSearch, setEpSearch] = useState('');
  const [chunkIdx, setChunkIdx] = useState(0);
  const [epFetching, setEpFetching] = useState(false);

  // ── User data ──
  const [watchlist, setWatchlist] = useLocalStorage('av_wl', []);
  const [continueW, setContinueW] = useLocalStorage('av_cw', []);
  const [watchedEps, setWatchedEps] = useLocalStorage('av_watched', {});
  const [comments, setComments] = useLocalStorage('av_comments', {});
  const [commentInput, setCommentInput] = useState('');

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const searchTimer = useRef(null);

  // ── Scroll handler ──
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // ── Load live AniList data ──
  useEffect(() => {
    loadHome();
  }, []);

  // ── HLS player ──
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const load = async () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setStreamError('Stream failed — try another server'); });
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.src = streamUrl;
        videoRef.current.play().catch(() => {});
      }
    };
    load();
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [streamUrl]);

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────
  async function loadHome() {
    try {
      const d = await ql(`{
        Page(page:1,perPage:16){
          media(sort:TRENDING_DESC,type:ANIME,status_not:NOT_YET_RELEASED){
            id idMal title{romaji english} coverImage{large extraLarge} bannerImage
            averageScore episodes format genres nextAiringEpisode{episode}
            status season seasonYear
          }
        }
      }`);
      const live = d.Page.media.map(alMap);
      live.forEach(a => AM[a.id] = { ...AM[a.id], ...a });
      setHero(live[0]);
      setTrending(live.slice(0, 8));
      // desc for hero
      loadDesc(live[0].id);
    } catch(e) {}

    try {
      const mo = ['WINTER','WINTER','SPRING','SPRING','SPRING','SUMMER','SUMMER','SUMMER','FALL','FALL','FALL','WINTER'];
      const s = mo[new Date().getMonth()], y = new Date().getFullYear();
      const d = await ql(`{Page(page:1,perPage:8){media(season:${s},seasonYear:${y},sort:POPULARITY_DESC,type:ANIME){id idMal title{romaji english} coverImage{large} bannerImage averageScore episodes format genres nextAiringEpisode{episode} status}}}`);
      const l = d.Page.media.map(alMap); l.forEach(a => AM[a.id] = { ...AM[a.id], ...a }); setSeasonal(l);
    } catch(e) {}

    try {
      const d = await ql(`{Page(page:1,perPage:8){media(sort:POPULARITY_DESC,type:ANIME){id idMal title{romaji english} coverImage{large} averageScore episodes format genres status}}}`);
      const l = d.Page.media.map(alMap); l.forEach(a => AM[a.id] = { ...AM[a.id], ...a }); setPopular(l);
    } catch(e) {}

    try {
      const d = await ql(`{Page(page:1,perPage:10){media(sort:SCORE_DESC,type:ANIME){id idMal title{romaji english} coverImage{large} averageScore genres status}}}`);
      const l = d.Page.media.map(alMap); l.forEach(a => AM[a.id] = { ...AM[a.id], ...a }); setTopRanked(l);
    } catch(e) {}

    // Schedule
    try {
      const d = await ql(`{Page(page:1,perPage:50){airingSchedules(notYetAired:false,sort:TIME_DESC){airingAt episode media{id title{romaji english}}}}}`);
      const bd = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
      (d?.Page?.airingSchedules||[]).forEach(s => { const day = new Date(s.airingAt*1000).getDay(); if(bd[day].length < 5) bd[day].push(s); });
      setSchedule(bd);
    } catch(e) { setSchedule(null); }
  }

  async function loadDesc(id) {
    try {
      const d = await ql(`{Media(id:${id}){description idMal}}`);
      if (d?.Media?.description) {
        const txt = d.Media.description.replace(/<[^>]+>/g,'').slice(0,280)+'...';
        setHero(prev => ({ ...prev, desc: txt }));
        if (AM[id]) AM[id].desc = txt;
      }
    } catch(e) {}
  }

  // ─────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────
  function handleSearchChange(val) {
    setSearchQuery(val);
    if (!val || val.length < 2) { setSearchResults([]); setShowSearch(false); return; }
    const local = SEED.filter(a => a.title.toLowerCase().includes(val.toLowerCase())).slice(0,4);
    setSearchResults(local);
    setShowSearch(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const d = await ql(`{Page(page:1,perPage:6){media(search:${JSON.stringify(val)},type:ANIME,sort:POPULARITY_DESC){id idMal title{romaji english} coverImage{medium} format episodes averageScore}}}`);
        const res = d.Page.media.map(m => ({ id:m.id, mal:m.idMal, title:m.title.english||m.title.romaji, img:m.coverImage?.medium||'', format:m.format, eps:m.episodes, score:m.averageScore?(m.averageScore/10).toFixed(1):null, genres:[] }));
        res.forEach(a => AM[a.id] = { ...AM[a.id], ...a });
        setSearchResults(res);
      } catch(e) {}
    }, 350);
  }

  // ─────────────────────────────────────────────
  // GENRE FILTER
  // ─────────────────────────────────────────────
  async function filterGenre(g) {
    setActiveGenre(g);
    if (!g) { setTrending(SEED.slice(0,8)); return; }
    const local = SEED.filter(a => a.genres.includes(g));
    setTrending(local.length ? local : SEED.slice(0,8));
    try {
      const d = await ql(`{Page(page:1,perPage:8){media(genre:${JSON.stringify(g)},sort:POPULARITY_DESC,type:ANIME){id idMal title{romaji english} coverImage{large} averageScore episodes format genres nextAiringEpisode{episode} status}}}`);
      const l = d.Page.media.map(alMap); l.forEach(a => AM[a.id] = { ...AM[a.id], ...a }); setTrending(l);
    } catch(e) {}
  }

  // ─────────────────────────────────────────────
  // OPEN WATCH
  // ─────────────────────────────────────────────
  async function openAnime(a) {
    if (!a) return;
    setCurAnime(a); setCurEp(null); setEpisodes([]); setStreamUrl(''); setStreamError('');
    setEpSearch(''); setChunkIdx(0); setEpFetching(true);
    setPage('watch');
    window.scrollTo(0, 0);

    // Fetch full description if missing
    if (!a.desc && a.id) {
      try {
        const d = await ql(`{Media(id:${a.id}){description idMal studios{nodes{name}} season seasonYear}}`);
        if (d?.Media) {
          const desc = (d.Media.description||'').replace(/<[^>]+>/g,'').slice(0,600);
          const updated = { ...a, desc, mal: d.Media.idMal||a.mal, studios: d.Media.studios?.nodes?.[0]?.name||'', season: d.Media.season||'', year: d.Media.seasonYear||'' };
          AM[a.id] = updated; setCurAnime(updated);
        }
      } catch(e) {}
    }

    // Try to get real HiAnime episodes via our API proxy
    await fetchEpisodes(a);
  }

  async function fetchEpisodes(a) {
    setEpFetching(true);
    // Try HiAnime slug lookup
    const slug = a.hiSlug || AM[a.id]?.hiSlug || slugify(a.title);
    try {
      const r = await fetch(`/api/episodes?animeId=${encodeURIComponent(slug)}`);
      const data = await r.json();
      if (data?.episodes?.length) {
        setEpisodes(data.episodes);
        setEpFetching(false);
        // Auto-play first episode
        playEpisode(data.episodes[0], a);
        return;
      }
    } catch(e) {}

    // Fallback: search HiAnime for slug
    try {
      const r = await fetch(`/api/search-hianime?q=${encodeURIComponent(a.title)}`);
      const data = await r.json();
      if (data?.animes?.length) {
        const match = data.animes[0];
        const r2 = await fetch(`/api/episodes?animeId=${encodeURIComponent(match.id)}`);
        const ep2 = await r2.json();
        if (ep2?.episodes?.length) {
          AM[a.id] = { ...AM[a.id], hiSlug: match.id };
          setEpisodes(ep2.episodes);
          setEpFetching(false);
          playEpisode(ep2.episodes[0], a);
          return;
        }
      }
    } catch(e) {}

    // Final fallback: generate episodes from AniList count
    const total = a.eps || 12;
    const eps = Array.from({ length: total }, (_, i) => ({ number: i+1, title: `Episode ${i+1}`, episodeId: `${slugify(a.title)}-episode-${i+1}` }));
    setEpisodes(eps);
    setEpFetching(false);
    playEpisode(eps[0], a);
  }

  async function playEpisode(ep, animeOverride) {
    const anime = animeOverride || curAnime;
    if (!ep || !anime) return;
    setCurEp(ep); setStreamLoading(true); setStreamError(''); setStreamUrl('');
    // Mark watched
    const key = `${anime.id}_${ep.number}`;
    setWatchedEps(prev => ({ ...prev, [key]: true }));
    // Save continue watching
    saveCW(anime, ep);

    const epId = ep.episodeId || ep.id || `${AM[anime.id]?.hiSlug || slugify(anime.title)}-episode-${ep.number}`;

    try {
      const r = await fetch(`/api/stream?episodeId=${encodeURIComponent(epId)}&server=${server}&category=${sdMode}`);
      const data = await r.json();
      if (data?.sources?.length) {
        const best = data.sources.find(s => s.quality === '1080p') || data.sources.find(s => s.quality === '720p') || data.sources.find(s => s.isM3U8) || data.sources[0];
        if (best?.url) {
          // Proxy the m3u8 to handle CORS
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(best.url)}&referer=${encodeURIComponent('https://hianime.to/')}`;
          setStreamUrl(proxyUrl);
          setSubtitles(data.subtitles || []);
          setStreamLoading(false);
          return;
        }
      }
    } catch(e) {}

    setStreamLoading(false);
    setStreamError('Stream unavailable — try a different server or come back later.');
  }

  function saveCW(anime, ep) {
    setContinueW(prev => {
      const item = { id: anime.id, title: anime.title, img: anime.img, ep: ep.number, prog: 30, time: 'Just now' };
      const rest = prev.filter(c => c.id !== anime.id);
      return [item, ...rest].slice(0, 10);
    });
  }

  // ─────────────────────────────────────────────
  // WATCHLIST
  // ─────────────────────────────────────────────
  function toggleWL() {
    if (!curAnime) return;
    const has = watchlist.some(w => w.id === curAnime.id);
    if (has) { setWatchlist(watchlist.filter(w => w.id !== curAnime.id)); showToast('Removed from watchlist'); }
    else { setWatchlist([{ id: curAnime.id, title: curAnime.title, img: curAnime.img }, ...watchlist]); showToast('Added to watchlist!'); }
  }

  // ─────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────
  function postComment() {
    if (!commentInput.trim() || !curAnime || !curEp) return;
    const key = `${curAnime.id}_${curEp.number}`;
    const entry = { user: 'You', text: commentInput.trim(), time: new Date().toLocaleTimeString() };
    setComments(prev => ({ ...prev, [key]: [entry, ...(prev[key]||[])] }));
    setCommentInput('');
    showToast('Comment posted!');
  }

  // ─────────────────────────────────────────────
  // AI RECS
  // ─────────────────────────────────────────────
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [aiText, setAiText] = useState('');

  async function getAIRecs() {
    if (!aiInput.trim()) return;
    setAiLoading(true); setAiResults([]); setAiText('');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          system: `Anime recommendation engine. Return ONLY a valid JSON array, zero markdown, zero preamble:
[{"title":"Exact Anime Title","reason":"One compelling sentence.","genres":["Genre1","Genre2"]}]
Give exactly 4 real anime titles. Accurate, enthusiastic, specific.`,
          messages: [{ role: 'user', content: aiInput }],
        }),
      });
      const data = await r.json();
      let recs = [];
      try { recs = JSON.parse((data.content?.[0]?.text || '[]').replace(/```json|```/g,'').trim()); } catch(e) {}
      setAiResults(recs);
      setAiText(recs.length ? '4 picks just for you:' : 'No results. Try a more specific prompt!');
    } catch(e) { setAiText('AI unavailable. Browse genres or search directly!'); }
    setAiLoading(false);
  }

  // ─────────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────────
  const toastTimer = useRef(null);
  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ show: true, msg });
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  }

  // ─────────────────────────────────────────────
  // EPISODE CHUNKS
  // ─────────────────────────────────────────────
  const CHUNK = 50;
  const filteredEps = epSearch ? episodes.filter(e => String(e.number).includes(epSearch) || (e.title||'').toLowerCase().includes(epSearch.toLowerCase())) : episodes;
  const chunks = [];
  for (let i = 0; i < filteredEps.length; i += CHUNK) chunks.push(filteredEps.slice(i, i + CHUNK));
  const visibleEps = epSearch ? filteredEps : (chunks[chunkIdx] || []);

  const inWL = watchlist.some(w => w.id === curAnime?.id);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>AniVerse — Watch Anime Free in HD</title>
        <meta name="description" content="Watch thousands of anime for free in HD — subtitles, dubs, and the best UI in the game." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>" />
      </Head>

      <style jsx global>{`
        /* ═══ NAV ═══ */
        .nav{position:fixed;top:0;left:0;right:0;z-index:500;height:62px;display:flex;align-items:center;gap:1.5rem;padding:0 2rem;transition:background .35s,border .35s;border-bottom:1px solid transparent}
        .nav.stuck{background:rgba(4,3,12,.95);border-bottom-color:rgba(255,42,72,.14);backdrop-filter:blur(22px)}
        .logo{font-family:'Bebas Neue',sans-serif;font-size:1.65rem;letter-spacing:4px;background:linear-gradient(110deg,#ff2a48,#ffb020);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(255,42,72,.45));cursor:pointer;flex-shrink:0}
        .nav-links{display:flex;gap:.15rem;list-style:none}
        .nav-links a{font-size:.78rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--mist2);padding:6px 12px;border-radius:6px;transition:all .2s}
        .nav-links a:hover,.nav-links a.on{color:var(--ice);background:rgba(255,255,255,.05)}
        .nav-right{display:flex;align-items:center;gap:.6rem;margin-left:auto}
        .si-wrap{position:relative}
        .si{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:8px;padding:7px 14px 7px 34px;color:var(--ice);font-size:.78rem;width:185px;outline:none;transition:all .25s;font-family:'Syne',sans-serif}
        .si:focus{width:245px;border-color:rgba(255,42,72,.38);background:rgba(255,42,72,.04)}
        .si::placeholder{color:var(--mist)}
        .si-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--mist);pointer-events:none}
        .sdd{display:none;position:absolute;top:calc(100%+6px);left:0;min-width:310px;background:var(--s2);border:1px solid var(--line2);border-radius:var(--r2);overflow:hidden;z-index:600;box-shadow:0 24px 70px rgba(0,0,0,.85)}
        .sdd.on{display:block}
        .sri{display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:background .15s;color:var(--ice)}
        .sri:hover{background:rgba(255,42,72,.08)}
        .sri img{width:32px;height:46px;object-fit:cover;border-radius:4px;flex-shrink:0;background:var(--s3)}
        .sri-name{font-size:.78rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sri-meta{font-size:.65rem;color:var(--mist2);margin-top:2px;font-family:'JetBrains Mono',monospace}
        .n-btn{background:var(--red);color:#fff;padding:8px 18px;border-radius:7px;font-size:.76rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase;transition:all .2s;box-shadow:0 0 20px rgba(255,42,72,.32)}
        .n-btn:hover{transform:translateY(-1px);box-shadow:0 4px 28px rgba(255,42,72,.5)}
        .n-ico{width:34px;height:34px;border-radius:7px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--mist2);display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:all .2s;cursor:pointer}
        .n-ico:hover{color:var(--ice);border-color:rgba(255,42,72,.3)}

        /* ═══ HERO ═══ */
        .hero{position:relative;height:100vh;min-height:700px;display:flex;align-items:center;overflow:hidden}
        .h-bgimg{position:absolute;inset:0;background-size:cover;background-position:center 20%;opacity:0;transition:opacity 1.3s ease;filter:blur(3px) brightness(.28)}
        .h-bgimg.in{opacity:1}
        .h-fade{position:absolute;inset:0;background:linear-gradient(to right,rgba(4,3,12,1) 0%,rgba(4,3,12,.78) 38%,rgba(4,3,12,.1) 72%,rgba(4,3,12,.0) 100%),linear-gradient(to top,rgba(4,3,12,1) 0%,rgba(4,3,12,.55) 22%,transparent 50%),radial-gradient(ellipse 55% 70% at 72% 50%,rgba(255,42,72,.06),transparent)}
        .h-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,42,72,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,72,.035) 1px,transparent 1px);background-size:65px 65px;mask-image:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.45) 25%,rgba(0,0,0,.3) 70%,transparent 100%);animation:gSlide 22s linear infinite}
        @keyframes gSlide{from{background-position:0 0}to{background-position:65px 65px}}
        .h-orbs{position:absolute;inset:0;overflow:hidden;pointer-events:none}
        .orb{position:absolute;border-radius:50%;filter:blur(95px);animation:orbf 10s ease-in-out infinite}
        .orb-a{width:800px;height:800px;background:radial-gradient(circle,rgba(255,42,72,.22),transparent);top:-200px;right:-100px;animation-delay:-4s}
        .orb-b{width:520px;height:520px;background:radial-gradient(circle,rgba(90,0,220,.17),transparent);top:8%;right:32%;animation-delay:-7s}
        .orb-c{width:420px;height:420px;background:radial-gradient(circle,rgba(255,176,32,.1),transparent);bottom:8%;right:12%;animation-delay:-2s}
        @keyframes orbf{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-26px) scale(1.05)}}
        .h-poster{position:absolute;right:4.5%;top:50%;transform:translateY(-50%);width:41%;max-width:680px;aspect-ratio:16/9;border-radius:16px;overflow:hidden;cursor:pointer;border:1px solid rgba(255,42,72,.17);box-shadow:0 0 0 1px rgba(255,255,255,.025),0 60px 120px rgba(0,0,0,.85),0 0 80px rgba(255,42,72,.09);transition:transform .35s,box-shadow .35s}
        .h-poster:hover{transform:translateY(-50%) scale(1.018);box-shadow:0 0 0 1px rgba(255,255,255,.04),0 70px 130px rgba(0,0,0,.9),0 0 100px rgba(255,42,72,.16)}
        .h-poster img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
        .h-poster:hover img{transform:scale(1.04)}
        .h-poster-fade{position:absolute;inset:0;background:linear-gradient(to right,rgba(4,3,12,.65) 0%,transparent 35%),linear-gradient(to top,rgba(4,3,12,.55) 0%,transparent 45%)}
        .h-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:65px;height:65px;border-radius:50%;background:rgba(255,42,72,.9);border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 0 40px rgba(255,42,72,.65);transition:all .2s}
        .h-poster:hover .h-play{transform:translate(-50%,-50%) scale(1.12);box-shadow:0 0 60px rgba(255,42,72,.9)}
        .h-poster-foot{position:absolute;bottom:0;left:0;right:0;padding:.85rem 1rem;background:linear-gradient(to top,rgba(4,3,12,.95),transparent);font-size:.65rem;color:var(--mist2);letter-spacing:.8px;font-family:'JetBrains Mono',monospace}
        .h-content{position:relative;z-index:2;padding:0 2.5rem;max-width:600px;animation:hcIn .75s cubic-bezier(.22,1,.36,1)}
        @keyframes hcIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .h-chip{display:inline-flex;align-items:center;gap:7px;margin-bottom:1.1rem;background:rgba(255,42,72,.09);border:1px solid rgba(255,42,72,.28);border-radius:5px;padding:4px 12px;font-size:.63rem;font-weight:700;color:var(--red2);letter-spacing:2px;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
        .ldot{width:5px;height:5px;background:var(--red);border-radius:50%;animation:blink 1.4s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        .h-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.6rem,5vw,4.8rem);line-height:.93;letter-spacing:2px;margin-bottom:.85rem;background:linear-gradient(150deg,#fff 0%,var(--ice) 50%,var(--red2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .h-tags{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin-bottom:.9rem}
        .tag{padding:3px 9px;border-radius:4px;font-size:.62rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase}
        .tag-g{background:rgba(255,255,255,.06);color:var(--ice2);border:1px solid var(--line)}
        .tag-s{background:rgba(255,176,32,.11);color:var(--amber);border:1px solid rgba(255,176,32,.2)}
        .tag-r{background:rgba(255,42,72,.11);color:var(--red2);border:1px solid rgba(255,42,72,.2)}
        .h-desc{color:var(--ice2);font-size:.86rem;line-height:1.78;margin-bottom:1.7rem;max-width:490px;font-weight:400}
        .h-btns{display:flex;gap:.8rem;flex-wrap:wrap}
        .btn-w{display:inline-flex;align-items:center;gap:9px;background:var(--red);color:#fff;padding:13px 26px;border-radius:8px;font-size:.85rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 0 38px rgba(255,42,72,.43);transition:all .2s;cursor:pointer;border:none;font-family:'Syne',sans-serif}
        .btn-w:hover{transform:translateY(-2px);box-shadow:0 8px 48px rgba(255,42,72,.58)}
        .btn-o{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);color:var(--ice);border:1px solid rgba(255,255,255,.1);padding:12px 22px;border-radius:8px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Syne',sans-serif}
        .btn-o:hover{background:rgba(255,255,255,.1)}
        .h-scroll{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;color:var(--mist);font-size:.58rem;letter-spacing:3px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;animation:sb 2s ease-in-out infinite}
        @keyframes sb{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-5px)}}

        /* ═══ LAYOUT ═══ */
        .wrap{max-width:1700px;margin:0 auto;padding:0 2rem}
        .sec{padding:3.5rem 0}
        .sch{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
        .st{font-family:'Bebas Neue',sans-serif;font-size:1.55rem;letter-spacing:2px;display:flex;align-items:center;gap:11px}
        .st::before{content:'';width:3px;height:25px;background:linear-gradient(to bottom,var(--red),var(--amber));border-radius:2px;flex-shrink:0}
        .sa{font-size:.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--red2);display:flex;align-items:center;gap:3px;transition:gap .2s;font-family:'Syne',sans-serif;cursor:pointer}
        .sa:hover{gap:8px}

        /* ═══ GRID ═══ */
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:1rem}
        .grid.lg{grid-template-columns:repeat(auto-fill,minmax(205px,1fr))}
        .card{position:relative;display:block;border-radius:var(--r);overflow:hidden;background:var(--s1);border:1px solid var(--line);transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s,border-color .28s;cursor:pointer;color:var(--ice)}
        .card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 28px 60px rgba(0,0,0,.6),0 0 0 1px rgba(255,42,72,.2),0 0 28px rgba(255,42,72,.1);border-color:rgba(255,42,72,.3);z-index:3}
        .card-art{position:relative;aspect-ratio:2/3;overflow:hidden;background:var(--s2)}
        .card-art img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
        .card:hover .card-art img{transform:scale(1.08)}
        .card-glow{position:absolute;inset:0;opacity:0;transition:opacity .3s;background:linear-gradient(to top,rgba(255,42,72,.38) 0%,transparent 60%)}
        .card:hover .card-glow{opacity:1}
        .card-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.7);width:46px;height:46px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:.9rem;box-shadow:0 0 28px rgba(255,42,72,.7);opacity:0;transition:all .25s}
        .card:hover .card-play{opacity:1;transform:translate(-50%,-50%) scale(1)}
        .card-badge{position:absolute;top:8px;left:8px;display:flex;flex-direction:column;gap:4px}
        .bdg{padding:2px 7px;border-radius:3px;font-size:.58rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;line-height:1.5;font-family:'JetBrains Mono',monospace}
        .bdg-s{background:rgba(255,42,72,.88);color:#fff}
        .bdg-d{background:rgba(255,176,32,.88);color:#000}
        .bdg-e{background:rgba(0,0,0,.8);color:var(--mist2);border:1px solid var(--line)}
        .card-score{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.82);border:1px solid rgba(255,176,32,.26);color:var(--amber);font-size:.63rem;font-weight:700;padding:2px 7px;border-radius:4px;backdrop-filter:blur(6px);font-family:'JetBrains Mono',monospace}
        .card-body{padding:10px 10px 12px}
        .card-title{font-size:.8rem;font-weight:700;line-height:1.32;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px;letter-spacing:.15px}
        .card-meta{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
        .card-meta span{font-size:.62rem;color:var(--mist2);font-family:'JetBrains Mono',monospace}
        .card-meta-sep{width:2px;height:2px;border-radius:50%;background:var(--mist);flex-shrink:0}

        /* ═══ RANKINGS ═══ */
        .rk-list{display:flex;flex-direction:column;gap:.5rem}
        .rk-item{display:flex;align-items:center;gap:.8rem;padding:10px 12px;background:var(--s1);border:1px solid var(--line);border-radius:var(--r);cursor:pointer;transition:all .2s;color:var(--ice)}
        .rk-item:hover{background:var(--s2);border-color:rgba(255,42,72,.2);transform:translateX(5px)}
        .rk-num{font-family:'Bebas Neue',sans-serif;font-size:1.25rem;letter-spacing:1px;min-width:30px;text-align:center;color:var(--mist)}
        .rk-num.gold{background:linear-gradient(135deg,var(--amber),var(--red));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .rk-thumb{width:36px;height:52px;border-radius:5px;object-fit:cover;flex-shrink:0;background:var(--s3)}
        .rk-info{flex:1;min-width:0}
        .rk-name{font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .rk-genre{font-size:.62rem;color:var(--mist2);margin-top:1px;font-family:'JetBrains Mono',monospace}
        .rk-score{font-size:.78rem;font-weight:700;color:var(--amber);font-family:'JetBrains Mono',monospace}

        /* ═══ CHIPS ═══ */
        .chip-bar{display:flex;gap:.45rem;flex-wrap:wrap;padding:.5rem 0 2.5rem}
        .chip{padding:6px 13px;border-radius:5px;font-size:.68rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;background:var(--s2);border:1px solid var(--line);color:var(--mist2);transition:all .2s;user-select:none;font-family:'Syne',sans-serif}
        .chip:hover,.chip.on{background:rgba(255,42,72,.1);border-color:rgba(255,42,72,.36);color:var(--red2)}

        /* ═══ SCHEDULE ═══ */
        .sched{display:grid;grid-template-columns:repeat(7,1fr);gap:.7rem;margin-bottom:3rem}
        .sday{background:var(--s1);border:1px solid var(--line);border-radius:var(--r);padding:.8rem;min-height:100px}
        .sday.now{border-color:rgba(255,42,72,.3);background:rgba(255,42,72,.035)}
        .sday-lbl{font-size:.6rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mist);margin-bottom:.55rem;font-family:'JetBrains Mono',monospace}
        .sday.now .sday-lbl{color:var(--red2)}
        .sday-anime{font-size:.68rem;color:var(--ice2);margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;cursor:pointer;font-weight:600;transition:color .15s}
        .sday-anime:hover{color:var(--red2)}
        .sday-ep{font-size:.58rem;color:var(--mist);margin-bottom:6px;font-family:'JetBrains Mono',monospace}

        /* ═══ STATS ═══ */
        .stats{display:flex;justify-content:space-around;padding:2.5rem;background:linear-gradient(135deg,var(--s1),var(--s2));border:1px solid var(--line2);border-radius:16px;margin-bottom:3rem}
        .stat-n{font-family:'Bebas Neue',sans-serif;font-size:2.1rem;letter-spacing:2px;background:linear-gradient(135deg,var(--red),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
        .stat-l{font-size:.6rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mist);margin-top:3px;text-align:center;font-family:'JetBrains Mono',monospace}

        /* ═══ AI ═══ */
        .ai-panel{background:linear-gradient(135deg,rgba(100,0,255,.07),rgba(9,7,26,.0));border:1px solid rgba(100,0,255,.18);border-radius:14px;padding:1.4rem;margin-bottom:3rem}
        .ai-head{display:flex;align-items:center;gap:12px;margin-bottom:.95rem}
        .ai-icon{width:40px;height:40px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,#6400ff,var(--red));display:flex;align-items:center;justify-content:center;font-size:1.1rem}
        .ai-inp{flex:1;background:rgba(0,0,0,.4);border:1px solid rgba(100,0,255,.2);border-radius:8px;padding:10px 13px;color:var(--ice);font-family:'Syne',sans-serif;font-size:.82rem;outline:none;transition:border-color .2s}
        .ai-inp:focus{border-color:rgba(100,0,255,.5)}
        .ai-inp::placeholder{color:var(--mist)}
        .ai-go{background:linear-gradient(135deg,#6400ff,var(--red));color:#fff;padding:10px 18px;border-radius:8px;font-family:'Syne',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:opacity .2s;white-space:nowrap;cursor:pointer;border:none}
        .ai-go:hover{opacity:.85}
        .ai-go:disabled{opacity:.4;cursor:default}
        .ai-cards{display:flex;gap:.65rem;flex-wrap:wrap;margin-top:.9rem}
        .ai-card{flex:1;min-width:170px;max-width:250px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;padding:10px 12px;cursor:pointer;transition:all .2s}
        .ai-card:hover{border-color:rgba(100,0,255,.36);background:rgba(100,0,255,.07)}
        .ai-ct{font-size:.78rem;font-weight:700;margin-bottom:3px}
        .ai-cd{font-size:.68rem;color:var(--mist2);line-height:1.5}

        /* ═══ CW CARD ═══ */
        .cw-card{display:flex;border-radius:var(--r);overflow:hidden;background:var(--s1);border:1px solid var(--line);transition:transform .2s,border-color .2s;cursor:pointer;color:var(--ice)}
        .cw-card:hover{transform:translateY(-4px);border-color:rgba(255,42,72,.26)}
        .cw-thumb{position:relative;width:150px;flex-shrink:0;aspect-ratio:16/9}
        .cw-thumb img{width:100%;height:100%;object-fit:cover}
        .cw-prog{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,.12)}
        .cw-pb{height:100%;background:linear-gradient(90deg,var(--red),var(--amber))}
        .cw-body{padding:11px 13px;flex:1;display:flex;flex-direction:column;justify-content:space-between}
        .cw-title{font-size:.82rem;font-weight:700;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .cw-ep{font-size:.7rem;color:var(--ice2)}
        .cw-time{font-size:.62rem;color:var(--mist);font-family:'JetBrains Mono',monospace}

        /* ═══ TWO-COL ═══ */
        .two-col{display:grid;grid-template-columns:1fr 355px;gap:2.5rem;margin-bottom:3rem}

        /* ═══ WATCH PAGE ═══ */
        .w-topbar{display:flex;align-items:center;gap:.8rem;padding:.8rem 1.6rem;background:rgba(4,3,12,.97);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:100;backdrop-filter:blur(14px)}
        .w-back{background:rgba(255,255,255,.06);border:1px solid var(--line);color:var(--mist2);padding:7px 14px;border-radius:7px;cursor:pointer;font-size:.73rem;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.5px;text-transform:uppercase;transition:all .2s;display:flex;align-items:center;gap:5px}
        .w-back:hover{color:var(--ice);border-color:rgba(255,42,72,.3)}
        .w-layout{display:grid;grid-template-columns:1fr 336px;gap:1.4rem;max-width:1700px;margin:0 auto;padding:1.4rem 1.6rem}
        .w-wl-btn{background:none;border:1px solid var(--line);color:var(--mist2);cursor:pointer;padding:7px 14px;border-radius:7px;font-size:.7rem;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.5px;text-transform:uppercase;display:flex;align-items:center;gap:5px;transition:all .2s}
        .w-wl-btn:hover,.w-wl-btn.on{background:rgba(255,176,32,.08);border-color:rgba(255,176,32,.3);color:var(--amber)}

        /* ═══ PLAYER ═══ */
        .player-box{background:#000;border-radius:12px;overflow:hidden;position:relative;aspect-ratio:16/9;margin-bottom:.9rem;border:1px solid var(--line);box-shadow:0 0 55px rgba(255,42,72,.06)}
        .player-cover{position:absolute;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.9rem;z-index:5;transition:opacity .35s}
        .player-cover.hidden{opacity:0;pointer-events:none}
        .p-spin{width:42px;height:42px;border:3px solid rgba(255,42,72,.2);border-top-color:var(--red);border-radius:50%;animation:pspin .8s linear infinite}
        @keyframes pspin{to{transform:rotate(360deg)}}
        .p-msg{color:var(--mist2);font-size:.78rem;text-align:center;max-width:260px;line-height:1.5;font-family:'JetBrains Mono',monospace}
        .p-err{color:var(--red2);font-size:.78rem;text-align:center;max-width:280px;line-height:1.5;font-family:'JetBrains Mono',monospace}
        video{width:100%;height:100%;display:block;background:#000}

        /* ═══ SERVER BAR ═══ */
        .srv-bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.85rem;padding:9px 12px;background:var(--s1);border:1px solid var(--line);border-radius:9px}
        .srv-lbl{font-size:.6rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mist);margin-right:2px;font-family:'JetBrains Mono',monospace}
        .srv-btn{padding:5px 11px;border-radius:6px;font-size:.7rem;font-weight:700;background:var(--s2);border:1px solid var(--line);color:var(--mist2);cursor:pointer;font-family:'Syne',sans-serif;transition:all .2s}
        .srv-btn:hover{border-color:rgba(255,42,72,.28);color:var(--ice)}
        .srv-btn.on{background:var(--red);border-color:var(--red);color:#fff;box-shadow:0 0 14px rgba(255,42,72,.38)}
        .sd-tog{display:flex;background:var(--s2);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-left:auto}
        .sd-btn{padding:5px 14px;font-size:.7rem;font-weight:700;cursor:pointer;background:none;border:none;color:var(--mist2);font-family:'Syne',sans-serif;letter-spacing:.8px;text-transform:uppercase;transition:all .2s}
        .sd-btn.on{background:var(--red);color:#fff}

        /* ═══ WATCH INFO ═══ */
        .w-title{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:2px;margin-bottom:.45rem}
        .w-meta{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin-bottom:.65rem}
        .w-desc{color:var(--ice2);font-size:.82rem;line-height:1.77;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;margin-bottom:1.1rem}
        .w-desc.open{-webkit-line-clamp:unset}

        /* ═══ NEXT EP BAR ═══ */
        .next-ep-bar{display:flex;align-items:center;gap:.7rem;padding:10px 14px;background:var(--s1);border:1px solid var(--line);border-radius:9px;margin-bottom:.9rem}
        .next-ep-lbl{font-size:.62rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--mist);font-family:'JetBrains Mono',monospace}
        .next-ep-name{font-size:.78rem;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .next-btn{background:var(--red);color:#fff;padding:6px 14px;border-radius:6px;font-family:'Syne',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;cursor:pointer;border:none;transition:opacity .2s;flex-shrink:0}
        .next-btn:hover{opacity:.85}

        /* ═══ EP PANEL ═══ */
        .ep-panel{background:var(--s1);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 120px);position:sticky;top:74px}
        .ep-top{padding:.82rem 1rem;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .ep-top-t{font-size:.86rem;font-weight:700}
        .ep-top-c{font-size:.62rem;color:var(--mist);font-family:'JetBrains Mono',monospace}
        .ep-si-wrap{padding:.58rem .82rem;border-bottom:1px solid var(--line);flex-shrink:0}
        .ep-si{width:100%;background:var(--s2);border:1px solid var(--line);border-radius:7px;padding:6px 10px;color:var(--ice);font-family:'Syne',sans-serif;font-size:.76rem;outline:none;transition:border-color .2s}
        .ep-si:focus{border-color:rgba(255,42,72,.32)}
        .ep-si::placeholder{color:var(--mist)}
        .ep-chunks{display:flex;gap:.38rem;padding:.58rem .82rem;border-bottom:1px solid var(--line);overflow-x:auto;flex-shrink:0}
        .ep-chunks::-webkit-scrollbar{display:none}
        .chunk-btn{padding:4px 11px;border-radius:5px;font-size:.65rem;font-weight:700;white-space:nowrap;background:var(--s2);border:1px solid var(--line);color:var(--mist2);cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .2s}
        .chunk-btn.on{background:var(--red);border-color:var(--red);color:#fff}
        .ep-scroll{overflow-y:auto;flex:1;padding:.38rem}
        .ep-item{display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s;border:1px solid transparent;position:relative}
        .ep-item:hover{background:var(--s2)}
        .ep-item.on{background:rgba(255,42,72,.09);border-color:rgba(255,42,72,.2)}
        .ep-thumb-n{width:80px;height:45px;border-radius:5px;flex-shrink:0;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:var(--mist);font-family:'JetBrains Mono',monospace}
        .ep-item.on .ep-thumb-n{color:var(--red2)}
        .ep-info{flex:1;min-width:0}
        .ep-label{font-size:.6rem;color:var(--mist);font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
        .ep-item.on .ep-label{color:var(--red2)}
        .ep-name{font-size:.76rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
        .ep-item.watched .ep-name{color:var(--mist2)}
        .ep-dot{position:absolute;right:8px;width:6px;height:6px;border-radius:50%;background:var(--mist);opacity:0}
        .ep-item.watched .ep-dot{opacity:1}

        /* ═══ COMMENTS ═══ */
        .cmts{margin-top:1.7rem}
        .cm-hd{font-size:.86rem;font-weight:700;margin-bottom:.82rem;display:flex;align-items:center;gap:7px}
        .cm-row{display:flex;gap:7px;margin-bottom:.95rem}
        .cm-input{flex:1;background:var(--s2);border:1px solid var(--line);border-radius:8px;padding:8px 12px;color:var(--ice);font-family:'Syne',sans-serif;font-size:.78rem;outline:none;resize:none;height:40px;transition:all .2s}
        .cm-input:focus{border-color:rgba(255,42,72,.32);height:66px}
        .cm-post{background:var(--red);color:#fff;padding:8px 14px;border-radius:8px;font-family:'Syne',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;align-self:flex-end;cursor:pointer;border:none;transition:opacity .2s}
        .cm-post:hover{opacity:.85}
        .cm-item{display:flex;gap:8px;margin-bottom:.82rem;padding-bottom:.82rem;border-bottom:1px solid var(--line)}
        .cm-av{width:31px;height:31px;border-radius:6px;flex-shrink:0;background:linear-gradient(135deg,var(--red),var(--amber));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700}
        .cm-user{font-size:.73rem;font-weight:700;margin-bottom:2px}
        .cm-text{font-size:.78rem;color:var(--ice2);line-height:1.6}
        .cm-time{font-size:.6rem;color:var(--mist);margin-top:2px;font-family:'JetBrains Mono',monospace}

        /* ═══ TOAST ═══ */
        .toast{position:fixed;bottom:1.6rem;right:1.6rem;z-index:9999;background:var(--s2);border:1px solid var(--line2);border-radius:10px;padding:11px 15px;display:flex;align-items:center;gap:8px;box-shadow:0 12px 50px rgba(0,0,0,.7);transform:translateY(100px);opacity:0;transition:all .3s cubic-bezier(.22,1,.36,1);pointer-events:none;font-size:.78rem;font-weight:600}
        .toast.on{transform:translateY(0);opacity:1}

        /* ═══ FOOTER ═══ */
        footer{background:var(--s1);border-top:1px solid var(--line);padding:2.5rem 2rem;margin-top:3rem}
        .f-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2.5rem;max-width:1450px;margin:0 auto 2rem}
        .f-desc{font-size:.76rem;color:var(--mist2);line-height:1.72;max-width:255px;margin-top:.65rem}
        .f-col-t{font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--mist);margin-bottom:.75rem;font-family:'JetBrains Mono',monospace}
        .f-links{list-style:none;display:flex;flex-direction:column;gap:.45rem}
        .f-links a{color:var(--mist2);font-size:.76rem;transition:color .2s}
        .f-links a:hover{color:var(--ice)}
        .f-bottom{border-top:1px solid var(--line);padding-top:1.1rem;display:flex;justify-content:space-between;align-items:center;max-width:1450px;margin:0 auto;flex-wrap:wrap;gap:.5rem}

        /* ═══ RESPONSIVE ═══ */
        @media(max-width:1200px){
          .h-poster{width:46%;right:2%}
          .two-col{grid-template-columns:1fr}
          .w-layout{grid-template-columns:1fr}
          .ep-panel{height:520px;position:static}
          .f-grid{grid-template-columns:1fr 1fr}
          .sched{grid-template-columns:repeat(4,1fr)}
        }
        @media(max-width:768px){
          .nav{padding:0 1rem}
          .h-poster{display:none}
          .h-content{padding:0 1.2rem;max-width:100%}
          .h-title{font-size:2.7rem}
          .wrap{padding:0 1.2rem}
          .sched{grid-template-columns:repeat(2,1fr)}
          .f-grid{grid-template-columns:1fr;gap:1.5rem}
          .w-layout{padding:1rem;grid-template-columns:1fr}
          .nav-links{display:none}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`nav${scrolled?' stuck':''}`}>
        <span className="logo" onClick={() => setPage('home')}>ANIVERSE</span>
        <ul className="nav-links">
          {['Home','Trending','Schedule','Movies','My List'].map(l => (
            <li key={l}><a href="#" className={page==='home'&&l==='Home'?'on':''} onClick={e=>{e.preventDefault();if(l==='Home')setPage('home');else showToast(`${l} coming soon!`)}}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-right">
          <div className="si-wrap">
            <span className="si-icon">🔍</span>
            <input className="si" placeholder="Search anime..." value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              onFocus={() => searchResults.length && setShowSearch(true)}
            />
            <div className={`sdd${showSearch&&searchResults.length?' on':''}`}>
              {searchResults.map(a => (
                <div key={a.id} className="sri" onMouseDown={() => { openAnime(AM[a.id]||a); setSearchQuery(''); setShowSearch(false); }}>
                  {a.img ? <img src={a.img} alt={a.title} /> : <div style={{width:32,height:46,background:'var(--s3)',borderRadius:4,flexShrink:0}}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div className="sri-name">{a.title}</div>
                    <div className="sri-meta">{[a.format, a.eps?a.eps+' eps':'', a.score?a.score+'★':''].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="n-ico">🔔</div>
          <button className="n-btn" onClick={() => showToast('Sign in coming soon!')}>Sign In</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HOME PAGE
      ══════════════════════════════════════════ */}
      {page === 'home' && (
        <div>
          {/* HERO */}
          <section className="hero">
            <div className="h-bgimg in" id="hbg" style={{ backgroundImage: hero.banner||hero.img ? `url(${hero.banner||hero.img})` : 'none' }} />
            <div className="h-fade" />
            <div className="h-grid" />
            <div className="h-orbs"><div className="orb orb-a"/><div className="orb orb-b"/><div className="orb orb-c"/></div>
            <div className="h-poster" onClick={() => openAnime(AM[hero.id]||hero)}>
              {hero.img && <img src={hero.img} alt={hero.title} />}
              <div className="h-poster-fade"/>
              <div className="h-play">▶</div>
              <div className="h-poster-foot">{hero.eps ? `${hero.eps} Episodes Available` : 'Watch Now'}</div>
            </div>
            <div className="h-content">
              <div className="h-chip"><span className="ldot"/>&nbsp; Now Trending #1</div>
              <h1 className="h-title">{hero.title}</h1>
              <div className="h-tags">
                {hero.score && <span className="tag tag-s">⭐ {hero.score}</span>}
                {hero.format && <span className="tag tag-g">{hero.format}</span>}
                {(hero.genres||[]).slice(0,3).map(g => <span key={g} className="tag tag-g">{g}</span>)}
                {hero.status === 'RELEASING' && <span className="tag tag-r">Airing Now</span>}
              </div>
              <p className="h-desc">{hero.desc || 'The best anime streaming platform. Watch in HD, free.'}</p>
              <div className="h-btns">
                <button className="btn-w" onClick={() => openAnime(AM[hero.id]||hero)}>▶ &nbsp;Watch Now</button>
                <button className="btn-o" onClick={() => openAnime(AM[hero.id]||hero)}>ℹ &nbsp;More Info</button>
              </div>
            </div>
            <div className="h-scroll">↓ scroll</div>
          </section>

          <div className="wrap">
            {/* CONTINUE WATCHING */}
            {continueW.length > 0 && (
              <div className="sec">
                <div className="sch"><h2 className="st">Continue Watching</h2><button className="sa" onClick={() => { setContinueW([]); showToast('Cleared'); }}>Clear All →</button></div>
                <div className="grid lg">
                  {continueW.slice(0,6).map(item => (
                    <div key={item.id} className="cw-card" onClick={() => openAnime(AM[item.id]||item)}>
                      <div className="cw-thumb">
                        {item.img && <img src={item.img} alt={item.title}/>}
                        <div className="cw-prog"><div className="cw-pb" style={{width:`${item.prog||35}%`}}/></div>
                      </div>
                      <div className="cw-body">
                        <div><div className="cw-title">{item.title}</div><div className="cw-ep">Episode {item.ep}</div></div>
                        <div className="cw-time">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI RECS */}
            <div className="ai-panel">
              <div className="ai-head">
                <div className="ai-icon">✨</div>
                <div><div style={{fontSize:'.9rem',fontWeight:700}}>AI Anime Recommendations</div><div style={{fontSize:'.72rem',color:'var(--mist2)',marginTop:2}}>Describe your mood or a show you liked — Claude picks the perfect match</div></div>
              </div>
              <div style={{display:'flex',gap:'.6rem'}}>
                <input className="ai-inp" value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&getAIRecs()} placeholder="e.g. 'like Death Note but more action' or 'wholesome slice of life with romance'" />
                <button className="ai-go" disabled={aiLoading} onClick={getAIRecs}>{aiLoading ? '⏳ Thinking...' : '✨ Get Recs'}</button>
              </div>
              {aiText && <div style={{marginTop:'.9rem',fontSize:'.82rem',color:'var(--ice2)'}}>{aiText}</div>}
              {aiResults.length > 0 && (
                <div className="ai-cards">
                  {aiResults.map((rec,i) => (
                    <div key={i} className="ai-card" onClick={() => handleSearchChange(rec.title)}>
                      <div className="ai-ct">{rec.title}</div>
                      <div className="ai-cd">{rec.reason}</div>
                      {rec.genres?.length > 0 && <div style={{marginTop:5,display:'flex',gap:3}}>{rec.genres.slice(0,2).map(g=><span key={g} style={{fontSize:'.58rem',background:'rgba(255,42,72,.12)',color:'var(--red2)',padding:'2px 6px',borderRadius:3,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'.5px',textTransform:'uppercase'}}>{g}</span>)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GENRE CHIPS */}
            <div className="chip-bar">
              <span className={`chip${!activeGenre?' on':''}`} onClick={()=>filterGenre(null)}>All</span>
              {GENRES.map(g => <span key={g} className={`chip${activeGenre===g?' on':''}`} onClick={()=>filterGenre(g)}>{g}</span>)}
            </div>

            {/* TRENDING */}
            <div className="sec">
              <div className="sch"><h2 className="st">Trending Now</h2><button className="sa">See All →</button></div>
              <AnimeGrid animes={trending} onOpen={a=>openAnime(AM[a.id]||a)} />
            </div>

            {/* 2-COL */}
            <div className="two-col">
              <div>
                <div className="sch"><h2 className="st">This Season</h2><button className="sa">See All →</button></div>
                <AnimeGrid animes={seasonal} onOpen={a=>openAnime(AM[a.id]||a)} />
              </div>
              <div>
                <div className="sch"><h2 className="st">Top Ranked</h2></div>
                <div className="rk-list">
                  {topRanked.slice(0,10).map((a,i) => (
                    <div key={a.id} className="rk-item" onClick={() => openAnime(AM[a.id]||a)}>
                      <div className={`rk-num${i<3?' gold':''}`}>{i+1}</div>
                      {a.img && <img className="rk-thumb" src={a.img} alt={a.title} loading="lazy" onError={e=>e.target.style.opacity='.15'} />}
                      <div className="rk-info">
                        <div className="rk-name">{a.title}</div>
                        <div className="rk-genre">{(a.genres||[]).slice(0,2).join(' · ')}</div>
                      </div>
                      {a.score && <div className="rk-score">⭐ {a.score}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="sch" style={{marginBottom:'1.2rem'}}><h2 className="st">Weekly Schedule</h2></div>
            <ScheduleGrid schedule={schedule} onOpen={id=>openAnime(AM[id]||SEED.find(s=>s.id===id))} seed={SEED} />

            {/* STATS */}
            <div className="stats">
              {[['12K+','Anime Titles'],['SUB & DUB','Languages'],['1080P','HD Quality'],['FREE','Always & Forever']].map(([n,l]) => (
                <div key={n}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
              ))}
            </div>

            {/* POPULAR */}
            <div className="sec">
              <div className="sch"><h2 className="st">Popular All Time</h2><button className="sa">See All →</button></div>
              <AnimeGrid animes={popular} onOpen={a=>openAnime(AM[a.id]||a)} />
            </div>
          </div>

          {/* FOOTER */}
          <footer>
            <div className="f-grid">
              <div>
                <div className="logo" style={{fontSize:'1.4rem'}}>ANIVERSE</div>
                <p className="f-desc">The most advanced free anime streaming platform. Watch thousands of anime in HD — completely free, forever.</p>
              </div>
              {[['Browse',['Trending','New Releases','Movies','Schedule','Top Ranked']],['Genres',['Action','Romance','Isekai','Horror','Mecha']],['Account',['Sign In','My Watchlist','Settings','Discord','About']]].map(([title,links]) => (
                <div key={title}>
                  <div className="f-col-t">{title}</div>
                  <ul className="f-links">{links.map(l=><li key={l}><a href="#" onClick={e=>{e.preventDefault();showToast(`${l} coming soon!`)}}>{l}</a></li>)}</ul>
                </div>
              ))}
            </div>
            <div className="f-bottom">
              <span style={{fontSize:'.68rem',color:'var(--mist)',fontFamily:"'JetBrains Mono',monospace"}}>© 2025 ANIVERSE — FREE ANIME STREAMING</span>
              <span style={{fontSize:'.62rem',color:'var(--mist)',maxWidth:520,textAlign:'right',lineHeight:1.5}}>AniVerse does not host any video files. All streams are provided by third-party sources. This project is for educational and development purposes.</span>
            </div>
          </footer>
        </div>
      )}

      {/* ══════════════════════════════════════════
          WATCH PAGE
      ══════════════════════════════════════════ */}
      {page === 'watch' && curAnime && (
        <div>
          <div className="w-topbar">
            <button className="w-back" onClick={() => setPage('home')}>← Back</button>
            <span style={{fontSize:'.73rem',color:'var(--mist2)',fontFamily:"'JetBrains Mono',monospace",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:400}}>Home / {curAnime.title}</span>
            <div style={{marginLeft:'auto',display:'flex',gap:'.6rem'}}>
              <button className={`w-wl-btn${inWL?' on':''}`} onClick={toggleWL}>{inWL?'♥ In My List':'♡ Add to List'}</button>
              <div className="n-ico" style={{cursor:'pointer'}} onClick={()=>showToast('Share link copied!')}>↗</div>
            </div>
          </div>

          <div className="w-layout">
            <div>
              {/* PLAYER */}
              <div className="player-box">
                <div className={`player-cover${(!streamLoading&&streamUrl&&!streamError)?' hidden':''}`}>
                  {streamLoading && <><div className="p-spin"/><div className="p-msg">Fetching stream...</div></>}
                  {!streamLoading && streamError && <div className="p-err">{streamError}<br/><span style={{fontSize:'.7rem',marginTop:6,display:'block',color:'var(--mist2)'}}>Try a different server above</span></div>}
                  {!streamLoading && !streamError && !streamUrl && <><div className="p-spin"/><div className="p-msg">Loading episodes...</div></>}
                </div>
                <video ref={videoRef} controls playsInline style={{display:streamUrl?'block':'none'}}
                  onEnded={() => {
                    const idx = episodes.findIndex(e => e.number === curEp?.number);
                    if (idx >= 0 && idx < episodes.length-1) playEpisode(episodes[idx+1]);
                  }}
                />
                {subtitles.length > 0 && (
                  <track kind="subtitles" src={subtitles.find(s=>s.lang==='English')?.url||subtitles[0]?.url} srcLang="en" label="English" default />
                )}
              </div>

              {/* SERVER BAR */}
              <div className="srv-bar">
                <span className="srv-lbl">Server</span>
                {['hd-1','hd-2','megacloud'].map(s => (
                  <button key={s} className={`srv-btn${server===s?' on':''}`} onClick={() => { setServer(s); if(curEp) playEpisode(curEp); }}>{s.toUpperCase()}</button>
                ))}
                <div style={{width:1,height:20,background:'var(--line)',margin:'0 3px',flexShrink:0}}/>
                <div className="sd-tog">
                  {['sub','dub'].map(m => <button key={m} className={`sd-btn${sdMode===m?' on':''}`} onClick={()=>{setSdMode(m);if(curEp)playEpisode(curEp)}}>{m.toUpperCase()}</button>)}
                </div>
              </div>

              {/* WATCH INFO */}
              <h1 className="w-title">{curAnime.title}</h1>
              <div className="w-meta">
                {curAnime.score && <span className="tag tag-s">⭐ {curAnime.score}</span>}
                {curAnime.format && <span className="tag tag-g">{curAnime.format}</span>}
                {curAnime.status && <span className="tag tag-g">{curAnime.status.replace(/_/g,' ')}</span>}
                {curAnime.studios && <span className="tag tag-g">{curAnime.studios}</span>}
                {(curAnime.genres||[]).slice(0,3).map(g => <span key={g} className="tag tag-g">{g}</span>)}
              </div>
              <p className="w-desc" id="wdesc" onClick={e=>e.currentTarget.classList.toggle('open')}>{curAnime.desc || '...'}</p>

              {/* NEXT EP */}
              {curEp && episodes.find(e=>e.number===curEp.number+1) && (
                <div className="next-ep-bar">
                  <span className="next-ep-lbl">Up Next</span>
                  <span className="next-ep-name">Ep {curEp.number+1}: {episodes.find(e=>e.number===curEp.number+1)?.title||`Episode ${curEp.number+1}`}</span>
                  <button className="next-btn" onClick={()=>playEpisode(episodes.find(e=>e.number===curEp.number+1))}>▶ Play</button>
                </div>
              )}

              {/* COMMENTS */}
              <div className="cmts">
                <div className="cm-hd">💬 Episode Discussion <span style={{color:'var(--mist)',fontSize:'.68rem',fontWeight:400,fontFamily:"'JetBrains Mono',monospace"}}>{curEp?`(${(comments[`${curAnime.id}_${curEp.number}`]||[]).length})`:'—'}</span></div>
                <div className="cm-row">
                  <textarea className="cm-input" value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder="Share your thoughts on this episode..." />
                  <button className="cm-post" onClick={postComment}>Post</button>
                </div>
                {curEp && (comments[`${curAnime.id}_${curEp.number}`]||[]).length > 0
                  ? (comments[`${curAnime.id}_${curEp.number}`]||[]).map((c,i) => (
                      <div key={i} className="cm-item">
                        <div className="cm-av">{c.user.slice(0,2).toUpperCase()}</div>
                        <div><div className="cm-user">{c.user}</div><div className="cm-text">{c.text}</div><div className="cm-time">{c.time}</div></div>
                      </div>
                    ))
                  : <div style={{color:'var(--mist)',fontSize:'.75rem',fontFamily:"'JetBrains Mono',monospace"}}>Be the first to comment on this episode!</div>
                }
              </div>
            </div>

            {/* EP PANEL */}
            <div className="ep-panel">
              <div className="ep-top">
                <span className="ep-top-t">Episodes</span>
                <span className="ep-top-c">{epFetching ? 'Loading...' : `${episodes.length} ep${episodes.length!==1?'s':''}`}</span>
              </div>
              <div className="ep-si-wrap">
                <input className="ep-si" value={epSearch} onChange={e=>setEpSearch(e.target.value)} placeholder="Search episodes..." />
              </div>
              {!epSearch && chunks.length > 1 && (
                <div className="ep-chunks">
                  {chunks.map((_,i) => {
                    const s = i*CHUNK+1, e2 = Math.min((i+1)*CHUNK, episodes.length);
                    return <button key={i} className={`chunk-btn${chunkIdx===i?' on':''}`} onClick={()=>setChunkIdx(i)}>{s}–{e2}</button>;
                  })}
                </div>
              )}
              <div className="ep-scroll">
                {epFetching ? (
                  <div style={{padding:'1.5rem',textAlign:'center',color:'var(--mist)',fontSize:'.75rem',fontFamily:"'JetBrains Mono',monospace"}}>Fetching episodes...</div>
                ) : visibleEps.length === 0 ? (
                  <div style={{padding:'1.5rem',color:'var(--mist)',fontSize:'.75rem',fontFamily:"'JetBrains Mono',monospace"}}>No episodes found</div>
                ) : visibleEps.map(ep => {
                  const isOn = curEp?.number === ep.number;
                  const isW = watchedEps[`${curAnime.id}_${ep.number}`];
                  return (
                    <div key={ep.number} className={`ep-item${isOn?' on':''}${isW?' watched':''}`} onClick={() => playEpisode(ep)}>
                      <div className="ep-thumb-n">EP {ep.number}</div>
                      <div className="ep-info">
                        <div className="ep-label">Episode {ep.number}</div>
                        <div className="ep-name">{ep.title || `Episode ${ep.number}`}</div>
                      </div>
                      <span className="ep-dot" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast${toast.show?' on':''}`}>
        <span style={{color:'var(--red)'}}>✓</span>
        <span>{toast.msg}</span>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────
function AnimeGrid({ animes, onOpen }) {
  return (
    <div className="grid">
      {animes.map(a => (
        <div key={a.id} className="card" onClick={() => onOpen(a)}>
          <div className="card-art">
            {a.img && <img src={a.img} alt={a.title} loading="lazy" onError={e=>{e.target.parentNode.style.background='var(--s3)';e.target.remove()}} />}
            <div className="card-glow"/>
            <div className="card-play">▶</div>
            <div className="card-badge">
              <span className="bdg bdg-s">SUB</span>
              {a.eps ? <span className="bdg bdg-e">EP {a.eps}</span> : null}
            </div>
            {a.score && <div className="card-score">⭐ {a.score}</div>}
          </div>
          <div className="card-body">
            <div className="card-title">{a.title}</div>
            <div className="card-meta">
              {a.format && <span>{a.format}</span>}
              {a.genres?.[0] && <><span className="card-meta-sep"/><span>{a.genres[0]}</span></>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleGrid({ schedule, onOpen, seed }) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const fallback = days.map((_,i) => seed.slice(i*3,i*3+3));

  return (
    <div className="sched" style={{marginBottom:'3rem'}}>
      {days.map((d,i) => {
        const items = schedule && Object.keys(schedule).length ? (schedule[i]||[]) : [];
        const fb = fallback[i]||[];
        return (
          <div key={d} className={`sday${i===today?' now':''}`}>
            <div className="sday-lbl">{i===today?'▶ TODAY':d}</div>
            {items.length > 0 ? items.map((s,j) => (
              <div key={j}>
                <div className="sday-anime" onClick={()=>onOpen(s.media.id)}>{s.media.title?.english||s.media.title?.romaji}</div>
                <div className="sday-ep">Ep {s.episode}</div>
              </div>
            )) : fb.map((a,j) => (
              <div key={j}>
                <div className="sday-anime" onClick={()=>onOpen(a.id)}>{a.title}</div>
                <div className="sday-ep">New Ep</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
