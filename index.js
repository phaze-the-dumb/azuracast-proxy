const express = require('express');
const request = require('request');
const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');

if(!fs.existsSync('cachedImages'))
    fs.mkdirSync('cachedImages');

const app = express();
let azuraUrl = process.argv[2];

if(!azuraUrl.endsWith('/'))
    azuraUrl += '/';

if(!azuraUrl.startsWith('http://') || !azuraUrl.startsWith('https://'))
    azuraUrl = 'https://' + azuraUrl;

let cachedDatanp = null;
let cachedData = null;

let target = azuraUrl + 'listen/vrc_hell/radio.mp3';
https.get(target, resp => {
    if(resp.statusCode == 302) {
        target = resp.headers.location;
    }
});

app.get('/api/v1/np', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');

    if(cachedDatanp){
        res.json(cachedDatanp);
    } else{
        let data = await fetch(azuraUrl + 'api/nowplaying/1');
        let json = await data.json();

        cachedDatanp = {
            duration: json.now_playing.duration,
            song: {
                text: json.now_playing.song.text,
                artist: json.now_playing.song.artist,
                title: json.now_playing.song.title,
                album: json.now_playing.song.album,
                art: json.now_playing.song.art.replace(azuraUrl + 'api/station/1/art/', '/cdn/art/'),
            },
            elapsed: json.now_playing.elapsed,
            remaining: json.now_playing.remaining,
        }
        res.json(cachedDatanp)

        setTimeout(() => {
            cachedDatanp = null;
        }, 5000)
    }
})

app.get('/api/v1/live', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');

    if(cachedData){
        res.json(cachedData);
    } else{
        let data = await fetch(azuraUrl + 'api/nowplaying/1');
        let json = await data.json();

        cachedData = json.live
        res.json(cachedData)

        setTimeout(() => {
            cachedData = null;
        }, 1000)
    }
})

app.get('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    req.pipe(request.get(target)).pipe(res);
});

app.get('/cdn/art/:id', (req, res) => {
    fs.stat('cachedImages/'+req.params.id, (err, stat) => {
        if(err){
            let s = request.get(azuraUrl + 'api/station/1/art/'+req.params.id)
            
            s.pipe(fs.createWriteStream('cachedImages/'+req.params.id));
            s.pipe(res);
        } else{
            fs.createReadStream('cachedImages/'+req.params.id).pipe(res);
        }
    })
})

app.listen(80);