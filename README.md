# klocki-typescript
Yet another voxel game client

Features:
- compiles to JavaScript
- fast rendering
- even faster rendering
- faster than the original game
- 1% of the original game features

# Running

`
npm run build
`


Copy `/dist/` to your https server (the extra *s* to get orientation on mobile)

Write your own websocket server proxying to the block game server

# Getting even more FPS

`
chrome.exe --disable-gpu-vsync --disable-frame-rate-limit
`

