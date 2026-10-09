// The device screenshots scroll forever in CSS. Pause them while the section is off screen.
export function initWeb() {
  const devices = document.querySelector('.web__devices')
  if (!devices || !('IntersectionObserver' in window)) return
  devices.classList.add('is-paused')
  new IntersectionObserver(([entry]) => {
    devices.classList.toggle('is-paused', !entry.isIntersecting)
  }).observe(devices)
}
