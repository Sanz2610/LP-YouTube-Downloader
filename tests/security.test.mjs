import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeVideoId,assertVideoId} from '../src/shared/video-id.js';
import {sanitizeError} from '../src/shared/errors.js';

test('video ID parser accepts watch and Shorts only on supported hosts',()=>{
  assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=jNQXAC9IVRw'),'jNQXAC9IVRw');
  assert.equal(youtubeVideoId('https://m.youtube.com/shorts/jNQXAC9IVRw'),'jNQXAC9IVRw');
  assert.equal(youtubeVideoId('https://www.youtube.com/playlist?list=abc'),'');
  assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=bad'),'');
  assert.equal(youtubeVideoId('https://www.youtube.com.attacker.test/watch?v=jNQXAC9IVRw'),'');
});
test('invalid IDs are rejected before reaching native helper',()=>assert.throws(()=>assertVideoId('playlist'),/không hợp lệ/));
test('public errors redact URLs and credential-shaped values',()=>{
  const result=sanitizeError('HTTP 403 https://r.example/video?signature=private&token=secret cookie=abc');
  assert.equal(result.includes('https://'),false);assert.equal(result.includes('private'),false);assert.equal(result.includes('secret'),false);assert.equal(result.includes('abc'),false);
});
