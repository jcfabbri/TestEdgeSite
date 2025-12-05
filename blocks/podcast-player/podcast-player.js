/**
 * Parse ID3v2 tags from MP3 file to extract title and artist
 * Bitwise operations are necessary for parsing binary ID3 tag data
 * @param {string} url - URL of the MP3 file
 * @returns {Promise<{title: string|null, artist: string|null}>}
 */
/* eslint-disable no-bitwise */
async function parseID3Tags(url) {
  try {
    // Fetch the first 10KB of the file (enough for ID3v2 header and common tags)
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-10240' },
    });

    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);

    // Check for ID3v2 header: "ID3"
    if (
      view.getUint8(0) !== 0x49 // I
      || view.getUint8(1) !== 0x44 // D
      || view.getUint8(2) !== 0x33 // 3
    ) {
      return { title: null, artist: null };
    }

    // Get ID3v2 version
    const majorVersion = view.getUint8(3);

    // Calculate tag size (syncsafe integer)
    const size = (view.getUint8(6) << 21)
      | (view.getUint8(7) << 14)
      | (view.getUint8(8) << 7)
      | view.getUint8(9);

    let title = null;
    let artist = null;

    // Parse frames starting at byte 10
    let offset = 10;
    const maxOffset = Math.min(10 + size, buffer.byteLength);

    while (offset < maxOffset - 10) {
      // Read frame ID (4 bytes for ID3v2.3+, 3 bytes for ID3v2.2)
      let frameId;
      let frameSize;
      let headerSize;

      if (majorVersion >= 3) {
        frameId = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3),
        );

        if (majorVersion === 4) {
          // ID3v2.4 uses syncsafe integers for frame size
          frameSize = (view.getUint8(offset + 4) << 21)
            | (view.getUint8(offset + 5) << 14)
            | (view.getUint8(offset + 6) << 7)
            | view.getUint8(offset + 7);
        } else {
          // ID3v2.3 uses regular integers
          frameSize = view.getUint32(offset + 4);
        }
        headerSize = 10;
      } else {
        // ID3v2.2
        frameId = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
        );
        frameSize = (view.getUint8(offset + 3) << 16)
          | (view.getUint8(offset + 4) << 8)
          | view.getUint8(offset + 5);
        headerSize = 6;
      }

      // Stop if we hit padding or invalid frame
      if (frameId.charCodeAt(0) === 0 || frameSize === 0) break;

      // Check for title and artist frames
      const isTitleFrame = frameId === 'TIT2' || frameId === 'TT2';
      const isArtistFrame = frameId === 'TPE1' || frameId === 'TP1';

      if (isTitleFrame || isArtistFrame) {
        const dataOffset = offset + headerSize;
        const encoding = view.getUint8(dataOffset);
        let text = '';

        // Parse based on encoding
        if (encoding === 0 || encoding === 3) {
          // ISO-8859-1 or UTF-8
          const bytes = new Uint8Array(buffer, dataOffset + 1, frameSize - 1);
          text = new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1').decode(bytes);
        } else if (encoding === 1 || encoding === 2) {
          // UTF-16 with BOM or UTF-16BE
          const bytes = new Uint8Array(buffer, dataOffset + 1, frameSize - 1);
          text = new TextDecoder('utf-16').decode(bytes);
        }

        // Clean up null terminators and trim
        text = text.replace(/\0/g, '').trim();

        if (isTitleFrame) title = text;
        if (isArtistFrame) artist = text;
      }

      offset += headerSize + frameSize;

      // Stop if we found both
      if (title && artist) break;
    }

    return { title, artist };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not parse ID3 tags:', e);
    return { title: null, artist: null };
  }
}
/* eslint-enable no-bitwise */

