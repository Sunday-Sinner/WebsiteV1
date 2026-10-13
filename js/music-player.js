(() => {
  const players = [...document.querySelectorAll('[data-music-player]')];

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  players.forEach((player) => {
    const audio = player.querySelector('.music-player__audio');
    const toggle = player.querySelector('.music-player__toggle');
    const icon = player.querySelector('.music-player__icon');
    const seek = player.querySelector('.music-player__seek');
    const volume = player.querySelector('input[type="range"][aria-label^="Volume"]');
    const currentTime = player.querySelector('[data-current-time]');
    const duration = player.querySelector('[data-duration]');
    const status = player.querySelector('.music-player__status');

    if (!audio || !toggle || !icon || !seek || !volume || !currentTime || !duration || !status) return;

    const songTitle = toggle.getAttribute('aria-label').replace(/^(Play|Pause) /, '');
    let isSeeking = false;
    audio.volume = Number(volume.value);

    const updatePlaybackState = () => {
      const playing = !audio.paused && !audio.ended;
      icon.textContent = playing ? 'Ⅱ' : '▶';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${songTitle}`);
      toggle.setAttribute('aria-pressed', String(playing));
    };

    const updateTimeline = () => {
      currentTime.textContent = formatTime(audio.currentTime);

      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        seek.value = '0';
        seek.setAttribute('aria-valuetext', 'Track duration unavailable');
        return;
      }

      duration.textContent = formatTime(audio.duration);
      if (!isSeeking && document.activeElement !== seek) {
        seek.value = String((audio.currentTime / audio.duration) * 100);
      }
      seek.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} of ${formatTime(audio.duration)}`);
    };

    const pauseOtherPlayers = () => {
      players.forEach((otherPlayer) => {
        const otherAudio = otherPlayer.querySelector('.music-player__audio');
        if (otherAudio && otherAudio !== audio) otherAudio.pause();
      });
    };

    toggle.addEventListener('click', async () => {
      if (!audio.paused) {
        audio.pause();
        return;
      }

      pauseOtherPlayers();
      status.textContent = '';

      try {
        await audio.play();
      } catch (error) {
        status.textContent = 'Playback could not start. Please try again.';
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      toggle.disabled = false;
      seek.disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
      status.textContent = '';
      updateTimeline();
    });
    audio.addEventListener('durationchange', updateTimeline);
    audio.addEventListener('timeupdate', updateTimeline);
    audio.addEventListener('play', () => {
      pauseOtherPlayers();
      status.textContent = '';
      updatePlaybackState();
    });
    audio.addEventListener('pause', updatePlaybackState);
    audio.addEventListener('ended', updatePlaybackState);
    audio.addEventListener('error', () => {
      toggle.disabled = true;
      seek.disabled = true;
      status.textContent = 'This audio file could not be loaded. Please try again later.';
    });

    seek.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      isSeeking = true;
      const seekTime = (Number(seek.value) / 100) * audio.duration;
      audio.currentTime = seekTime;
      currentTime.textContent = formatTime(seekTime);
      seek.setAttribute('aria-valuetext', `${formatTime(seekTime)} of ${formatTime(audio.duration)}`);
    });

    seek.addEventListener('change', () => {
      isSeeking = false;
      updateTimeline();
    });

    seek.addEventListener('blur', () => {
      isSeeking = false;
      updateTimeline();
    });

    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value);
    });

    updatePlaybackState();
    updateTimeline();
  });
})();
