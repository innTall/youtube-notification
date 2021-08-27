import express from 'express';
import xmlparser from 'express-xml-bodyparser';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';

const port = process.env.PORT || 3000;
const pshbUrl = 'https://pubsubhubbub.appspot.com/';

async function sendPshbRequest(req: express.Request, channelId: string, subscribe = true) {
  //  app URL
  const callbackUrl =  'https://' + req.hostname;

  // youtube feed url
  const topic = 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=';
  let mode = 'subscribe';

  if (!subscribe) {
    mode = 'un' + mode;
  }

  const form = new FormData();

  form.append('hub.callback', callbackUrl);
  form.append('hub.topic', topic + channelId);
  form.append('hub.verify', 'async');
  form.append('hub.mode', mode);

  return await nodeFetch(pshbUrl, {
    method: 'POST',
    body: form,
  });
}

const app = express();
app.use(express.json(),xmlparser());

// this is how we can use the discord client with the Express app
app.set('discordClient', 'DISCORD_CLIENT_INSTANCE');

app.post('/youtube', (req, res) => {
  try {
    const entry = req.body
      ?.feed
      ?.entry;

    const hasEntry = entry !== undefined;

    // if a video is uploaded or updated
    if (hasEntry) {
      console.log('entry data:', entry);
      const data = entry?.[0];

      const author = data
        ?.author
        ?.[0]
        ?.name
        ?.[0];

      const channelUrl = data
        ?.author
        ?.[0]
        ?.uri
        ?.[0];

      const videoUrl = data
        ?.link
        ?.[0]
        ?.['$']
        ?.href;

      const publishedDate = data
        ?.published
        ?.[0];

      const updatedDate = data
        ?.updated
        ?.[0];

      const channelId = data
        ?.['yt:channelid']
        ?.[0];

      const videoId = data
        ?.['yt:videoid']
        ?.[0];

      const title = data
        ?.title
        ?.[0];

      // TODO: check if channel ID in DB

      const videoData = {
        title, 
        author, 
        channelUrl,
        channelId,
        videoId, 
        videoUrl, 
        publishedDate, 
        updatedDate};
      console.log(videoData);

      // get the stored discord Client with req.app.get('discordClient');
      const discordClient = req.app.get('discordClient');

      // TODO: Then send message with discord client to appropriate text channel...
    }

    res.end();
  } catch (error) {
    res.send('error');
  }
});

app.post('/youtube/subscribe', async (req, res) => {
  try {
    const {channelId} = req.body;
    const resp = await sendPshbRequest(req, channelId, true);

    if (!resp.ok) {
      const message = await resp.text();
      throw {message};
    }

    // TODO: add to DB

    // get the stored discord Client with req.app.get('discordClient');
    const discordClient = req.app.get('discordClient');

    // TODO: Then send message with discord client to appropriate text channel...

    res.end('subscribed to ' + channelId);
  } catch (error) {
    console.log('error', error);
    res.status(500).end();
  }
});

app.post('/youtube/unsubscribe', async (req, res) => {
  try {
    const {channelId} = req.body;
    const resp = await sendPshbRequest(req,channelId, false);

    if (!resp.ok) {
      const message = await resp.text();
      throw {message};
    }

    //  TODO: remove from DB

    // get the stored discord Client with req.app.get('discordClient');
    const discordClient = req.app.get('discordClient');

    // TODO: Then send message with discord client to appropriate text channel...

    res.end('unsubscribed to ' + channelId);
  } catch (error) {
    console.log('error', error);
    res.status(500).end();
  }
});

app.listen(port, () => {
  console.log('App listening on port: ', port);
});