export default function decorate(block) {
  // Extract the MP3 URL from the block content
  const urlElement = block.querySelector('p');
  const audioUrl = urlElement?.textContent?.trim();

  if (!audioUrl) {
    block.innerHTML = '<p class="podcast-error">No audio URL provided</p>';
    return;
  }

  // Clear original content
  block.textContent = '';

  // Create audio element
  const audio = document.createElement('audio');
  audio.src = audioUrl;
  audio.preload = 'metadata';

  // Create player container
  const player = document.createElement('div');
  player.className = 'podcast-player-ui';

  // Create metadata section (hidden by default, shown if metadata exists)
  const metadataSection = document.createElement('div');
  metadataSection.className = 'podcast-metadata';

  const titleEl = document.createElement('div');
  titleEl.className = 'podcast-title';

  const artistEl = document.createElement('div');
  artistEl.className = 'podcast-artist';

  metadataSection.appendChild(titleEl);
  metadataSection.appendChild(artistEl);

  // Create controls container (play button + progress)
  const controlsSection = document.createElement('div');
  controlsSection.className = 'podcast-controls';

  // Create play/pause button
  const playBtn = document.createElement('button');
  playBtn.className = 'podcast-play-btn';
  playBtn.setAttribute('aria-label', 'Play');
  playBtn.innerHTML = `
    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  `;

  // Create progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'podcast-progress-section';

  // Create time display (current)
  const currentTime = document.createElement('span');
  currentTime.className = 'podcast-time podcast-current-time';
  currentTime.textContent = '0:00';

  // Create progress bar container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'podcast-progress-container';

  const progressBar = document.createElement('div');
  progressBar.className = 'podcast-progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'podcast-progress-fill';

  const progressHandle = document.createElement('div');
  progressHandle.className = 'podcast-progress-handle';

  progressBar.appendChild(progressFill);
  progressBar.appendChild(progressHandle);
  progressContainer.appendChild(progressBar);

  // Create time display (duration)
  const durationTime = document.createElement('span');
  durationTime.className = 'podcast-time podcast-duration-time';
  durationTime.textContent = '0:00';

  // Assemble progress section
  progressSection.appendChild(currentTime);
  progressSection.appendChild(progressContainer);
  progressSection.appendChild(durationTime);

  // Assemble controls section
  controlsSection.appendChild(playBtn);
  controlsSection.appendChild(progressSection);

  // Assemble player
  player.appendChild(metadataSection);
  player.appendChild(controlsSection);

  block.appendChild(audio);
  block.appendChild(player);

  // Fetch and display ID3 metadata
  parseID3Tags(audioUrl).then(({ title, artist }) => {
    if (title || artist) {
      player.classList.add('has-metadata');
      if (title) {
        titleEl.textContent = title;
      }
      if (artist) {
        artistEl.textContent = artist;
      }
    }
  });

  // Helper function to format time
  function formatTime(seconds) {
    if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Update progress bar
  function updateProgress() {
    const { currentTime: ct, duration } = audio;
    if (duration > 0) {
      const percent = (ct / duration) * 100;
      progressFill.style.width = `${percent}%`;
      progressHandle.style.left = `${percent}%`;
    }
    currentTime.textContent = formatTime(ct);
  }

  // Play/Pause toggle
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  // Update button state on play/pause
  audio.addEventListener('play', () => {
    player.classList.add('playing');
    playBtn.setAttribute('aria-label', 'Pause');
  });

  audio.addEventListener('pause', () => {
    player.classList.remove('playing');
    playBtn.setAttribute('aria-label', 'Play');
  });

  // Update duration when metadata loads
  audio.addEventListener('loadedmetadata', () => {
    durationTime.textContent = formatTime(audio.duration);
  });

  // Update progress as audio plays
  audio.addEventListener('timeupdate', updateProgress);

  // Scrubbing functionality
  let isDragging = false;

  function scrub(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
    updateProgress();
  }

  progressBar.addEventListener('click', scrub);

  progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    scrub(e);
    progressContainer.classList.add('scrubbing');
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      scrub(e);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      progressContainer.classList.remove('scrubbing');
    }
  });

  // Touch support for mobile
  progressBar.addEventListener('touchstart', (e) => {
    isDragging = true;
    progressContainer.classList.add('scrubbing');
    const touch = e.touches[0];
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
    updateProgress();
  });

  progressBar.addEventListener('touchmove', (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      audio.currentTime = percent * audio.duration;
      updateProgress();
    }
  });

  progressBar.addEventListener('touchend', () => {
    isDragging = false;
    progressContainer.classList.remove('scrubbing');
  });

  // Reset on ended
  audio.addEventListener('ended', () => {
    player.classList.remove('playing');
    playBtn.setAttribute('aria-label', 'Play');
    audio.currentTime = 0;
    updateProgress();
  });
}
