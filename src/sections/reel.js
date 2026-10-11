// Showreel player in a modal <dialog>. Self-hosted files in three sizes, 1080p by default.
// Any [data-reel-open] button opens it, and the #showreel link (used in the CV) opens it on load.
const SOURCES = { 1080: './media/showreel-2026-1080.mp4', 720: './media/showreel-2026-720.mp4', 480: './media/showreel-2026-480.mp4' }
const DEFAULT_QUALITY = '1080'
const HASH = '#showreel'

const fmt = s => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function initReel({ t }) {
  const dialog = document.querySelector('.reel')
  if (!dialog) return
  const box = dialog.querySelector('.reel__box')
  const video = dialog.querySelector('.reel__video')
  const big = dialog.querySelector('.reel__big')
  const playBtn = dialog.querySelector('.reel__play')
  const seek = dialog.querySelector('.reel__seek')
  const time = dialog.querySelector('.reel__time')
  const muteBtn = dialog.querySelector('.reel__mute')
  const volume = dialog.querySelector('.reel__vol')
  const quality = dialog.querySelector('.reel__quality')
  const fullBtn = dialog.querySelector('.reel__full')
  const closeBtn = dialog.querySelector('.reel__close')

  let loaded = false
  const load = q => {
    const at = video.currentTime
    const wasPlaying = loaded && !video.paused
    video.src = SOURCES[q]
    loaded = true
    if (at > 0) video.addEventListener('loadedmetadata', () => { video.currentTime = at }, { once: true })
    if (wasPlaying) video.play()?.catch(() => {})
  }

  const play = () => {
    if (!loaded) load(quality.value)
    video.play()?.catch(() => {})
  }
  const toggle = () => (video.paused ? play() : video.pause())

  const syncPlay = () => {
    const playing = !video.paused
    dialog.classList.toggle('is-playing', playing)
    playBtn.setAttribute('aria-label', t(playing ? 'reel.pause' : 'reel.play'))
  }
  const syncTime = () => {
    const d = video.duration || 0
    seek.max = d || 100
    seek.value = video.currentTime
    seek.style.setProperty('--p', d ? `${(video.currentTime / d) * 100}%` : '0%')
    time.textContent = `${fmt(video.currentTime)} / ${fmt(d)}`
  }
  const syncVolume = () => {
    const muted = video.muted || video.volume === 0
    dialog.classList.toggle('is-muted', muted)
    muteBtn.setAttribute('aria-label', t(muted ? 'reel.unmute' : 'reel.mute'))
    volume.value = muted ? 0 : video.volume
    volume.style.setProperty('--p', `${(muted ? 0 : video.volume) * 100}%`)
  }

  video.addEventListener('play', syncPlay)
  video.addEventListener('pause', syncPlay)
  video.addEventListener('ended', syncPlay)
  video.addEventListener('timeupdate', syncTime)
  video.addEventListener('loadedmetadata', syncTime)
  video.addEventListener('volumechange', syncVolume)
  video.addEventListener('click', toggle)
  big.addEventListener('click', play)
  playBtn.addEventListener('click', toggle)
  seek.addEventListener('input', () => {
    if (!loaded) load(quality.value)
    video.currentTime = Number(seek.value)
    syncTime()
  })
  muteBtn.addEventListener('click', () => {
    if (video.muted || video.volume === 0) {
      video.muted = false
      if (video.volume === 0) video.volume = 1
    } else video.muted = true
  })
  volume.addEventListener('input', () => {
    video.volume = Number(volume.value)
    video.muted = video.volume === 0
  })
  quality.addEventListener('change', () => { if (loaded) load(quality.value) })

  // Fullscreen the whole box so the custom controls stay visible. iPhone Safari only allows
  // fullscreen on the video element itself, so fall back to its native player there.
  const canBoxFullscreen = !!box.requestFullscreen
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else if (canBoxFullscreen) box.requestFullscreen().catch(() => {})
    else if (video.webkitEnterFullscreen) { play(); video.webkitEnterFullscreen() }
  })
  document.addEventListener('fullscreenchange', () => {
    const on = document.fullscreenElement === box
    dialog.classList.toggle('is-full', on)
    fullBtn.setAttribute('aria-label', t(on ? 'reel.exitFull' : 'reel.full'))
  })

  const open = ({ autoplay }) => {
    if (dialog.open) return
    dialog.showModal()
    document.documentElement.classList.add('reel-open')
    if (location.hash !== HASH) history.replaceState(null, '', HASH)
    if (autoplay) play()
    else big.focus()
  }
  const close = () => { if (dialog.open) dialog.close() }

  dialog.addEventListener('close', () => {
    video.pause()
    if (document.fullscreenElement) document.exitFullscreen()
    document.documentElement.classList.remove('reel-open')
    if (location.hash === HASH) history.replaceState(null, '', location.pathname + location.search)
  })
  closeBtn.addEventListener('click', close)
  // A click on the dimmed backdrop (the dialog itself, outside the box) closes it
  dialog.addEventListener('click', e => { if (e.target === dialog) close() })

  dialog.addEventListener('keydown', e => {
    if (e.target.closest('input, select')) return
    if (e.key === ' ' || e.key === 'k') {
      if (e.target.closest('button') && e.key === ' ') return
      e.preventDefault(); toggle()
    } else if (e.key === 'm') video.muted = !video.muted
    else if (e.key === 'f') fullBtn.click()
    else if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration || 0, video.currentTime + 5)
    else if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5)
  })

  quality.value = DEFAULT_QUALITY
  document.querySelectorAll('[data-reel-open]').forEach(btn => btn.addEventListener('click', () => open({ autoplay: true })))
  // Opened from a link: browsers block sound without a click, so wait for the play button
  if (location.hash === HASH) open({ autoplay: false })
  window.addEventListener('hashchange', () => { if (location.hash === HASH) open({ autoplay: false }) })

  syncPlay()
  syncVolume()
  syncTime()
}
