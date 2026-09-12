# CHANGELOG

## v1.3.2

- Fix: The Space-tap page scroll could look janky on some sites. Scrolling is now smooth everywhere.

## v1.3.1

- Improve: The extension now injects itself into already-open tabs automatically on install, update, or re-enable, so you no longer need to restart your browser after installing.

## v1.3.0

- Tap Space (or Shift + Space) without dragging to scroll the page — page
  scrolling now works on macOS too
- Removed the Ctrl / Cmd + Space shortcut (conflicted with Spotlight on macOS
  and input-source switchers)
- Scroll animation refined to match Chrome's native keyboard scroll; respects
  the "reduce motion" system setting
- Suppressed the flicker when tapping Space at the top or bottom of a page
- Drag scroll now works above modal dialogs (Popover API top layer)
- Custom key editor: Space also opens the editor (in addition to Enter); Escape
  cancels editing

## v1.2.1

- Fix a bug where right-clicking during scrolling did not deactivate the scroll mode.

## v1.2.0

- Removed the feature to switch functions by clicking the icon
- Added an options screen (popup)
- Added the ability to assign arbitrary keys
