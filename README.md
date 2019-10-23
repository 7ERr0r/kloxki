# klocki-typescript
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fklockimc%2Fklocki-typescript.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fklockimc%2Fklocki-typescript?ref=badge_shield)

![alt text](https://github.com/klockimc/klocki-typescript/raw/master/klocki_32render.png "Demo")

Yet another popular voxel game client

Features:
- 1% of the original game features
- all blocks from 1.14 added except there are no blockstates implemented
- laggy chunk meshing on the **main thread**
- networking in a worker, with zlib compression
- compiles to JavaScript, triggers GC every 2 seconds
- fast block rendering, but slows down at 32 chunks view distance
- fast entity rendering (tested with 600 creepers)
- walking/flying with the proper algorithm

TODO:
- remaining 99% of features

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




## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fklockimc%2Fklocki-typescript.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fklockimc%2Fklocki-typescript?ref=badge_large)
