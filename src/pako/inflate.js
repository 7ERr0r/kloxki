'use strict';


var zlib_inflate = require('./zlib/inflate');
var utils        = require('./utils/common');
var c            = require('./zlib/constants');
var ZStream      = require('./zlib/zstream');

var toString = Object.prototype.toString;

/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overridden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `_Z_FINISH` / `true` param) or if you
 * push a chunk with explicit flush (call [[Inflate#push]] with
 * `_Z_SYNC_FLUSH` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (_Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `_windowBits`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * _Klocki._log(inflate.result);
 * ```
 **/
function Inflate(options) {
  if (!(this instanceof Inflate)) return new Inflate(options);

  this.options = utils.assign({
    chunkSize: 16384,
    _windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force _window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt._windowBits >= 0) && (opt._windowBits < 16)) {
    opt._windowBits = -opt._windowBits;
    if (opt._windowBits === 0) { opt._windowBits = -15; }
  }

  // If `_windowBits` not defined (and _mode not raw) - set autodetect flag for gzip/deflate
  if ((opt._windowBits >= 0) && (opt._windowBits < 16) &&
      !(options && options._windowBits)) {
    opt._windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if _window size not set, force it to max when gzip possible
  if ((opt._windowBits > 15) && (opt._windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt._windowBits & 15) === 0) {
      opt._windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = _Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this._strm   = new ZStream();
  this._strm._avail_out = 0;

  var status  = zlib_inflate._inflateInit2(
    this._strm,
    opt._windowBits
  );

  if (status !== c._Z_OK) {
    throw new Error(status);
  }
}

/**
 * Inflate#push(data[, _mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data
 * - _mode (Number|Boolean): 0..6 for corresponding _Z_NO_FLUSH..Z_TREE _modes.
 *   See constants. Skipped or `false` means _Z_NO_FLUSH, `true` means _Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * _mode _Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use _mode _Z_SYNC_FLUSH, keeping the decompression context.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function (data, _mode) {
  var _strm = this._strm;
  var chunkSize = this.options.chunkSize;
  var status, __mode;
  var _next_out_utf8, tail, utf8str;

  // Flag to properly process _Z_BUF_ERROR on testing inflate call
  // when we check that all output data was flushed.
  var allowBufError = false;

  if (this.ended) { return false; }
  __mode = (_mode === ~~_mode) ? _mode : ((_mode === true) ? c._Z_FINISH : c._Z_NO_FLUSH);

  // Convert data if needed
  if (toString.call(data) === '[object ArrayBuffer]') {
    _strm._input = new Uint8Array(data);
  } else {
    _strm._input = data;
  }

  _strm._next_in = 0;
  _strm._avail_in = _strm._input.length;

  do {
    if (_strm._avail_out === 0) {
      _strm.output = new utils.Buf8(chunkSize);
      _strm._next_out = 0;
      _strm._avail_out = chunkSize;
    }

    status = zlib_inflate._inflate(_strm, c._Z_NO_FLUSH);    /* no bad return value */


    if (status === c._Z_BUF_ERROR && allowBufError === true) {
      status = c._Z_OK;
      allowBufError = false;
    }

    if (status !== c._Z_STREAM_END && status !== c._Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (_strm._next_out) {
      if (_strm._avail_out === 0 || status === c._Z_STREAM_END || (_strm._avail_in === 0 && (__mode === c._Z_FINISH || __mode === c._Z_SYNC_FLUSH))) {

        this.onData(utils.shrinkBuf(_strm.output, _strm._next_out));
      }
    }

    // When no more input data, we should check that internal inflate buffers
    // are flushed. The only way to do it when _avail_out = 0 - run one more
    // inflate pass. But if output data not exists, inflate return _Z_BUF_ERROR.
    // Here we set flag to process this error properly.
    //
    // NOTE. Deflate does not return error in this case and does not needs such
    // logic.
    if (_strm._avail_in === 0 && _strm._avail_out === 0) {
      allowBufError = true;
    }

  } while ((_strm._avail_in > 0 || _strm._avail_out === 0) && status !== c._Z_STREAM_END);

  if (status === c._Z_STREAM_END) {
    __mode = c._Z_FINISH;
  }

  // Finalize on the last chunk.
  if (__mode === c._Z_FINISH) {
    status = zlib_inflate._inflateEnd(this._strm);
    this.onEnd(status);
    this.ended = true;
    return status === c._Z_OK;
  }

  // callback interim results if _Z_SYNC_FLUSH.
  if (__mode === c._Z_SYNC_FLUSH) {
    this.onEnd(c._Z_OK);
    _strm._avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): output data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (_Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (_Z_FINISH) or should be flushed (_Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function (status) {
  // On success - join
  if (status === c._Z_OK) {
    this.result = utils.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this._strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - _windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative _windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   _Klocki._log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg || inflator.err; }

  return inflator.result;
}

exports.inflate = inflate;
