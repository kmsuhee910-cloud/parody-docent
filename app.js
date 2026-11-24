(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const tracks = window.EXHIBITION.tracks.map(track => ({ ...track }));
  const assetBase = new URL('assets/', document.currentScript.src);
  function assetPath(path) {
    if (!path || !path.startsWith('assets/')) return '';
    const url = new URL(path.slice(7), assetBase);
    return url.href.startsWith(assetBase.href) && !url.search && !url.hash ? url.href : '';
  }
  tracks.forEach(t => {
    t.thumbnail = assetPath(t.thumbnail ?? t.image);
    t.image = assetPath(t.image);
    t.audio = assetPath(t.audio);
  });
  window.EXHIBITION.titleLines.forEach(line => {
    const span = document.createElement('span'); span.textContent = line; $('exhibition-title').append(span);
  });
  let selected = 0, audio, generation = 0;
  let volume = 1, muted = false;
  const buttons = [];
  const format = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '—';
  function setImage(img, placeholder, source) {
    img.hidden = true; placeholder.hidden = false;
    img.onload = () => { img.hidden = false; placeholder.hidden = true; };
    img.onerror = () => { img.hidden = true; placeholder.hidden = false; };
    if (source) img.src = source; else img.removeAttribute('src');
  }
  function updateControls() {
    const ready = !!audio && Number.isFinite(audio.duration) && audio.duration > 0 && !audio.error;
    $('play').disabled = $('seek').disabled = $('mute').disabled = !ready;
    $('volume').disabled = !ready || !volumeSupported;
    $('play').textContent = audio && !audio.paused ? 'Ⅱ' : '▶';
    $('play').setAttribute('aria-label', audio && !audio.paused ? '일시정지' : '재생');
    $('mute').textContent = muted ? '×' : '♪';
    $('mute').setAttribute('aria-label', muted ? '음소거 해제' : '음소거');
    $('mute').setAttribute('aria-pressed', String(muted));
    $('time').textContent = `${format(ready ? audio.currentTime : 0)} / ${ready ? format(audio.duration) : '—'}`;
    $('seek').max = ready ? audio.duration : 100;
    $('seek').value = ready ? audio.currentTime : 0;
    $('seek').setAttribute('aria-valuetext', $('time').textContent);
  }
  const probe = new Audio();
  let volumeSupported = false;
  try { probe.volume = .5; volumeSupported = probe.volume === .5; } catch { /* Device volume controls apply. */ }
  if (!volumeSupported) { $('volume').hidden = true; $('mute').title = '기기의 음량 버튼을 사용하세요'; }
  function select(index) {
    generation++;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
    selected = index;
    const track = tracks[index];
    $('track-title').textContent = `${index + 1}. ${track.title}`;
    $('hero').alt = index === 0 ? '개념미술 작품 패러디 전시 포스터' : track.title;
    $('artwork').classList.toggle('frameless', track.frameless === true);
    setImage($('hero'), $('image-placeholder'), track.image);
    buttons.forEach((button, i) => {
      button.setAttribute('aria-current', String(i === index));
      button.querySelector('.selected-label').hidden = i !== index;
    });
    $('audio-status').textContent = track.audio ? '오디오 불러오는 중' : '오디오 준비 중';
    if (track.audio) {
      const token = generation;
      audio = new Audio(); audio.preload = 'metadata'; audio.muted = muted;
      try { audio.volume = volume; } catch { /* Native device volume. */ }
      ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'error'].forEach(event => {
        audio.addEventListener(event, () => {
          if (generation !== token) return;
          if (audio.error) $('audio-status').textContent = '오디오를 열 수 없습니다. 파일을 확인해 주세요.';
          else if (Number.isFinite(audio.duration)) $('audio-status').textContent = '재생 버튼을 눌러 감상하세요';
          updateControls();
        });
      });
      audio.src = track.audio;
    }
    updateControls();
    document.dispatchEvent(new CustomEvent('trackchange', { detail: { index } }));
  }
  tracks.forEach((track, i) => {
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.className = 'track';
    const thumbnail = document.createElement('span'); thumbnail.className = 'thumbnail';
    const img = document.createElement('img'); img.alt = '';
    const placeholder = document.createElement('span'); placeholder.textContent = String(i + 1).padStart(2, '0');
    thumbnail.append(img, placeholder); setImage(img, placeholder, track.thumbnail);
    const label = document.createElement('span'); label.className = 'track-label'; label.textContent = `${i + 1}. ${track.title}`;
    const current = document.createElement('span'); current.className = 'selected-label'; current.textContent = '선택됨';
    label.append(current); button.append(thumbnail, label); li.append(button); $('tracks').append(li);
    button.addEventListener('click', () => select(i)); buttons.push(button);
  });
  $('play').addEventListener('click', async () => {
    if (!audio) return;
    const current = audio;
    if (!current.paused) current.pause();
    else try { await current.play(); } catch { if (audio === current) $('audio-status').textContent = '재생하지 못했습니다. 다시 시도해 주세요.'; }
  });
  $('seek').addEventListener('input', () => { if (audio && Number.isFinite(audio.duration)) { audio.currentTime = Number($('seek').value); updateControls(); } });
  $('mute').addEventListener('click', () => { muted = !muted; if (audio) audio.muted = muted; updateControls(); });
  $('volume').addEventListener('input', () => { volume = Number($('volume').value); if (audio) { try { audio.volume = volume; } catch { $('volume').disabled = true; } } });
  // 작업자 페이지에만 연결되는 임시 메모리 미리보기 인터페이스입니다.
  if (document.body.dataset.worker === 'true') {
    window.guidePreview = {
      get selected() { return selected; },
      replace(index, kind, url) {
        if (!['image', 'audio'].includes(kind) || !url.startsWith('blob:')) return;
        tracks[index][kind] = url;
        if (kind === 'image') setImage(buttons[index].querySelector('img'), buttons[index].querySelector('.thumbnail span'), url);
        if (selected === index) select(index);
      }
    };
  }
  select(0);
})();
