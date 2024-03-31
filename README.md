# klocki-typescript

Features:
- basic TCP server communication
- displaying chunk packets
- displaying entities (creeper)
- player movement
- fast baking of chunks
- 3D audio HRTF
- player wings

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

