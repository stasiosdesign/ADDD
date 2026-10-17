// The 12-Column Grid overlay (src/components/ColumnGrid.astro): Shift + G
// shows it, and again hides it, at once: a reference layer, not an
// effect, so it has no entrance or exit, nothing is tweened, and nothing
// of it is left on the page once hidden (it is display: none).

export function initColumnGrid() {
  const grid = document.querySelector('[data-column-grid]');
  if (!grid || grid.dataset.gridReady) return;
  grid.dataset.gridReady = 'true';

  // The grid is always hidden on a fresh page load. It is only revealed with
  // Shift + G and deliberately does not retain that state in local storage.
  let isOpen = false;

  function syncState() {
    grid.dataset.gridOpen = String(isOpen);
    grid.style.display = isOpen ? 'block' : 'none';
  }
  function toggleGrid() {
    isOpen = !isOpen;
    syncState();
  }

  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const el = event.target;
    if (el?.closest('input, textarea, select') || el?.isContentEditable) return;
    if (!event.shiftKey || event.key.toLowerCase() !== 'g') return;
    event.preventDefault();
    toggleGrid();
  });
  syncState();
}
