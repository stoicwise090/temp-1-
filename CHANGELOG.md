# Changelog

## [1.0.0] - 2024-05-21

### Added
- **Concurrency Protection**: Implemented Web Locks API (`navigator.locks`) to prevent race conditions during booking transactions across multiple tabs.
- **Booking Cancellation**: Users can now click on seats they have booked (highlighted in teal with a hover effect) to cancel them.
- **Unit Tests**: Added Vitest configuration and a comprehensive test suite (`tests/api.test.ts`) covering booking flows, conflicts, and cancellation.
- **Linting**: Added ESLint and Prettier configuration.

### Changed
- **Dependencies**: Pinned React and React DOM to version 18.2.0 for stability.
- **Simulation**: Hardened traffic simulation to ensure valid seat generation and prevent "ghost" errors.
- **UI**: Improved "My Booking" visual cues in `SeatMap` to indicate interactivity.

### Fixed
- Fixed potential data corruption when multiple simulation intervals ran simultaneously.
- Fixed an issue where the simulation would abort if it generated an invalid seat ID.
