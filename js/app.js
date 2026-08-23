/**
 * Euphony Official Website - Core Interactivity Engine
 * Features: 3-Way Theme Switcher, OS Auto-Detection, Web Audio Mini-Player Demo, FAQ Accordion, Checksum Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initOsDetection();
  initMiniPlayer();
  initFaqAccordion();
  initChecksumModal();
  initApkGuideModal();
  initMobileHamburger();
  initLatestReleaseSync();
});

/* ==========================================================================
   0. LATEST RELEASE SYNC
   Keeps every download link and version label pointed at the newest GitHub
   release, so the site never serves a stale APK after a new version ships.
   The hardcoded version in the markup is the fallback if the API is
   unreachable.
   ========================================================================== */
function initLatestReleaseSync() {
  const REPO = 'MohammedNihadv/Euphony';

  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((release) => {
      const tag = release.tag_name; // e.g. "v0.2.11"
      if (!tag) return;
      const assets = release.assets || [];

      // 1. Repoint every download link (APK, Windows .zip, macOS .zip, Linux
      //    .tar.gz) at the matching latest asset. Asset filenames are stable
      //    across releases, so match by the filename in the current href.
      document.querySelectorAll('a[href*="releases/download/"]').forEach((a) => {
        const href = a.getAttribute('href');
        const fname = href.substring(href.lastIndexOf('/') + 1);
        const asset = assets.find((x) => x.name === fname);
        if (asset) a.setAttribute('href', asset.browser_download_url);
      });

      // 2. Point the "view release" links at the current release page.
      document.querySelectorAll('a[href*="/releases/tag/"]').forEach((a) => {
        if (release.html_url) a.setAttribute('href', release.html_url);
      });

      // 3. Refresh visible version labels to the latest tag.
      document.querySelectorAll('.brand-badge').forEach((el) => {
        el.textContent = tag;
      });
      document
        .querySelectorAll('.version-pill, #hero-os-detected, #hero-os-name')
        .forEach((el) => {
          if (/v\d+\.\d+\.\d+/.test(el.textContent)) {
            el.textContent = el.textContent.replace(/v\d+\.\d+\.\d+/g, tag);
          }
        });
    })
    .catch(() => {
      /* Offline or rate-limited: the hardcoded version in the HTML stands. */
    });
}
/* ==========================================================================
   1. THREE-WAY THEME SWITCHER (Light, Dark, AMOLED)
   ========================================================================== */
function initThemeSwitcher() {
  const buttons = document.querySelectorAll('.theme-btn');
  const savedTheme = localStorage.getItem('euphony-theme') || 'light';

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('euphony-theme', theme);

    buttons.forEach(btn => {
      const btnTheme = btn.getAttribute('data-theme-value');
      if (btnTheme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Set initial theme
  setTheme(savedTheme);

  // Add click listeners
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTheme = btn.getAttribute('data-theme-value');
      setTheme(targetTheme);
    });
  });
}

/* ==========================================================================
   2. OPERATING SYSTEM AUTO-DETECTION & SMART RECOMMENDATIONS
   ========================================================================== */
function initOsDetection() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  let detectedOs = 'source'; // fallback

  if (/android/i.test(userAgent)) {
    detectedOs = 'android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    detectedOs = 'ios';
  } else if (/Win/i.test(userAgent)) {
    detectedOs = 'windows';
  } else if (/Mac/i.test(userAgent)) {
    detectedOs = 'macos';
  } else if (/Linux/i.test(userAgent)) {
    detectedOs = 'linux';
  }

  // Highlight corresponding download card
  const card = document.querySelector(`.download-card[data-platform="${detectedOs}"]`);
  if (card) {
    card.classList.add('is-recommended');
  }

  // Update hero download button label
  const heroBtnText = document.getElementById('hero-download-text');
  const heroOsBadge = document.getElementById('hero-os-name');

  if (heroOsBadge) {
    const osNames = {
      android: 'Android (v0.2.11)',
      ios: 'iOS (v0.2.11)',
      windows: 'Windows (v0.2.11)',
      macos: 'macOS (v0.2.11)',
      linux: 'Linux (v0.2.11)',
      source: 'Source Code'
    };
    heroOsBadge.textContent = osNames[detectedOs] || 'Free';

    const heroOsDetectedEl = document.getElementById('hero-os-detected');
    if (heroOsDetectedEl) {
      const osStatusMsg = {
        android: 'Android APK (Ready to Download • v0.2.11)',
        ios: 'iOS IPA — sideload with AltStore / Sideloadly (v0.2.11)',
        windows: 'Windows Desktop (Ready to Download • v0.2.11)',
        macos: 'macOS Desktop (Ready to Download • v0.2.11)',
        linux: 'Linux Desktop (Ready to Download • v0.2.11)',
        source: 'All platforms (Ready to Download • v0.2.11)'
      };
      heroOsDetectedEl.textContent = osStatusMsg[detectedOs] || 'Ready to Download • v0.2.11';
    }
  }

  // Bind hero download CTA to scroll to the recommended download or initiate
  const heroDownloadBtn = document.getElementById('hero-download-btn');
  if (heroDownloadBtn) {
    heroDownloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCard = document.querySelector(`.download-card[data-platform="${detectedOs}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash card highlight
        targetCard.style.transform = 'scale(1.03)';
        setTimeout(() => {
          targetCard.style.transform = '';
        }, 500);
      } else {
        document.getElementById('download').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* ==========================================================================
   3. INTERACTIVE NEO-BRUTALIST MINI-PLAYER (Web Audio API + Canvas Visualizer)
   ========================================================================== */
function initMiniPlayer() {
  const tracks = [
    {
      title: 'Neon Skyline (No Ads Edition)',
      artist: 'Euphony Sound • 0.2.0',
      duration: '3:45',
      durationSeconds: 225,
      frequency: 220,
      chord: [220, 277.18, 329.63] // A Major chord
    },
    {
      title: 'Uninterrupted Flow',
      artist: 'Open Source Beats • Neo-Brutalist',
      duration: '4:12',
      durationSeconds: 252,
      frequency: 261.63,
      chord: [261.63, 329.63, 392.00] // C Major chord
    },
    {
      title: 'Zero Subscription Groove',
      artist: 'Material 3 Ensemble',
      duration: '2:58',
      durationSeconds: 178,
      frequency: 196.00,
      chord: [196.00, 246.94, 293.66] // G Major chord
    },
    {
      title: 'Offline Freedom',
      artist: 'Neo-Brutalism Collective',
      duration: '3:30',
      durationSeconds: 210,
      frequency: 174.61,
      chord: [174.61, 220.00, 261.63] // F Major chord
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;
  let currentTime = 42; // simulated start time in seconds
  let timerInterval = null;
  let isLocalFileMode = false;
  let localAudioEl = null;

  // DOM elements
  const songTitleEl = document.getElementById('player-title');
  const artistNameEl = document.getElementById('player-artist');
  const playBtnEl = document.getElementById('btn-play-pause');
  const playIconEl = document.getElementById('play-icon');
  const prevBtnEl = document.getElementById('btn-prev');
  const nextBtnEl = document.getElementById('btn-next');
  const shuffleBtnEl = document.getElementById('btn-shuffle');
  const repeatBtnEl = document.getElementById('btn-repeat');
  const progressFillEl = document.getElementById('progress-fill');
  const progressCurrentEl = document.getElementById('progress-current');
  const progressTotalEl = document.getElementById('progress-total');
  const progressTrackEl = document.getElementById('progress-track');
  const playlistItems = document.querySelectorAll('.playlist-item');
  const localFileInput = document.getElementById('local-audio-input');

  // Canvas visualizer elements
  const canvas = document.getElementById('visualizerCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let animationId = null;

  // Web Audio Context & Analyser (created on first user gesture)
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let activeOscillators = [];
  let sequencerInterval = null;
  let beatStep = 0;

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function renderTrack(index) {
    isLocalFileMode = false;
    if (localAudioEl) {
      localAudioEl.pause();
    }
    const track = tracks[index];
    if (songTitleEl) songTitleEl.textContent = track.title;
    if (artistNameEl) artistNameEl.textContent = track.artist;
    if (progressTotalEl) progressTotalEl.textContent = track.duration;

    // Update active row in playlist
    playlistItems.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    updateProgressUI();
  }

  function updateProgressUI() {
    if (isLocalFileMode && localAudioEl && !isNaN(localAudioEl.duration)) {
      const pct = Math.min(100, (localAudioEl.currentTime / localAudioEl.duration) * 100);
      if (progressFillEl) progressFillEl.style.width = `${pct}%`;
      if (progressCurrentEl) progressCurrentEl.textContent = formatTime(localAudioEl.currentTime);
      if (progressTotalEl) progressTotalEl.textContent = formatTime(localAudioEl.duration);
    } else {
      const track = tracks[currentTrackIndex];
      const pct = Math.min(100, (currentTime / track.durationSeconds) * 100);
      if (progressFillEl) progressFillEl.style.width = `${pct}%`;
      if (progressCurrentEl) progressCurrentEl.textContent = formatTime(currentTime);
    }
  }

  // Web Audio Algorithmic Beat Sequencer (Synthwave / Chillhop / Funky Beats)
  function startWebAudio() {
    try {
      initAudioContext();
      stopWebAudio();

      if (isLocalFileMode && localAudioEl) {
        localAudioEl.play();
        return;
      }

      const track = tracks[currentTrackIndex];
      beatStep = 0;

      sequencerInterval = setInterval(() => {
        if (!isPlaying || !audioCtx) return;

        // 16-step rhythmic loop pattern
        const isKick = (beatStep % 4 === 0);
        const isSnare = (beatStep % 8 === 4);
        const isHiHat = (beatStep % 2 === 1);

        // Play Kick Drum
        if (isKick) {
          const kickOsc = audioCtx.createOscillator();
          const kickGain = audioCtx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
          kickOsc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.08);
          kickGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          kickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          kickOsc.connect(kickGain);
          kickGain.connect(analyser);
          analyser.connect(audioCtx.destination);
          kickOsc.start();
          kickOsc.stop(audioCtx.currentTime + 0.16);
        }

        // Play Snare / Clap Noise Burst
        if (isSnare) {
          const bufferSize = audioCtx.sampleRate * 0.08;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = audioCtx.createBufferSource();
          noise.buffer = buffer;
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 1000;
          const snareGain = audioCtx.createGain();
          snareGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          snareGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
          noise.connect(filter);
          filter.connect(snareGain);
          snareGain.connect(analyser);
          analyser.connect(audioCtx.destination);
          noise.start();
        }

        // Play Hi-Hat
        if (isHiHat) {
          const bufferSize = audioCtx.sampleRate * 0.03;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = audioCtx.createBufferSource();
          noise.buffer = buffer;
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 5000;
          const hatGain = audioCtx.createGain();
          hatGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
          hatGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
          noise.connect(filter);
          filter.connect(hatGain);
          hatGain.connect(analyser);
          analyser.connect(audioCtx.destination);
          noise.start();
        }

        // Play Melodic Arpeggio Note
        const noteFreq = track.chord[beatStep % track.chord.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = (currentTrackIndex % 2 === 0) ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteFreq * ((beatStep % 8 === 0) ? 0.5 : 1), audioCtx.currentTime);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(analyser);
        analyser.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.23);

        beatStep++;
      }, 240);
    } catch (e) {
      console.log('Web Audio API not supported or blocked:', e);
    }
  }

  function stopWebAudio() {
    if (sequencerInterval) {
      clearInterval(sequencerInterval);
      sequencerInterval = null;
    }
    if (isLocalFileMode && localAudioEl) {
      localAudioEl.pause();
    }
    if (audioCtx && activeOscillators.length > 0) {
      activeOscillators.forEach(item => {
        try {
          item.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
          setTimeout(() => item.osc.stop(), 250);
        } catch (e) {}
      });
      activeOscillators = [];
    }
  }

  function play() {
    isPlaying = true;
    if (playIconEl) {
      playIconEl.textContent = '⏸';
    }
    startWebAudio();
    startVisualizer();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isLocalFileMode && localAudioEl) {
        updateProgressUI();
      } else {
        const track = tracks[currentTrackIndex];
        currentTime++;
        if (currentTime >= track.durationSeconds) {
          nextTrack();
        } else {
          updateProgressUI();
        }
      }
    }, 1000);
  }

  function pause() {
    isPlaying = false;
    if (playIconEl) {
      playIconEl.textContent = '▶';
    }
    stopWebAudio();
    if (timerInterval) clearInterval(timerInterval);
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function nextTrack() {
    if (isShuffle) {
      currentTrackIndex = Math.floor(Math.random() * tracks.length);
    } else {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    }
    currentTime = 0;
    renderTrack(currentTrackIndex);
    if (isPlaying) {
      startWebAudio();
    }
  }

  function prevTrack() {
    currentTime = 0;
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    renderTrack(currentTrackIndex);
    if (isPlaying) {
      startWebAudio();
    }
  }

  // Real-Time Audio Visualizer Canvas Renderer (using FFT AnalyserNode)
  function startVisualizer() {
    if (!ctx || !canvas) return;
    if (animationId) cancelAnimationFrame(animationId);

    const barCount = 28;
    const barWidth = 8;
    const gap = 4;
    const maxBarHeight = 50;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const computedStyle = getComputedStyle(document.documentElement);
      const accentColor = computedStyle.getPropertyValue('--eu-accent').trim() || '#6A4BE8';
      const inkColor = computedStyle.getPropertyValue('--eu-ink').trim() || '#121218';

      const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;

      if (isPlaying && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < barCount; i++) {
        let height;
        if (isPlaying && analyser && dataArray) {
          // Real FFT frequency bin mapping
          const binIndex = Math.floor((i / barCount) * (dataArray.length * 0.7));
          const val = dataArray[binIndex] || 0;
          height = 10 + (val / 255) * maxBarHeight;
        } else if (isPlaying) {
          // Dynamic backup animation
          const time = Date.now() * 0.005;
          const wave = Math.sin(i * 0.4 + time) * 0.5 + 0.5;
          const wave2 = Math.cos(i * 0.7 - time * 1.3) * 0.5 + 0.5;
          height = 10 + (wave * wave2 * maxBarHeight);
        } else {
          // Resting pulse
          height = 6 + Math.sin(i * 0.5) * 4;
        }

        const x = Math.max(10, startX + i * (barWidth + gap));
        const y = canvas.height - height - 6;

        // Draw hard-shadow background rectangle
        ctx.fillStyle = inkColor;
        ctx.fillRect(x + 2, y + 2, barWidth, height);

        // Draw foreground bar
        ctx.fillStyle = accentColor;
        ctx.fillRect(x, y, barWidth, height);

        // Draw crisp border
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, barWidth, height);
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();
  }

  // Handle Local Audio File Input Selection
  if (localFileInput) {
    localFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      initAudioContext();
      stopWebAudio();

      const fileURL = URL.createObjectURL(file);
      if (localAudioEl) {
        localAudioEl.pause();
        localAudioEl.src = fileURL;
      } else {
        localAudioEl = new Audio(fileURL);
        const sourceNode = audioCtx.createMediaElementSource(localAudioEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
      }

      isLocalFileMode = true;
      if (songTitleEl) songTitleEl.textContent = file.name.replace(/\.[^/.]+$/, '');
      if (artistNameEl) artistNameEl.textContent = 'Local File • Offline Library';
      if (progressCurrentEl) progressCurrentEl.textContent = '0:00';

      playlistItems.forEach(item => item.classList.remove('active'));

      localAudioEl.addEventListener('loadedmetadata', () => {
        if (progressTotalEl) progressTotalEl.textContent = formatTime(localAudioEl.duration);
        updateProgressUI();
      });

      localAudioEl.addEventListener('ended', () => {
        pause();
      });

      play();
    });
  }

  // Event Listeners
  if (playBtnEl) playBtnEl.addEventListener('click', togglePlay);
  if (nextBtnEl) nextBtnEl.addEventListener('click', nextTrack);
  if (prevBtnEl) prevBtnEl.addEventListener('click', prevTrack);

  if (shuffleBtnEl) {
    shuffleBtnEl.addEventListener('click', () => {
      isShuffle = !isShuffle;
      shuffleBtnEl.classList.toggle('active-toggle', isShuffle);
    });
  }

  if (repeatBtnEl) {
    repeatBtnEl.addEventListener('click', () => {
      isRepeat = !isRepeat;
      repeatBtnEl.classList.toggle('active-toggle', isRepeat);
    });
  }

  if (progressTrackEl) {
    progressTrackEl.addEventListener('click', (e) => {
      const rect = progressTrackEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      if (isLocalFileMode && localAudioEl && !isNaN(localAudioEl.duration)) {
        localAudioEl.currentTime = pct * localAudioEl.duration;
        updateProgressUI();
      } else {
        const track = tracks[currentTrackIndex];
        currentTime = Math.floor(pct * track.durationSeconds);
        updateProgressUI();
      }
    });
  }

  // Playlist item clicks
  playlistItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      currentTrackIndex = idx;
      currentTime = 0;
      renderTrack(currentTrackIndex);
      play();
    });
  });

  // Initial render & visualizer start
  renderTrack(0);
  setTimeout(() => {
    if (canvas) {
      canvas.width = canvas.clientWidth || 400;
      canvas.height = canvas.clientHeight || 70;
      startVisualizer();
    }
  }, 100);

  // Resize canvas handler
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = canvas.clientWidth || 400;
      canvas.height = canvas.clientHeight || 70;
    }
  });
}

/* ==========================================================================
   4. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all others
        faqItems.forEach(i => i.classList.remove('active'));
        // Toggle clicked
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   5. SHA-256 CHECKSUM VERIFICATION MODAL
   ========================================================================== */
function initChecksumModal() {
  const backdrop = document.getElementById('checksum-modal');
  const triggerLinks = document.querySelectorAll('.checksum-link');
  const closeBtn = document.getElementById('btn-close-modal');
  const copyBtn = document.getElementById('btn-copy-checksum');
  const checksumTextEl = document.getElementById('checksum-hash-text');

  if (!backdrop) return;

  const sampleHashes = {
    android: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e',
    windows: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    linux: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    macos: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
  };

  triggerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = link.getAttribute('data-hash-platform') || 'android';
      if (checksumTextEl) {
        checksumTextEl.textContent = sampleHashes[platform] || sampleHashes.android;
      }
      backdrop.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      backdrop.classList.remove('active');
    });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.classList.remove('active');
    }
  });

  if (copyBtn && checksumTextEl) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(checksumTextEl.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied to Clipboard! ✓';
        copyBtn.style.backgroundColor = 'var(--eu-highlight)';
        copyBtn.style.color = 'var(--eu-on-highlight)';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.backgroundColor = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    });
  }
}

/* ==========================================================================
   6. APK ARCHITECTURE RECOMMENDATIONS GUIDE MODAL
   ========================================================================== */
function initApkGuideModal() {
  const backdrop = document.getElementById('apk-guide-modal');
  const triggerBtn = document.getElementById('btn-apk-guide');
  const closeBtn = document.getElementById('btn-close-apk-modal');

  if (!backdrop || !triggerBtn) return;

  triggerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    backdrop.classList.add('active');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      backdrop.classList.remove('active');
    });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.classList.remove('active');
    }
  });
}

/* ==========================================================================
   7. MOBILE HAMBURGER MENU DRAWER
   ========================================================================== */
function initMobileHamburger() {
  const hamburgerBtn = document.getElementById('btn-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburgerBtn || !mobileMenu) return;

  function toggleMenu() {
    const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
    hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    mobileMenu.setAttribute('aria-hidden', isExpanded);
  }

  function closeMenu() {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  hamburgerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenu();
  });

  // Close menu when any nav link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}
